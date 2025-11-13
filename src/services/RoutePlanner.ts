import {
  createWeight,
  dijkstraLexicographic,
  type GraphAdjacency,
  type GraphEdge,
  type LexicographicWeight,
} from "@/utils/graph";

import type {
  InterchangeStep,
  JourneyPlan,
  Line,
  RouteSegment,
  Station,
} from "@/types/metro";

export interface RoutePlannerDependencies {
  lines: Line[];
  stations: Station[];
}

export type RoutePlannerErrorCode =
  | "INVALID_STATION"
  | "SAME_STATION"
  | "UNREACHABLE";

export class RoutePlannerError extends Error {
  constructor(
    message: string,
    public readonly code: RoutePlannerErrorCode
  ) {
    super(message);
    this.name = "RoutePlannerError";
  }
}

const START_NODE = "__start__";
const GOAL_NODE = "__goal__";

interface StationOnLine {
  lineId: string;
  stationId: string;
}

type EdgeMetadata =
  | {
      type: "travel";
      lineId: string;
      fromStationId: string;
      toStationId: string;
    }
  | {
      type: "interchange";
      stationId: string;
      fromLineId: string;
      toLineId: string;
    }
  | {
      type: "virtual";
    };

export class RoutePlanner {
  private readonly lines: Map<string, Line>;
  private readonly stations: Map<string, Station>;
  private readonly lineStationOrder: Map<string, Map<string, number>>;

  constructor(dependencies: RoutePlannerDependencies) {
    const { lines, stations } = dependencies;
    this.lines = new Map(lines.map((line) => [line.id, line]));
    this.stations = new Map(stations.map((station) => [station.id, station]));
    this.lineStationOrder = this.computeLineStationOrder(lines);
  }

  planJourney(fromStationId: string, toStationId: string): JourneyPlan {
    if (fromStationId === toStationId) {
      throw new RoutePlannerError(
        "Already at the destination station.",
        "SAME_STATION"
      );
    }

    const startStation = this.stations.get(fromStationId);
    if (!startStation) {
      throw new RoutePlannerError(
        `Station "${fromStationId}" not found in the metro network.`,
        "INVALID_STATION"
      );
    }

    const destinationStation = this.stations.get(toStationId);
    if (!destinationStation) {
      throw new RoutePlannerError(
        `Station "${toStationId}" not found in the metro network.`,
        "INVALID_STATION"
      );
    }

    const graph = this.buildGraph();
    this.attachVirtualNodes(graph, startStation, destinationStation);

    const result = dijkstraLexicographic<EdgeMetadata>({
      graph,
      start: START_NODE,
      goal: GOAL_NODE,
      edgeWeight: (_from, edge) => this.edgeWeight(edge),
    });

    if (!result) {
      throw new RoutePlannerError(
        "No route found between the selected stations.",
        "UNREACHABLE"
      );
    }

    const journeyNodes = result.path
      .filter((node) => node !== START_NODE && node !== GOAL_NODE)
      .map(parseNodeId);

    if (journeyNodes.length === 0) {
      throw new RoutePlannerError(
        "No route found between the selected stations.",
        "UNREACHABLE"
      );
    }

    return this.composeJourneyPlan(journeyNodes);
  }

  private buildGraph(): GraphAdjacency<EdgeMetadata> {
    const graph: GraphAdjacency<EdgeMetadata> = {};

    for (const station of this.stations.values()) {
      for (const lineId of station.lines) {
        const nodeId = buildNodeId(lineId, station.id);
        graph[nodeId] ||= [];

        const connections = station.connections.filter(
          (connection) => connection.lineId === lineId
        );

        for (const connection of connections) {
          const targetNode = buildNodeId(
            connection.lineId,
            connection.stationId
          );
          graph[nodeId].push({
            to: targetNode,
            metadata: {
              type: "travel",
              lineId,
              fromStationId: station.id,
              toStationId: connection.stationId,
            },
          });
        }
      }

      if (station.isInterchange && station.lines.length > 1) {
        for (const fromLine of station.lines) {
          for (const toLine of station.lines) {
            if (fromLine === toLine) continue;
            const fromNode = buildNodeId(fromLine, station.id);
            const toNode = buildNodeId(toLine, station.id);
            graph[fromNode] ||= [];
            graph[fromNode].push({
              to: toNode,
              metadata: {
                type: "interchange",
                stationId: station.id,
                fromLineId: fromLine,
                toLineId: toLine,
              },
            });
          }
        }
      }
    }

    return graph;
  }

  private attachVirtualNodes(
    graph: GraphAdjacency<EdgeMetadata>,
    startStation: Station,
    destinationStation: Station
  ): void {
    graph[START_NODE] = startStation.lines.map<GraphEdge<EdgeMetadata>>(
      (lineId) => ({
        to: buildNodeId(lineId, startStation.id),
        metadata: { type: "virtual" },
      })
    );

    graph[GOAL_NODE] ||= [];

    for (const lineId of destinationStation.lines) {
      const nodeId = buildNodeId(lineId, destinationStation.id);
      graph[nodeId] ||= [];
      graph[nodeId].push({
        to: GOAL_NODE,
        metadata: { type: "virtual" },
      });
    }
  }

  private edgeWeight(edge: GraphEdge<EdgeMetadata>): LexicographicWeight {
    const metadata = edge.metadata;

    if (!metadata) {
      return createWeight();
    }

    if (metadata.type === "travel") {
      return createWeight(0, 1);
    }

    if (metadata.type === "interchange") {
      return createWeight(1, 0);
    }

    return createWeight();
  }

  private composeJourneyPlan(nodes: StationOnLine[]): JourneyPlan {
    const segments: RouteSegment[] = [];
    const interchanges: InterchangeStep[] = [];

    let currentSegment: SegmentAccumulator | null = null;

    for (let index = 0; index < nodes.length - 1; index += 1) {
      const current = nodes[index];
      const next = nodes[index + 1];

      if (current.lineId === next.lineId) {
        currentSegment = this.extendSegment(currentSegment, current, next);
        continue;
      }

      if (currentSegment) {
        segments.push(this.finalizeSegment(currentSegment));
        currentSegment = null;
      }

      interchanges.push(
        this.createInterchangeStep(nodes, index, current, next)
      );
    }

    if (currentSegment) {
      segments.push(this.finalizeSegment(currentSegment));
    }

    const totalStops = segments.reduce(
      (sum, segment) => sum + segment.stopCount,
      0
    );

    return {
      segments,
      interchanges,
      totalStops,
      totalInterchanges: interchanges.length,
    };
  }

  private extendSegment(
    segment: SegmentAccumulator | null,
    current: StationOnLine,
    next: StationOnLine
  ): SegmentAccumulator {
    if (!segment) {
      return {
        lineId: current.lineId,
        startStationId: current.stationId,
        endStationId: next.stationId,
        stops: 1,
      };
    }

    return {
      ...segment,
      endStationId: next.stationId,
      stops: segment.stops + 1,
    };
  }

  private finalizeSegment(segment: SegmentAccumulator): RouteSegment {
    const line = this.requireLine(segment.lineId);
    const startStation = this.requireStation(segment.startStationId);
    const endStation = this.requireStation(segment.endStationId);
    const terminalStationName = this.resolveTerminal(
      line,
      segment.startStationId,
      segment.endStationId
    );

    return {
      lineId: line.id,
      lineName: line.name,
      colorHex: line.colorHex,
      startStationId: startStation.id,
      endStationId: endStation.id,
      terminalStationName,
      stopCount: segment.stops,
    };
  }

  private createInterchangeStep(
    nodes: StationOnLine[],
    index: number,
    current: StationOnLine,
    next: StationOnLine
  ): InterchangeStep {
    const station = this.requireStation(current.stationId);
    const nextTerminal = this.resolveTerminalForUpcomingSegment(
      nodes,
      index,
      next
    );

    return {
      stationId: station.id,
      stationName: station.name,
      fromLineId: current.lineId,
      toLineId: next.lineId,
      nextTerminalStationName: nextTerminal,
    };
  }

  private resolveTerminalForUpcomingSegment(
    nodes: StationOnLine[],
    index: number,
    next: StationOnLine
  ): string {
    const line = this.requireLine(next.lineId);

    for (let i = index + 1; i < nodes.length; i += 1) {
      const candidate = nodes[i];
      if (candidate.lineId !== next.lineId) {
        break;
      }
      if (candidate.stationId !== next.stationId) {
        return this.resolveTerminal(line, next.stationId, candidate.stationId);
      }
    }

    return line.terminalEnd === next.stationId
      ? line.terminalStart
      : line.terminalEnd;
  }

  private resolveTerminal(
    line: Line,
    fromStationId: string,
    toStationId: string
  ): string {
    const stationPositions = this.lineStationOrder.get(line.id);

    if (!stationPositions) {
      return this.stationName(line.terminalEnd);
    }

    const fromIndex = stationPositions.get(fromStationId);
    const toIndex = stationPositions.get(toStationId);

    if (fromIndex === undefined || toIndex === undefined) {
      return this.stationName(line.terminalEnd);
    }

    const terminalId =
      toIndex > fromIndex ? line.terminalEnd : line.terminalStart;

    return this.stationName(terminalId);
  }

  private stationName(stationId: string): string {
    return this.requireStation(stationId).name;
  }

  private requireLine(lineId: string): Line {
    const line = this.lines.get(lineId);
    if (!line) {
      throw new RoutePlannerError(
        `Line "${lineId}" not found in the network.`,
        "INVALID_STATION"
      );
    }
    return line;
  }

  private requireStation(stationId: string): Station {
    const station = this.stations.get(stationId);
    if (!station) {
      throw new RoutePlannerError(
        `Station "${stationId}" not found in the network.`,
        "INVALID_STATION"
      );
    }
    return station;
  }

  private computeLineStationOrder(
    lines: Line[]
  ): Map<string, Map<string, number>> {
    const map = new Map<string, Map<string, number>>();

    for (const line of lines) {
      const positions = new Map<string, number>();
      line.stations.forEach((station, index) => {
        positions.set(station.id, index);
      });
      map.set(line.id, positions);
    }

    return map;
  }
}

function buildNodeId(lineId: string, stationId: string): string {
  return `${lineId}:${stationId}`;
}

function parseNodeId(nodeId: string): StationOnLine {
  const [lineId, stationId] = nodeId.split(":");
  return { lineId, stationId };
}

interface SegmentAccumulator {
  lineId: string;
  startStationId: string;
  endStationId: string;
  stops: number;
}

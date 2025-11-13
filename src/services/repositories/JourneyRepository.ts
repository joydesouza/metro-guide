import { RoutePlanner, RoutePlannerError } from "@/services/RoutePlanner";

import type { MetroDataSource } from "@/services/data-sources/LocalMetroDataSource";
import type {
  JourneyRequest,
  JourneyResult,
  JourneyPlan,
  LineSummary,
  Line,
  Station,
  StationSummary,
} from "@/types/metro";

export interface JourneyRepository {
  planJourney(request: JourneyRequest): Promise<JourneyResult>;
  listStations(prefix?: string): Promise<StationSummary[]>;
  listLines(): Promise<LineSummary[]>;
}

export interface JourneyRepositoryDependencies {
  dataSource: MetroDataSource;
}

export class JourneyRepositoryImpl implements JourneyRepository {
  protected readonly dataSource: MetroDataSource;
  private planner: RoutePlanner | null = null;
  private operationalNetwork:
    | {
        lines: Line[];
        stations: Station[];
      }
    | null = null;

  constructor(dependencies: JourneyRepositoryDependencies) {
    this.dataSource = dependencies.dataSource;
  }

  async planJourney(request: JourneyRequest): Promise<JourneyResult> {
    const { fromStationId, toStationId } = request;

    if (!fromStationId || !toStationId) {
      return {
        status: "invalid",
        reason: "bad-input",
        message: "Select both a starting station and a destination station.",
      };
    }

    try {
      const planner = await this.ensurePlanner();
      const plan = planner.planJourney(fromStationId, toStationId);
      const enrichedPlan = this.decoratePlanWithInterchanges(plan);
      return { status: "ok", plan: enrichedPlan };
    } catch (error) {
      if (error instanceof RoutePlannerError) {
        if (error.code === "SAME_STATION") {
          return {
            status: "invalid",
            reason: "same-station",
            message: "Already at destination. Choose a different station.",
          };
        }

        if (error.code === "UNREACHABLE") {
          return {
            status: "unreachable",
            message: "No route found",
          };
        }

        return {
          status: "invalid",
          reason: "bad-input",
          message: "One or more station selections are invalid.",
        };
      }

      throw error;
    }
  }

  async listStations(prefix?: string): Promise<StationSummary[]> {
    const { stations } = await this.getOperationalNetwork();

    const summaries = stations
      .map((station) => ({
        id: station.id,
        name: station.name,
        lineIds: station.lines,
        isInterchange: station.isInterchange,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!prefix) {
      return summaries;
    }

    const normalized = prefix.trim().toLowerCase();
    if (normalized.length === 0) {
      return summaries;
    }

    const startsWith: StationSummary[] = [];
    const contains: StationSummary[] = [];

    for (const station of summaries) {
      const name = station.name.toLowerCase();
      if (name.startsWith(normalized)) {
        startsWith.push(station);
      } else if (name.includes(normalized)) {
        contains.push(station);
      }
    }

    if (startsWith.length === 0 && contains.length === 0) {
      return summaries;
    }

    return [...startsWith, ...contains];
  }

  async listLines(): Promise<LineSummary[]> {
    const { lines } = await this.getOperationalNetwork();

    return lines.map((line) => ({
      id: line.id,
      name: line.name,
      colorHex: line.colorHex,
      terminalStart: line.terminalStart,
      terminalEnd: line.terminalEnd,
      isOperational: line.isOperational,
    }));
  }

  protected async ensurePlanner(): Promise<RoutePlanner> {
    if (!this.planner) {
      const network = await this.getOperationalNetwork();
      this.planner = new RoutePlanner(network);
    }
    return this.planner;
  }

  private decoratePlanWithInterchanges(plan: JourneyPlan): JourneyPlan {
    if (plan.interchanges.length === 0) {
      return plan;
    }

    const segments = plan.segments.map((segment, index) => {
      const interchange = plan.interchanges[index];
      if (!interchange) {
        return segment;
      }
      return {
        ...segment,
        interchangeAfter: interchange,
      };
    });

    return {
      ...plan,
      segments,
    };
  }

  private async getOperationalNetwork(): Promise<{
    lines: Line[];
    stations: Station[];
  }> {
    if (this.operationalNetwork) {
      return this.operationalNetwork;
    }

    const [lines, stations] = await Promise.all([
      this.dataSource.getLines(),
      this.dataSource.getStations(),
    ]);

    const network = filterOperationalNetwork(lines, stations);
    this.operationalNetwork = network;

    return network;
  }
}

function filterOperationalNetwork(lines: Line[], stations: Station[]): {
  lines: Line[];
  stations: Station[];
} {
  const operationalLines = lines
    .filter((line) => line.isOperational !== false)
    .map((line) => ({
      ...line,
      stations: line.stations.map((stationRef) => ({ ...stationRef })),
    }));

  const operationalLineIds = new Set(operationalLines.map((line) => line.id));

  const stationsWithOperationalLines = stations
    .map((station) => {
      const lineIds = station.lines.filter((lineId) =>
        operationalLineIds.has(lineId),
      );

      if (lineIds.length === 0) {
        return null;
      }

      return {
        ...station,
        lines: lineIds,
        connections: station.connections
          .filter((connection) => operationalLineIds.has(connection.lineId))
          .map((connection) => ({ ...connection })),
      };
    })
    .filter((station): station is Station => station !== null);

  const availableStationIds = new Set(
    stationsWithOperationalLines.map((station) => station.id),
  );

  const sanitisedStations = stationsWithOperationalLines.map((station) => ({
    ...station,
    isInterchange: station.isInterchange && station.lines.length > 1,
    connections: station.connections.filter((connection) =>
      availableStationIds.has(connection.stationId),
    ),
  }));

  const sanitisedLines = operationalLines.map((line) => ({
    ...line,
    stations: line.stations.filter((stationRef) =>
      availableStationIds.has(stationRef.id),
    ),
  }));

  return {
    lines: sanitisedLines,
    stations: sanitisedStations,
  };
}

import { RoutePlanner, RoutePlannerError } from "@/services/RoutePlanner";

import type { MetroDataSource } from "@/services/data-sources/LocalMetroDataSource";
import type {
  JourneyRequest,
  JourneyResult,
  LineSummary,
  StationSummary,
} from "@/types/metro";

export interface JourneyRepository {
  planJourney(request: JourneyRequest): Promise<JourneyResult>;
  listStations(): Promise<StationSummary[]>;
  listLines(): Promise<LineSummary[]>;
}

export interface JourneyRepositoryDependencies {
  dataSource: MetroDataSource;
}

export class JourneyRepositoryImpl implements JourneyRepository {
  protected readonly dataSource: MetroDataSource;
  private planner: RoutePlanner | null = null;

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
      return { status: "ok", plan };
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

  async listStations(): Promise<StationSummary[]> {
    const stations = await this.dataSource.getStations();

    return stations.map((station) => ({
      id: station.id,
      name: station.name,
      lineIds: station.lines,
      isInterchange: station.isInterchange,
    }));
  }

  async listLines(): Promise<LineSummary[]> {
    const lines = await this.dataSource.getLines();

    return lines.map((line) => ({
      id: line.id,
      name: line.name,
      colorHex: line.colorHex,
      terminalStart: line.terminalStart,
      terminalEnd: line.terminalEnd,
    }));
  }

  protected async ensurePlanner(): Promise<RoutePlanner> {
    if (!this.planner) {
      const [lines, stations] = await Promise.all([
        this.dataSource.getLines(),
        this.dataSource.getStations(),
      ]);
      this.planner = new RoutePlanner({ lines, stations });
    }
    return this.planner;
  }
}

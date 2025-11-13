export type Direction = "forward" | "backward";

export interface StationConnection {
  lineId: string;
  stationId: string;
  direction: Direction;
}

export interface Station {
  id: string;
  name: string;
  lines: string[];
  connections: StationConnection[];
  isInterchange: boolean;
}

export interface StationRef {
  id: string;
  name: string;
}

export interface Line {
  id: string;
  name: string;
  colorHex: string;
  isOperational: boolean;
  stations: StationRef[];
  terminalStart: string;
  terminalEnd: string;
}

export interface RouteSegment {
  lineId: string;
  lineName: string;
  colorHex: string;
  startStationId: string;
  endStationId: string;
  terminalStationName: string;
  stopCount: number;
  interchangeAfter?: InterchangeStep;
}

export interface InterchangeStep {
  stationId: string;
  stationName: string;
  fromLineId: string;
  fromLineName: string;
  fromLineColorHex: string;
  toLineId: string;
  toLineName: string;
  toLineColorHex: string;
  nextTerminalStationName: string;
}

export interface JourneyPlan {
  segments: RouteSegment[];
  interchanges: InterchangeStep[];
  totalStops: number;
  totalInterchanges: number;
}

export type JourneyStatus = "ok" | "invalid" | "unreachable";

export interface JourneyRequest {
  fromStationId: string;
  toStationId: string;
}

export type JourneyResult =
  | {
      status: "ok";
      plan: JourneyPlan;
    }
  | {
      status: "invalid";
      reason: "same-station" | "bad-input";
      message: string;
    }
  | {
      status: "unreachable";
      message: "No route found";
    };

export interface StationSummary {
  id: string;
  name: string;
  lineIds: string[];
  isInterchange: boolean;
}

export interface LineSummary {
  id: string;
  name: string;
  colorHex: string;
  terminalStart: string;
  terminalEnd: string;
  isOperational: boolean;
}

export interface JourneyPlanSummary {
  totalStops: number;
  totalInterchanges: number;
}

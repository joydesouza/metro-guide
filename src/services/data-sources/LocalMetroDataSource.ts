import networkData from "@/data/metro-network.json";

import type { Line, Station } from "@/types/metro";

export interface MetroDataSource {
  getLines(): Promise<Line[]>;
  getStations(): Promise<Station[]>;
  getVersion(): Promise<string | undefined>;
}

type MetroNetworkSchema = {
  version?: string;
  lines: Line[];
  stations: Station[];
};

function cloneLines(lines: Line[]): Line[] {
  return lines.map((line) => ({
    ...line,
    stations: line.stations.map((station) => ({ ...station })),
  }));
}

function cloneStations(stations: Station[]): Station[] {
  return stations.map((station) => ({
    ...station,
    connections: station.connections.map((connection) => ({ ...connection })),
  }));
}

export class LocalMetroDataSource implements MetroDataSource {
  private readonly network: MetroNetworkSchema;

  constructor(schema: MetroNetworkSchema = networkData as MetroNetworkSchema) {
    this.network = schema;
  }

  async getLines(): Promise<Line[]> {
    return cloneLines(this.network.lines);
  }

  async getStations(): Promise<Station[]> {
    return cloneStations(this.network.stations);
  }

  async getVersion(): Promise<string | undefined> {
    return this.network.version;
  }
}

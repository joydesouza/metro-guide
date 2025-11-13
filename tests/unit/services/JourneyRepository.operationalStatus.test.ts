import { describe, expect, it } from "vitest";

import { LocalMetroDataSource } from "@/services/data-sources/LocalMetroDataSource";
import {
  JourneyRepositoryImpl,
  type JourneyRepository,
} from "@/services/repositories/JourneyRepository";

import type { Direction, Line, Station } from "@/types/metro";

const forward: Direction = "forward";
const backward: Direction = "backward";

const lines: Line[] = [
  {
    id: "alpha",
    name: "Alpha Line",
    colorHex: "#111111",
    isOperational: true,
    terminalStart: "a1",
    terminalEnd: "a3",
    stations: [
      { id: "a1", name: "Alpha One" },
      { id: "junction", name: "Central Junction" },
      { id: "a3", name: "Alpha Three" },
    ],
  },
  {
    id: "beta",
    name: "Beta Line",
    colorHex: "#222222",
    isOperational: false,
    terminalStart: "junction",
    terminalEnd: "b2",
    stations: [
      { id: "junction", name: "Central Junction" },
      { id: "b2", name: "Beta Two" },
    ],
  },
];

const stations: Station[] = [
  {
    id: "a1",
    name: "Alpha One",
    lines: ["alpha"],
    isInterchange: false,
    connections: [
      { lineId: "alpha", stationId: "junction", direction: forward },
    ],
  },
  {
    id: "junction",
    name: "Central Junction",
    lines: ["alpha", "beta"],
    isInterchange: true,
    connections: [
      { lineId: "alpha", stationId: "a1", direction: backward },
      { lineId: "alpha", stationId: "a3", direction: forward },
      { lineId: "beta", stationId: "b2", direction: forward },
    ],
  },
  {
    id: "a3",
    name: "Alpha Three",
    lines: ["alpha"],
    isInterchange: false,
    connections: [
      { lineId: "alpha", stationId: "junction", direction: backward },
    ],
  },
  {
    id: "b2",
    name: "Beta Two",
    lines: ["beta"],
    isInterchange: false,
    connections: [
      { lineId: "beta", stationId: "junction", direction: backward },
    ],
  },
];

describe("JourneyRepository operational status handling", () => {
  const repository: JourneyRepository = new JourneyRepositoryImpl({
    dataSource: new LocalMetroDataSource({
      version: "test-network",
      lines,
      stations,
    }),
  });

  it("excludes stations that belong only to non-operational lines", async () => {
    const summaries = await repository.listStations();
    const stationIds = summaries.map((station) => station.id);

    expect(stationIds).toContain("a1");
    expect(stationIds).toContain("junction");
    expect(stationIds).toContain("a3");
    expect(stationIds).not.toContain("b2");

    const junction = summaries.find((station) => station.id === "junction");
    expect(junction?.isInterchange).toBe(false);
  });

  it("prevents planning journeys that rely on non-operational lines", async () => {
    const result = await repository.planJourney({
      fromStationId: "a1",
      toStationId: "b2",
    });

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.reason).toBe("bad-input");
    }
  });
});

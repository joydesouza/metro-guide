import { describe, expect, it, beforeAll } from "vitest";

import { LocalMetroDataSource } from "@/services/data-sources/LocalMetroDataSource";
import { RoutePlanner } from "@/services/RoutePlanner";

let planner: RoutePlanner;

describe("RoutePlanner", () => {
  beforeAll(async () => {
    const dataSource = new LocalMetroDataSource();
    const [lines, stations] = await Promise.all([
      dataSource.getLines(),
      dataSource.getStations(),
    ]);

    planner = new RoutePlanner({ lines, stations });
  });

  it("computes the lexicographically optimal journey with an interchange", () => {
    const plan = planner.planJourney(
      "central-silk-board",
      "sandal-soap-factory"
    );

    expect(plan.totalInterchanges).toBe(1);
    expect(plan.totalStops).toBe(8);
    expect(plan.segments).toHaveLength(2);
    expect(plan.segments[0]).toMatchObject({
      lineId: "yellow",
      lineName: "Yellow Line",
      startStationId: "central-silk-board",
      endStationId: "rv-road",
      terminalStationName: "RV Road",
      stopCount: 4,
    });
    expect(plan.segments[1]).toMatchObject({
      lineId: "green",
      lineName: "Green Line",
      startStationId: "rv-road",
      endStationId: "sandal-soap-factory",
      terminalStationName: "Madavara",
      stopCount: 4,
    });
    expect(plan.interchanges).toHaveLength(1);
    expect(plan.interchanges[0]).toMatchObject({
      stationId: "rv-road",
      fromLineId: "yellow",
      toLineId: "green",
      nextTerminalStationName: "Madavara",
    });
  });

  it("computes a journey staying on a single line", () => {
    const plan = planner.planJourney("lalbagh", "mantri-square");

    expect(plan.totalInterchanges).toBe(0);
    expect(plan.segments).toHaveLength(1);
    expect(plan.segments[0]).toMatchObject({
      lineId: "green",
      startStationId: "lalbagh",
      endStationId: "mantri-square",
      stopCount: 2,
    });
  });

  it("throws for identical start and end stations", () => {
    expect(() => planner.planJourney("rv-road", "rv-road")).toThrow(
      /already at the destination/i
    );
  });

  it("throws when a station id is unknown", () => {
    expect(() => planner.planJourney("unknown-station", "rv-road")).toThrow(
      /not found/i
    );
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JourneySteps } from "@/components/JourneySteps";

import type { JourneyPlan, StationSummary } from "@/types/metro";

const stations: StationSummary[] = [
  {
    id: "central-silk-board",
    name: "Central Silk Board",
    lineIds: ["yellow"],
    isInterchange: false,
  },
  {
    id: "rv-road",
    name: "RV Road",
    lineIds: ["yellow", "green"],
    isInterchange: true,
  },
  {
    id: "sandal-soap-factory",
    name: "Sandal Soap Factory",
    lineIds: ["green"],
    isInterchange: false,
  },
];

const interchangeDetails = {
  stationId: "rv-road",
  stationName: "RV Road",
  fromLineId: "yellow",
  fromLineName: "Yellow Line",
  fromLineColorHex: "#ffd400",
  toLineId: "green",
  toLineName: "Green Line",
  toLineColorHex: "#009F3D",
  nextTerminalStationName: "Silk Institute",
} as const;

const journeyPlan: JourneyPlan = {
  segments: [
    {
      lineId: "yellow",
      lineName: "Yellow Line",
      colorHex: "#ffd400",
      startStationId: "central-silk-board",
      endStationId: "rv-road",
      terminalStationName: "Nagasandra",
      stopCount: 3,
      interchangeAfter: interchangeDetails,
    },
    {
      lineId: "green",
      lineName: "Green Line",
      colorHex: "#009F3D",
      startStationId: "rv-road",
      endStationId: "sandal-soap-factory",
      terminalStationName: "Silk Institute",
      stopCount: 2,
    },
  ],
  interchanges: [interchangeDetails],
  totalStops: 5,
  totalInterchanges: 1,
};

describe("JourneySteps interchange emphasis", () => {
  it("highlights interchange steps with terminal direction callouts", () => {
    render(<JourneySteps plan={journeyPlan} stations={stations} />);

    const interchange = screen.getByRole("note");
    expect(interchange).toHaveClass("journey-steps__interchange");
    expect(interchange).toHaveTextContent(
      /interchange at rv road\. switch to green line towards silk institute\./i,
    );
    expect(interchange).toHaveStyle("--journey-steps-line-color: #009F3D");

    const lineChip = screen.getByText("Green Line");
    expect(lineChip).toHaveClass("journey-steps__interchange-line");

    const terminalDirection = screen.getByText("Silk Institute", {
      selector: ".journey-steps__interchange-direction",
    });
    expect(terminalDirection).toBeInTheDocument();
  });
});

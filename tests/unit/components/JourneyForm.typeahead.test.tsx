import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { JourneyForm } from "@/components/JourneyForm";

import type { JourneyRequest, StationSummary } from "@/types/metro";

const stations: StationSummary[] = [
  {
    id: "central-silk-board",
    name: "Central Silk Board",
    lineIds: ["yellow"],
    isInterchange: false,
  },
  {
    id: "sandal-soap-factory",
    name: "Sandal Soap Factory",
    lineIds: ["green"],
    isInterchange: false,
  },
  {
    id: "rv-road",
    name: "RV Road",
    lineIds: ["yellow", "green"],
    isInterchange: true,
  },
  {
    id: "majestic",
    name: "Nadaprabhu Kempegowda Stn., Majestic",
    lineIds: ["purple", "green"],
    isInterchange: true,
  },
];

describe("JourneyForm type-ahead combobox", () => {
  it("allows keyboard navigation and selection of station suggestions", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((request: JourneyRequest) => request);
    const searchStations = vi.fn(async (query: string) => {
      const normalized = query.toLowerCase();
      return stations.filter((station) =>
        station.name.toLowerCase().includes(normalized),
      );
    });

    render(
      <JourneyForm
        stations={stations}
        onSearchStations={searchStations}
        onSubmit={handleSubmit}
        isLoadingStations={false}
        isPlanningJourney={false}
      />,
    );

    const [fromInput, toInput] = screen.getAllByRole("combobox");

    await act(async () => {
      await user.click(fromInput);
    });
    await act(async () => {
      await user.type(fromInput, "silk");
    });

    await screen.findByRole("option", { name: /central silk board/i });

    await act(async () => {
      await user.keyboard("{ArrowDown}{Enter}");
    });
    expect(fromInput).toHaveValue("Central Silk Board");

    await act(async () => {
      await user.click(toInput);
    });
    await act(async () => {
      await user.type(toInput, "sandal");
    });

    await screen.findByRole("option", { name: /sandal soap factory/i });

    await act(async () => {
      await user.keyboard("{ArrowDown}{Enter}");
    });
    expect(toInput).toHaveValue("Sandal Soap Factory");

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /plan journey/i }));
    });

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      fromStationId: "central-silk-board",
      toStationId: "sandal-soap-factory",
    });
  });
});

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeAll } from "vitest";

import { JourneyPlannerPage } from "@/pages/JourneyPlanner";
import { LocalMetroDataSource } from "@/services/data-sources/LocalMetroDataSource";
import { JourneyRepositoryImpl } from "@/services/repositories/JourneyRepository";
import { RoutePlanner } from "@/services/RoutePlanner";

import type { JourneyRequest, JourneyResult } from "@/types/metro";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

class TestJourneyRepository extends JourneyRepositoryImpl {
  private readonly planner: RoutePlanner;

  constructor(planner: RoutePlanner) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    super({ dataSource: new LocalMetroDataSource() });
    this.planner = planner;
  }

  async planJourney(request: JourneyRequest): Promise<JourneyResult> {
    const plan = this.planner.planJourney(
      request.fromStationId,
      request.toStationId
    );
    return {
      status: "ok",
      plan,
    };
  }
}

let repository: TestJourneyRepository;

describe("JourneyPlanner Page", () => {
  beforeAll(async () => {
    const dataSource = new LocalMetroDataSource();
    const [lines, stations] = await Promise.all([
      dataSource.getLines(),
      dataSource.getStations(),
    ]);

    const planner = new RoutePlanner({ lines, stations });
    repository = new TestJourneyRepository(planner);
  });

  it("guides a commuter through planning a journey between two stations", async () => {
    const user = userEvent.setup();

    render(<JourneyPlannerPage journeyRepository={repository} />);
    await act(async () => {
      await flushPromises();
    });

    const fromInput = await screen.findByRole("combobox", {
      name: /from station/i,
    });
    const toInput = await screen.findByRole("combobox", {
      name: /to station/i,
    });
    const submitButton = screen.getByRole("button", { name: /plan journey/i });

    expect(submitButton).toBeDisabled();

    await act(async () => {
      await user.selectOptions(fromInput, "central-silk-board");
      await user.selectOptions(toInput, "sandal-soap-factory");
    });

    await waitFor(() => expect(submitButton).toBeEnabled());

    await act(async () => {
      await user.click(submitButton);
      await flushPromises();
    });

    await screen.findByRole("heading", { name: /journey steps/i });

    expect(
      screen.getByRole("heading", { level: 3, name: /step 1: yellow line/i })
    ).toBeInTheDocument();
    const interchangeItem = screen.getByRole("note");
    expect(interchangeItem).toHaveTextContent(/interchange at rv road/i);
    expect(
      screen.getByRole("heading", { level: 3, name: /step 2: green line/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/have a great journey!/i)).toBeInTheDocument();
  });
});

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeAll } from "vitest";

import { JourneyPlannerPage } from "@/pages/JourneyPlanner";
import { LocalMetroDataSource } from "@/services/data-sources/LocalMetroDataSource";
import { JourneyRepositoryImpl } from "@/services/repositories/JourneyRepository";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

let repository: JourneyRepositoryImpl;

describe("JourneyPlanner Page", () => {
  beforeAll(async () => {
    repository = new JourneyRepositoryImpl({
      dataSource: new LocalMetroDataSource(),
    });
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
      await user.click(fromInput);
    });
    await act(async () => {
      await user.type(fromInput, "Central");
    });
    await screen.findByRole("option", {
      name: /central silk board/i,
    });
    await act(async () => {
      await user.keyboard("{ArrowDown}{Enter}");
    });
    await waitFor(() => expect(fromInput).toHaveValue("Central Silk Board"));

    await act(async () => {
      await user.click(toInput);
    });
    await act(async () => {
      await user.type(toInput, "Sandal");
    });
    await screen.findByRole("option", {
      name: /sandal soap factory/i,
    });
    await act(async () => {
      await user.keyboard("{ArrowDown}{Enter}");
    });
    await waitFor(() => expect(toInput).toHaveValue("Sandal Soap Factory"));

    await waitFor(() => expect(submitButton).toBeEnabled());

    await act(async () => {
      await user.click(submitButton);
      await flushPromises();
    });

    await screen.findByRole("heading", { name: /journey steps/i });

    expect(
      screen.getByRole("heading", { level: 3, name: /step 1: yellow line/i }),
    ).toBeInTheDocument();
    const interchangeItem = screen.getByRole("note");
    expect(interchangeItem).toHaveTextContent(/interchange at rv road/i);
    expect(
      screen.getByRole("heading", { level: 3, name: /step 2: green line/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/have a great journey!/i)).toBeInTheDocument();
  });
});

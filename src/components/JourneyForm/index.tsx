import { useEffect, useMemo, useState } from "react";

import type { JourneyRequest, StationSummary } from "@/types/metro";

export interface JourneyFormProps {
  stations: StationSummary[];
  isLoadingStations?: boolean;
  isPlanningJourney?: boolean;
  onSubmit: (request: JourneyRequest) => void;
  errorMessage?: string | null;
}

export function JourneyForm({
  stations,
  isLoadingStations = false,
  isPlanningJourney = false,
  onSubmit,
  errorMessage,
}: JourneyFormProps): JSX.Element {
  const [fromStationId, setFromStationId] = useState<string>("");
  const [toStationId, setToStationId] = useState<string>("");

  useEffect(() => {
    if (!stations.find((station) => station.id === fromStationId)) {
      setFromStationId("");
    }

    if (!stations.find((station) => station.id === toStationId)) {
      setToStationId("");
    }
  }, [stations, fromStationId, toStationId]);

  const stationOptions = useMemo(
    () =>
      stations
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((station) => (
          <option key={station.id} value={station.id}>
            {station.name}
            {station.isInterchange ? " (Interchange)" : ""}
          </option>
        )),
    [stations]
  );

  const isValidSelection = fromStationId !== "" && toStationId !== "";
  const isDisabled = !isValidSelection || isPlanningJourney;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidSelection) return;

    onSubmit({
      fromStationId,
      toStationId,
    });
  };

  return (
    <form
      className="journey-form card"
      onSubmit={handleSubmit}
      aria-busy={isPlanningJourney}
    >
      <fieldset disabled={isLoadingStations} className="journey-form__fieldset">
        <legend className="journey-form__legend">Plan your journey</legend>

        <label htmlFor="from-station" className="journey-form__label">
          From station
          <select
            id="from-station"
            name="fromStationId"
            className="journey-form__select"
            value={fromStationId}
            onChange={(event) => setFromStationId(event.target.value)}
            aria-label="From station"
          >
            <option value="" disabled>
              {isLoadingStations ? "Loading stations…" : "Select a station"}
            </option>
            {stationOptions}
          </select>
        </label>

        <label htmlFor="to-station" className="journey-form__label">
          To station
          <select
            id="to-station"
            name="toStationId"
            className="journey-form__select"
            value={toStationId}
            onChange={(event) => setToStationId(event.target.value)}
            aria-label="To station"
          >
            <option value="" disabled>
              {isLoadingStations ? "Loading stations…" : "Select a station"}
            </option>
            {stationOptions}
          </select>
        </label>

        <button
          type="submit"
          className="journey-form__submit"
          disabled={isDisabled}
        >
          {isPlanningJourney ? "Planning…" : "Plan journey"}
        </button>
      </fieldset>

      {errorMessage ? (
        <p role="alert" className="journey-form__error">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

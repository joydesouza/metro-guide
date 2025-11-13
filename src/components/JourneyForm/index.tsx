import { useEffect } from "react";

import {
  useStationSearch,
  type StationSearchController,
} from "@/hooks/useStationSearch";

import type { JourneyRequest, StationSummary } from "@/types/metro";

import "./JourneyForm.css";

export interface JourneyFormProps {
  stations: StationSummary[];
  onSearchStations: (query: string) => Promise<StationSummary[]>;
  isLoadingStations?: boolean;
  isPlanningJourney?: boolean;
  onSubmit: (request: JourneyRequest) => void;
  errorMessage?: string | null;
}

export function JourneyForm({
  stations,
  onSearchStations,
  isLoadingStations = false,
  isPlanningJourney = false,
  onSubmit,
  errorMessage,
}: JourneyFormProps): JSX.Element {
  const fromSearch = useStationSearch({
    initialStations: stations,
    fetchStations: onSearchStations,
    maxResults: 8,
  });
  const toSearch = useStationSearch({
    initialStations: stations,
    fetchStations: onSearchStations,
    maxResults: 8,
  });

  const {
    query: fromQuery,
    setQuery: setFromQuery,
    open: openFrom,
    close: closeFrom,
    isOpen: isFromOpen,
    suggestions: fromSuggestions,
    highlightedIndex: fromHighlightedIndex,
    highlightNext: highlightNextFrom,
    highlightPrevious: highlightPreviousFrom,
    selectStation: selectFromStation,
    selectHighlighted: selectHighlightedFrom,
    selectedStation: fromSelectedStation,
    isLoading: isFromLoading,
  } = fromSearch;

  const {
    query: toQuery,
    setQuery: setToQuery,
    open: openTo,
    close: closeTo,
    isOpen: isToOpen,
    suggestions: toSuggestions,
    highlightedIndex: toHighlightedIndex,
    highlightNext: highlightNextTo,
    highlightPrevious: highlightPreviousTo,
    selectStation: selectToStation,
    selectHighlighted: selectHighlightedTo,
    selectedStation: toSelectedStation,
    isLoading: isToLoading,
  } = toSearch;

  useEffect(() => {
    if (isLoadingStations) {
      closeFrom();
      closeTo();
    }
  }, [isLoadingStations, closeFrom, closeTo]);

  const fromStationId = fromSelectedStation?.id ?? "";
  const toStationId = toSelectedStation?.id ?? "";

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

  const fromFieldId = "from-station";
  const fromListboxId = `${fromFieldId}-listbox`;
  const fromActiveOption =
    isFromOpen && fromHighlightedIndex !== null
      ? fromSuggestions[fromHighlightedIndex]
      : undefined;
  const fromActiveDescendant = fromActiveOption
    ? `${fromFieldId}-option-${fromActiveOption.id}`
    : undefined;

  const toFieldId = "to-station";
  const toListboxId = `${toFieldId}-listbox`;
  const toActiveOption =
    isToOpen && toHighlightedIndex !== null
      ? toSuggestions[toHighlightedIndex]
      : undefined;
  const toActiveDescendant = toActiveOption
    ? `${toFieldId}-option-${toActiveOption.id}`
    : undefined;

  return (
    <form
      className="journey-form card"
      onSubmit={handleSubmit}
      aria-busy={isPlanningJourney}
    >
      <fieldset disabled={isLoadingStations} className="journey-form__fieldset">
        <label htmlFor="from-station" className="journey-form__label">
          From station
          <div className="journey-form__combobox">
            <input
              id={fromFieldId}
              name="fromStationId"
              type="text"
              role="combobox"
              className="journey-form__input"
              value={fromQuery}
              onChange={(event) => setFromQuery(event.target.value)}
              onFocus={() => openFrom()}
              onBlur={() => closeFrom()}
              onKeyDown={(event) =>
                handleComboboxKeyDown(event, {
                  highlightNext: highlightNextFrom,
                  highlightPrevious: highlightPreviousFrom,
                  selectHighlighted: selectHighlightedFrom,
                  close: closeFrom,
                })
              }
              placeholder={
                isLoadingStations ? "Loading stations…" : "Search for a station"
              }
              aria-label="From station"
              aria-autocomplete="list"
              aria-expanded={isFromOpen}
              aria-controls={fromListboxId}
              aria-haspopup="listbox"
              aria-busy={isFromLoading}
              aria-activedescendant={fromActiveDescendant}
              autoComplete="off"
              inputMode="search"
            />
            {isFromOpen ? (
              <ul
                className="journey-form__options"
                role="listbox"
                id={fromListboxId}
                aria-busy={isFromLoading}
              >
                {isFromLoading ? (
                  <li
                    role="option"
                    aria-disabled="true"
                    className="journey-form__option journey-form__option--status"
                    aria-selected="false"
                  >
                    Searching stations…
                  </li>
                ) : fromSuggestions.length > 0 ? (
                  fromSuggestions.map((station, index) => {
                    const optionId = `${fromFieldId}-option-${station.id}`;
                    const isHighlighted = fromHighlightedIndex === index;
                    const optionClassName = `journey-form__option${
                      isHighlighted ? " journey-form__option--highlighted" : ""
                    }`;
                    return (
                      <li
                        key={station.id}
                        id={optionId}
                        role="option"
                        aria-selected={isHighlighted}
                        className={optionClassName}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectFromStation(station);
                        }}
                      >
                        <span className="journey-form__option-name">
                          {station.name}
                        </span>
                        {station.isInterchange ? (
                          <span className="journey-form__option-tag">
                            Interchange
                          </span>
                        ) : null}
                      </li>
                    );
                  })
                ) : (
                  <li
                    role="option"
                    aria-disabled="true"
                    className="journey-form__option journey-form__option--status"
                    aria-selected="false"
                  >
                    No matching stations
                  </li>
                )}
              </ul>
            ) : null}
          </div>
        </label>

        <label htmlFor="to-station" className="journey-form__label">
          To station
          <div className="journey-form__combobox">
            <input
              id={toFieldId}
              name="toStationId"
              type="text"
              role="combobox"
              className="journey-form__input"
              value={toQuery}
              onChange={(event) => setToQuery(event.target.value)}
              onFocus={() => openTo()}
              onBlur={() => closeTo()}
              onKeyDown={(event) =>
                handleComboboxKeyDown(event, {
                  highlightNext: highlightNextTo,
                  highlightPrevious: highlightPreviousTo,
                  selectHighlighted: selectHighlightedTo,
                  close: closeTo,
                })
              }
              placeholder={
                isLoadingStations ? "Loading stations…" : "Search for a station"
              }
              aria-label="To station"
              aria-autocomplete="list"
              aria-expanded={isToOpen}
              aria-controls={toListboxId}
              aria-haspopup="listbox"
              aria-busy={isToLoading}
              aria-activedescendant={toActiveDescendant}
              autoComplete="off"
              inputMode="search"
            />
            {isToOpen ? (
              <ul
                className="journey-form__options"
                role="listbox"
                id={toListboxId}
                aria-busy={isToLoading}
              >
                {isToLoading ? (
                  <li
                    role="option"
                    aria-disabled="true"
                    className="journey-form__option journey-form__option--status"
                    aria-selected="false"
                  >
                    Searching stations…
                  </li>
                ) : toSuggestions.length > 0 ? (
                  toSuggestions.map((station, index) => {
                    const optionId = `${toFieldId}-option-${station.id}`;
                    const isHighlighted = toHighlightedIndex === index;
                    const optionClassName = `journey-form__option${
                      isHighlighted ? " journey-form__option--highlighted" : ""
                    }`;
                    return (
                      <li
                        key={station.id}
                        id={optionId}
                        role="option"
                        aria-selected={isHighlighted}
                        className={optionClassName}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectToStation(station);
                        }}
                      >
                        <span className="journey-form__option-name">
                          {station.name}
                        </span>
                        {station.isInterchange ? (
                          <span className="journey-form__option-tag">
                            Interchange
                          </span>
                        ) : null}
                      </li>
                    );
                  })
                ) : (
                  <li
                    role="option"
                    aria-disabled="true"
                    className="journey-form__option journey-form__option--status"
                    aria-selected="false"
                  >
                    No matching stations
                  </li>
                )}
              </ul>
            ) : null}
          </div>
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

function handleComboboxKeyDown(
  event: React.KeyboardEvent<HTMLInputElement>,
  controller: Pick<
    StationSearchController,
    "highlightNext" | "highlightPrevious" | "selectHighlighted" | "close"
  >
): void {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    controller.highlightNext();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    controller.highlightPrevious();
    return;
  }

  if (event.key === "Enter") {
    const selected = controller.selectHighlighted();
    if (selected) {
      event.preventDefault();
    }
    return;
  }

  if (event.key === "Escape") {
    controller.close();
  }
}

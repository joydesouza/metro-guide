import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { StationSummary } from "@/types/metro";

export interface UseStationSearchOptions {
  initialStations: StationSummary[];
  fetchStations: (query: string) => Promise<StationSummary[]>;
  maxResults?: number;
}

export interface StationSearchController {
  query: string;
  setQuery: (value: string) => void;
  open: () => void;
  close: () => void;
  isOpen: boolean;
  suggestions: StationSummary[];
  highlightedIndex: number | null;
  highlightNext: () => void;
  highlightPrevious: () => void;
  selectStation: (station: StationSummary) => void;
  selectHighlighted: () => StationSummary | null;
  selectedStation: StationSummary | null;
  reset: () => void;
  isLoading: boolean;
}

export function useStationSearch(
  options: UseStationSearchOptions,
): StationSearchController {
  const { initialStations, fetchStations, maxResults = 8 } = options;
  const [query, setQueryState] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<StationSummary | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<StationSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const requestIdRef = useRef(0);

  const sortedInitialStations = useMemo(
    () => initialStations.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [initialStations],
  );

  useEffect(() => {
    if (query.trim() !== "") {
      return;
    }
    setSuggestions(sortedInitialStations.slice(0, maxResults));
    setIsLoading(false);
  }, [sortedInitialStations, query, maxResults]);

  useEffect(() => {
    if (!selectedStation) {
      return;
    }

    const stillExists = initialStations.some(
      (station) => station.id === selectedStation.id,
    );
    if (!stillExists) {
      setSelectedStation(null);
      setQueryState("");
    }
  }, [initialStations, selectedStation]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (suggestions.length === 0) {
      setHighlightedIndex(null);
      return;
    }

    setHighlightedIndex((current) => {
      if (current === null || current >= suggestions.length) {
        return 0;
      }
      return current;
    });
  }, [isOpen, suggestions]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === "") {
      return;
    }

    let cancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetchStations(trimmed);
        if (cancelled || requestId !== requestIdRef.current) {
          return;
        }
        const sorted = result
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, maxResults);
        setSuggestions(sorted);
      } catch (error) {
        if (!cancelled && requestId === requestIdRef.current) {
          console.error("Failed to search stations:", error);
          setSuggestions([]);
        }
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [query, fetchStations, maxResults]);

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      setIsOpen(true);
      if (!selectedStation || selectedStation.name !== value) {
        setSelectedStation(null);
      }
    },
    [selectedStation],
  );

  const selectStation = useCallback((station: StationSummary) => {
    setSelectedStation(station);
    setQueryState(station.name);
    setIsOpen(false);
    setHighlightedIndex(null);
  }, []);

  const selectHighlighted = useCallback(() => {
    if (highlightedIndex === null) {
      return null;
    }

    const station = suggestions[highlightedIndex];
    if (!station) {
      return null;
    }

    selectStation(station);
    return station;
  }, [highlightedIndex, suggestions, selectStation]);

  const highlightNext = useCallback(() => {
    if (suggestions.length === 0) {
      return;
    }

    setIsOpen(true);
    setHighlightedIndex((current) => {
      if (current === null) {
        return 0;
      }

      const nextIndex = current + 1;
      return nextIndex >= suggestions.length ? 0 : nextIndex;
    });
  }, [suggestions]);

  const highlightPrevious = useCallback(() => {
    if (suggestions.length === 0) {
      return;
    }

    setIsOpen(true);
    setHighlightedIndex((current) => {
      if (current === null) {
        return suggestions.length - 1;
      }

      const nextIndex = current - 1;
      return nextIndex < 0 ? suggestions.length - 1 : nextIndex;
    });
  }, [suggestions]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(null);
  }, []);

  const reset = useCallback(() => {
    setSelectedStation(null);
    setQueryState("");
    setHighlightedIndex(null);
    setIsOpen(false);
  }, []);

  return {
    query,
    setQuery,
    open,
    close,
    isOpen,
    suggestions,
    highlightedIndex,
    highlightNext,
    highlightPrevious,
    selectStation,
    selectHighlighted,
    selectedStation,
    reset,
    isLoading,
  };
}

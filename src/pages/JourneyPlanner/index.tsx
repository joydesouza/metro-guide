import { useCallback, useEffect, useMemo, useState } from "react";

import { JourneyForm } from "@/components/JourneyForm";
import { JourneySteps } from "@/components/JourneySteps";
import { LocalMetroDataSource } from "@/services/data-sources/LocalMetroDataSource";
import {
  JourneyRepositoryImpl,
  type JourneyRepository,
} from "@/services/repositories/JourneyRepository";

import type {
  JourneyPlan,
  JourneyRequest,
  StationSummary,
} from "@/types/metro";

const defaultRepository = new JourneyRepositoryImpl({
  dataSource: new LocalMetroDataSource(),
});

export interface JourneyPlannerPageProps {
  journeyRepository?: JourneyRepository;
}

type JourneyFeedback = {
  status: "idle" | "planning" | "error" | "success";
  message: string | null;
};

export function JourneyPlannerPage({
  journeyRepository = defaultRepository,
}: JourneyPlannerPageProps): JSX.Element {
  const [stations, setStations] = useState<StationSummary[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState<boolean>(true);
  const [journeyPlan, setJourneyPlan] = useState<JourneyPlan | null>(null);
  const [feedback, setFeedback] = useState<JourneyFeedback>({
    status: "idle",
    message: null,
  });

  const searchStations = useCallback(
    async (query: string) => {
      try {
        return await journeyRepository.listStations(query);
      } catch (error) {
        console.error("Failed to search stations:", error);
        return [];
      }
    },
    [journeyRepository],
  );

  useEffect(() => {
    let isMounted = true;

    const loadStations = async () => {
      try {
        setIsLoadingStations(true);
        const nextStations = await journeyRepository.listStations();
        if (isMounted) {
          setStations(nextStations);
        }
      } catch (error) {
        if (isMounted) {
          setFeedback({
            status: "error",
            message: "Unable to load stations. Please try again.",
          });
        }
        console.error("Failed to load stations:", error);
      } finally {
        if (isMounted) {
          setIsLoadingStations(false);
        }
      }
    };

    void loadStations();

    return () => {
      isMounted = false;
    };
  }, [journeyRepository]);

  const handlePlanJourney = useCallback(
    async (request: JourneyRequest) => {
      setFeedback({ status: "planning", message: null });
      try {
        const result = await journeyRepository.planJourney(request);

        if (result.status === "ok") {
          setJourneyPlan(result.plan);
          setFeedback({
            status: "success",
            message: null,
          });
          return;
        }

        setJourneyPlan(null);
        setFeedback({
          status: "error",
          message: result.message,
        });
      } catch (error) {
        console.error("Failed to plan journey:", error);
        setJourneyPlan(null);
        setFeedback({
          status: "error",
          message:
            "We hit a snag while planning your journey. Please try again.",
        });
      }
    },
    [journeyRepository],
  );

  const errorMessage = useMemo(() => {
    if (feedback.status === "error") {
      return feedback.message ?? "Unable to plan journey.";
    }
    return null;
  }, [feedback]);

  return (
    <div className="journey-planner">
      <JourneyForm
        stations={stations}
        onSearchStations={searchStations}
        isLoadingStations={isLoadingStations}
        isPlanningJourney={feedback.status === "planning"}
        onSubmit={handlePlanJourney}
        errorMessage={errorMessage}
      />

      {journeyPlan ? (
        <JourneySteps plan={journeyPlan} stations={stations} />
      ) : feedback.status === "success" ? (
        <p className="journey-planner__empty">
          Select stations to see your journey steps.
        </p>
      ) : null}
    </div>
  );
}

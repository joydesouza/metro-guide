import { Fragment } from "react";

import type { JourneyPlan, StationSummary } from "@/types/metro";

export interface JourneyStepsProps {
  plan: JourneyPlan;
  stations: StationSummary[];
}

export function JourneySteps({
  plan,
  stations,
}: JourneyStepsProps): JSX.Element {
  const stationLookup = new Map(
    stations.map((station) => [station.id, station.name])
  );
  const destinationSegment = plan.segments[plan.segments.length - 1];
  const destinationName =
    stationLookup.get(destinationSegment.endStationId) ??
    destinationSegment.endStationId;

  return (
    <section className="journey-steps card" aria-live="polite">
      <header className="journey-steps__header">
        <h2>Journey Steps</h2>
        <p>
          {plan.totalStops} stops • {plan.totalInterchanges} interchanges
        </p>
      </header>
      <ol className="journey-steps__list">
        {plan.segments.map((segment, index) => {
          const startName =
            stationLookup.get(segment.startStationId) ?? segment.startStationId;
          const endName =
            stationLookup.get(segment.endStationId) ?? segment.endStationId;
          const interchange = plan.interchanges[index];
          const upcomingSegment = plan.segments[index + 1];

          return (
            <Fragment
              key={`${segment.lineId}-${segment.startStationId}-${segment.endStationId}`}
            >
              <li className="journey-steps__segment">
                <h3 className="journey-steps__segment-title">
                  Step {index + 1}: {segment.lineName}
                </h3>
                <p>
                  Travel towards <strong>{segment.terminalStationName}</strong>{" "}
                  for {segment.stopCount} stops from{" "}
                  <strong>{startName}</strong> to <strong>{endName}</strong>.
                </p>
              </li>
              {interchange ? (
                <li className="journey-steps__interchange" role="note">
                  <strong>Interchange at {interchange.stationName}.</strong>{" "}
                  Switch to{" "}
                  {upcomingSegment
                    ? upcomingSegment.lineName
                    : formatLineName(interchange.toLineId)}{" "}
                  towards <strong>{interchange.nextTerminalStationName}</strong>
                  .
                </li>
              ) : null}
            </Fragment>
          );
        })}
        <li className="journey-steps__arrival">
          Arrive at <strong>{destinationName}</strong>. Have a great journey!
        </li>
      </ol>
    </section>
  );
}

function formatLineName(lineId: string): string {
  return lineId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

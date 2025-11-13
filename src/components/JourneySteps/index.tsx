import { Fragment, type CSSProperties } from "react";

import type { JourneyPlan, StationSummary } from "@/types/metro";

import "./JourneySteps.css";

export interface JourneyStepsProps {
  plan: JourneyPlan;
  stations: StationSummary[];
}

const INTERCHANGE_COLOR_VAR = "--journey-steps-line-color";

export function JourneySteps({
  plan,
  stations,
}: JourneyStepsProps): JSX.Element {
  const stationLookup = new Map(
    stations.map((station) => [station.id, station.name]),
  );
  const destinationSegment = plan.segments[plan.segments.length - 1];
  const destinationName =
    stationLookup.get(destinationSegment.endStationId) ??
    destinationSegment.endStationId;

  return (
    <section className="journey-steps card" aria-live="polite">
      <header className="journey-steps__header">
        <h2 className="m-10">Journey Steps</h2>
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
          const interchange = segment.interchangeAfter;
          const interchangeStyle: CSSProperties | undefined = interchange
            ? ({
                [INTERCHANGE_COLOR_VAR]: interchange.toLineColorHex,
              } as CSSProperties)
            : undefined;

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
                <li
                  className="journey-steps__interchange"
                  role="note"
                  style={interchangeStyle}
                >
                  <span className="journey-steps__interchange-kicker">
                    Interchange
                  </span>
                  <p className="journey-steps__interchange-text">
                    Interchange at <strong>{interchange.stationName}</strong>.
                    Switch to{" "}
                    <span className="journey-steps__interchange-line">
                      {interchange.toLineName}
                    </span>{" "}
                    towards{" "}
                    <strong className="journey-steps__interchange-direction">
                      {interchange.nextTerminalStationName}
                    </strong>
                    .
                  </p>
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

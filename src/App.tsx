import { AboutButton } from "@/components/AboutButton";
import { JourneyPlannerPage } from "@/pages/JourneyPlanner";
import "./App.css";

export function App(): JSX.Element {
  return (
    <>
      <AboutButton />
      <div className="app-container">
        <header className="app-header">
          <h1>Bengaluru Metro Guide</h1>
          <p className="tagline">
            Hey there, traveler! Choose your starting station and destination,
            and I’ll show you the easiest way to zip across the Bengaluru Metro.
          </p>
        </header>
        <main>
          <JourneyPlannerPage />
        </main>
      </div>
    </>
  );
}

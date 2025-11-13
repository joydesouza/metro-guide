import { JourneyPlannerPage } from "@/pages/JourneyPlanner";

export function App(): JSX.Element {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Bangalore Metro Journey Planner</h1>
        <p className="tagline">
          Select a starting station and destination to plan your journey through
          Bengaluru Metro.
        </p>
      </header>
      <main>
        <JourneyPlannerPage />
      </main>
    </div>
  );
}

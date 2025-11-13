import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";

beforeAll(() => {
  // jsdom does not set matchMedia by default; provide a minimal stub.
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = () =>
      ({
        matches: false,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        media: "",
      }) as MediaQueryList;
  }
});

afterEach(() => {
  cleanup();
});

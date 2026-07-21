import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// mocking window functions not implemented by jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},      // deprecated
    removeListener: () => {},   // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Ensure the DOM is wiped after every test so elements from one test
// don't bleed into the next (RTL auto-cleanup doesn't always fire in Vitest).
afterEach(() => {
  cleanup();
});

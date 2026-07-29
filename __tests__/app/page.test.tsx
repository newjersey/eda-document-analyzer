import { render, screen } from "@testing-library/react";
import Page from "../../app/page";

// mock analyticsService to prevent stderr logging in test environment
const { MockAnalyticsService } = vi.hoisted(() => {
  return {
    MockAnalyticsService: class {
      initialize = vi.fn().mockResolvedValue(undefined);
      trackEvent = vi.fn().mockResolvedValue(undefined);
      endSession = vi.fn().mockResolvedValue(undefined);
      createSession = vi.fn().mockResolvedValue(undefined);
    },
  };
});

vi.mock("../../utils/analyticsService", () => ({
  default: MockAnalyticsService,
}));

test("Page", () => {
  render(<Page />);
  expect(screen.getByRole("main", { name: "main content" })).toBeDefined();
});

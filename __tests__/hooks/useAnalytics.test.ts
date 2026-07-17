import { act, renderHook } from "@testing-library/react";
import { useAnalytics } from "../../hooks/useAnalytics";
import type AnalyticsService from "../../utils/analyticsService";

// ---------------------------------------------------------------------------
// Mock AnalyticsService
// ---------------------------------------------------------------------------

// vi.hoisted ensures these are initialised before vi.mock is hoisted to the
// top of the file. MockAnalyticsService must be a class (not an arrow function)
// because the hook calls it with `new`.
const { mockInitialize, mockEndSession, MockAnalyticsService } = vi.hoisted(() => {
  const mockInitialize = vi.fn().mockResolvedValue(undefined);
  const mockEndSession = vi.fn().mockResolvedValue(undefined);

  // Must use a regular function (not an arrow function) so it is constructable
  // with `new`, and wrapped in vi.fn() so Vitest spy matchers work on it.
  const MockAnalyticsService = vi.fn().mockImplementation(function (
    this: Pick<AnalyticsService, "initialize" | "endSession">,
  ) {
    this.initialize = mockInitialize;
    this.endSession = mockEndSession;
  });

  return { mockInitialize, mockEndSession, MockAnalyticsService };
});

vi.mock("../../utils/analyticsService", () => ({
  default: MockAnalyticsService,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAnalytics", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe("initial state", () => {
    it("returns null when userId is not provided", () => {
      const { result } = renderHook(() => useAnalytics(""));
      expect(result.current).toBeNull();
    });

    it("returns null when userId is undefined", () => {
      const { result } = renderHook(() => useAnalytics(undefined));
      expect(result.current).toBeNull();
    });

    it("does not instantiate AnalyticsService when userId is empty", () => {
      renderHook(() => useAnalytics(""));
      expect(mockInitialize).not.toHaveBeenCalled();
    });

    it("does not call initialize when userId is empty", () => {
      renderHook(() => useAnalytics(""));
      expect(mockInitialize).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  describe("initialization", () => {
    it("calls initialize on the analytics service instance", () => {
      renderHook(() => useAnalytics("user-123"));
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });

    it("returns the analytics service instance after initialization", async () => {
      const { result } = renderHook(() => useAnalytics("user-123"));
      await act(async () => {});
      expect(result.current).not.toBeNull();
      expect(result.current).toHaveProperty("initialize");
      expect(result.current).toHaveProperty("endSession");
    });

    it("only initializes once per userId", async () => {
      renderHook(() => useAnalytics("user-123"));
      await act(async () => {});
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // userId changes
  // -------------------------------------------------------------------------
  describe("userId changes", () => {
    it("creates a new analytics instance when userId changes", async () => {
      const { rerender } = renderHook(({ userId }) => useAnalytics(userId), {
        initialProps: { userId: "user-123" },
      });

      await act(async () => {});
      expect(mockInitialize).toHaveBeenCalledTimes(1);

      rerender({ userId: "user-456" });
      await act(async () => {});
      expect(mockInitialize).toHaveBeenCalledTimes(2);
    });

    it("calls endSession on the previous instance when userId changes", async () => {
      const { rerender } = renderHook(({ userId }) => useAnalytics(userId), {
        initialProps: { userId: "user-123" },
      });

      await act(async () => {});
      rerender({ userId: "user-456" });
      await act(async () => {});

      expect(mockEndSession).toHaveBeenCalledWith("component_unmount");
    });

    it("does not create a new instance when userId stays the same", async () => {
      const { rerender } = renderHook(({ userId }) => useAnalytics(userId), {
        initialProps: { userId: "user-123" },
      });

      await act(async () => {});
      rerender({ userId: "user-123" });
      await act(async () => {});

      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });

    it("instantiates a new service when userId changes from empty to a value", async () => {
      const { rerender } = renderHook(({ userId }) => useAnalytics(userId), {
        initialProps: { userId: "" },
      });

      expect(mockInitialize).not.toHaveBeenCalled();

      rerender({ userId: "user-123" });
      await act(async () => {});

      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------
  describe("cleanup", () => {
    it("calls endSession with 'component_unmount' when the hook unmounts", async () => {
      const { unmount } = renderHook(() => useAnalytics("user-123"));
      await act(async () => {});
      unmount();
      expect(mockEndSession).toHaveBeenCalledWith("component_unmount");
    });

    it("calls endSession exactly once on unmount", async () => {
      const { unmount } = renderHook(() => useAnalytics("user-123"));
      await act(async () => {});
      unmount();
      expect(mockEndSession).toHaveBeenCalledTimes(1);
    });

    it("does not call endSession on unmount when userId was empty", () => {
      const { unmount } = renderHook(() => useAnalytics(""));
      unmount();
      expect(mockEndSession).not.toHaveBeenCalled();
    });
  });
});

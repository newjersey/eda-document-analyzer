import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUserId } from "../../hooks/useUserId";

const USER_ID_KEY = "documentValidatorUserId";

// Mock uuid so generated IDs are deterministic
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mock-uuid-1234"),
}));

describe("useUserId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a non-null string once the hook has settled", () => {
    const { result } = renderHook(() => useUserId());
    // renderHook flushes effects synchronously in RTL v14+, so result.current
    // is already the post-effect value by the time we assert here.
    expect(result.current).not.toBeNull();
    expect(typeof result.current).toBe("string");
  });

  it("generates and stores a new userId when none exists in localStorage", () => {
    const { result } = renderHook(() => useUserId());

    act(() => {
      // Flush all pending state updates / effects
    });

    expect(result.current).toBe("mock-uuid-1234");
    expect(localStorage.getItem(USER_ID_KEY)).toBe("mock-uuid-1234");
  });

  it("reuses an existing userId already stored in localStorage", async () => {
    const existingId = "existing-user-id-5678";
    localStorage.setItem(USER_ID_KEY, existingId);

    const { result } = renderHook(() => useUserId());

    act(() => {});

    expect(result.current).toBe(existingId);
    // uuid should NOT have been called since an id already existed
    const { v4 } = await import("uuid");
    expect(v4).not.toHaveBeenCalled();
  });

  it("does not overwrite an existing userId in localStorage", () => {
    const existingId = "do-not-overwrite-me";
    localStorage.setItem(USER_ID_KEY, existingId);

    renderHook(() => useUserId());

    act(() => {});

    expect(localStorage.getItem(USER_ID_KEY)).toBe(existingId);
  });

  it("returns a string type after the effect runs", () => {
    const { result } = renderHook(() => useUserId());

    act(() => {});

    expect(typeof result.current).toBe("string");
  });

  it("returns the same userId across multiple renders", () => {
    const { result, rerender } = renderHook(() => useUserId());

    act(() => {});

    const firstId = result.current;
    rerender();

    expect(result.current).toBe(firstId);
  });
});

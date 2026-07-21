import { act, renderHook, waitFor } from "@testing-library/react";
import { useTheme } from "../../hooks/useTheme";

// Lets each test decide what the system preference is.
function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  });
  setMatchMedia(false); // default: system prefers light
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useTheme — initialization", () => {
  it("starts light with no saved theme and light system preference", async () => {
    const { result } = renderHook(() => useTheme());
    await waitFor(() => expect(result.current.isDarkMode).toBe(false));
  });

  it("falls back to dark system preference when nothing is saved", async () => {
    setMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    await waitFor(() => expect(result.current.isDarkMode).toBe(true));
  });

  it("reads a saved dark theme, ignoring system preference", async () => {
    localStorage.setItem("theme", "dark");
    setMatchMedia(false); // system says light, but saved wins
    const { result } = renderHook(() => useTheme());
    await waitFor(() => expect(result.current.isDarkMode).toBe(true));
  });

  it("reads a saved light theme, ignoring system preference", async () => {
    localStorage.setItem("theme", "light");
    setMatchMedia(true); // system says dark, but saved wins
    const { result } = renderHook(() => useTheme());
    // Effect resolves to light; confirm it settles and persists light.
    await waitFor(() => expect(localStorage.getItem("theme")).toBe("light"));
    expect(result.current.isDarkMode).toBe(false);
  });
});

describe("useTheme — persistence", () => {
  it("writes the resolved theme to localStorage on mount", async () => {
    setMatchMedia(true);
    renderHook(() => useTheme());
    await waitFor(() => expect(localStorage.getItem("theme")).toBe("dark"));
  });
});

describe("useTheme — toggling", () => {
  it("toggles from light to dark and persists", async () => {
    const { result } = renderHook(() => useTheme());
    await waitFor(() => expect(result.current.isDarkMode).toBe(false));

    act(() => result.current.toggleTheme());

    expect(result.current.isDarkMode).toBe(true);
    await waitFor(() => expect(localStorage.getItem("theme")).toBe("dark"));
  });

  it("toggles back to light on a second call", async () => {
    const { result } = renderHook(() => useTheme());
    await waitFor(() => expect(result.current.isDarkMode).toBe(false));

    act(() => result.current.toggleTheme());
    act(() => result.current.toggleTheme());

    expect(result.current.isDarkMode).toBe(false);
    await waitFor(() => expect(localStorage.getItem("theme")).toBe("light"));
  });
});

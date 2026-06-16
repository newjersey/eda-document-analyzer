import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "../../components/Header";

// lucide-react renders SVGs — stub them out so tests stay focused on behaviour
// rather than SVG internals, and to avoid any SSR/jsdom SVG quirks.
vi.mock("lucide-react", () => ({
  Moon: () => <svg data-testid="icon-moon" />,
  Sun: () => <svg data-testid="icon-sun" />,
  RefreshCw: () => <svg data-testid="icon-refresh" />,
}));

const defaultProps = {
  isDarkMode: false,
  toggleTheme: vi.fn(),
  onRefresh: vi.fn(),
};

function renderHeader(overrides = {}) {
  return render(<Header {...defaultProps} {...overrides} />);
}

describe("Header", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders the application title", () => {
      renderHeader();
      expect(screen.getByText("NJ EASE")).toBeInTheDocument();
    });

    it("renders the application subtitle", () => {
      renderHeader();
      expect(screen.getByText("Entrepreneurial Application Screening Engine")).toBeInTheDocument();
    });

    it("renders the theme toggle button with an accessible label", () => {
      renderHeader();
      expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
    });

    it("renders the refresh button with an accessible label", () => {
      renderHeader();
      expect(screen.getByRole("button", { name: /start new review/i })).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Icons — light mode
  // ---------------------------------------------------------------------------
  describe("light mode (isDarkMode = false)", () => {
    it("shows the Moon icon in the theme toggle button", () => {
      renderHeader({ isDarkMode: false });
      expect(screen.getByTestId("icon-moon")).toBeInTheDocument();
      expect(screen.queryByTestId("icon-sun")).not.toBeInTheDocument();
    });

    it("always shows the Refresh icon regardless of theme", () => {
      renderHeader({ isDarkMode: false });
      expect(screen.getByTestId("icon-refresh")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Icons — dark mode
  // ---------------------------------------------------------------------------
  describe("dark mode (isDarkMode = true)", () => {
    it("shows the Sun icon in the theme toggle button", () => {
      renderHeader({ isDarkMode: true });
      expect(screen.getByTestId("icon-sun")).toBeInTheDocument();
      expect(screen.queryByTestId("icon-moon")).not.toBeInTheDocument();
    });

    it("always shows the Refresh icon regardless of theme", () => {
      renderHeader({ isDarkMode: true });
      expect(screen.getByTestId("icon-refresh")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------
  describe("interactions", () => {
    it("calls toggleTheme once when the theme button is clicked", async () => {
      const toggleTheme = vi.fn();
      renderHeader({ toggleTheme });

      await userEvent.click(screen.getByRole("button", { name: /toggle theme/i }));

      expect(toggleTheme).toHaveBeenCalledTimes(1);
    });

    it("calls onRefresh once when the refresh button is clicked", async () => {
      const onRefresh = vi.fn();
      renderHeader({ onRefresh });

      await userEvent.click(screen.getByRole("button", { name: /start new review/i }));

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("does not call onRefresh when the theme button is clicked", async () => {
      const onRefresh = vi.fn();
      renderHeader({ onRefresh });

      await userEvent.click(screen.getByRole("button", { name: /toggle theme/i }));

      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("does not call toggleTheme when the refresh button is clicked", async () => {
      const toggleTheme = vi.fn();
      renderHeader({ toggleTheme });

      await userEvent.click(screen.getByRole("button", { name: /start new review/i }));

      expect(toggleTheme).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  describe("accessibility", () => {
    it("theme button has aria-label", () => {
      renderHeader();
      const btn = screen.getByRole("button", { name: /toggle theme/i });
      expect(btn).toHaveAttribute("aria-label", "Toggle theme");
    });

    it("refresh button has aria-label", () => {
      renderHeader();
      const btn = screen.getByRole("button", { name: /start new review/i });
      expect(btn).toHaveAttribute("aria-label", "Start new review");
    });

    it("refresh button has a descriptive title attribute", () => {
      renderHeader();
      const btn = screen.getByRole("button", { name: /start new review/i });
      expect(btn).toHaveAttribute("title", "Start New Review");
    });

    it("renders an h1 element for the page title", () => {
      renderHeader();
      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });
});

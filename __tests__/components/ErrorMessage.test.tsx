import { render, screen } from "@testing-library/react";
import ErrorMessage from "../../components/ErrorMessage";

vi.mock("lucide-react", () => ({
  AlertCircle: () => <svg data-testid="icon-alert-circle" />,
}));

const defaultProps = {
  error: "Something went wrong.",
  isDarkMode: false,
};

function renderErrorMessage(overrides = {}) {
  return render(<ErrorMessage {...defaultProps} {...overrides} />);
}

describe("ErrorMessage", () => {
  // ---------------------------------------------------------------------------
  // Visibility
  // ---------------------------------------------------------------------------
  describe("visibility", () => {
    it("renders nothing when error is null", () => {
      const { container } = renderErrorMessage({ error: null });
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when error is an empty string", () => {
      const { container } = renderErrorMessage({ error: "" });
      expect(container).toBeEmptyDOMElement();
    });

    it("renders the error container when error is a non-empty string", () => {
      renderErrorMessage();
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------
  describe("content", () => {
    it("displays the exact error message text", () => {
      renderErrorMessage({ error: "Network request failed." });
      expect(screen.getByText("Network request failed.")).toBeInTheDocument();
    });

    it("renders the alert icon", () => {
      renderErrorMessage();
      expect(screen.getByTestId("icon-alert-circle")).toBeInTheDocument();
    });

    it("renders the error message in a paragraph element", () => {
      renderErrorMessage();
      const p = screen.getByText("Something went wrong.");
      expect(p.tagName).toBe("P");
    });
  });

  // ---------------------------------------------------------------------------
  // Dark mode
  // ---------------------------------------------------------------------------
  describe("dark mode", () => {
    it("applies dark background classes when isDarkMode is true", () => {
      const { container } = renderErrorMessage({ isDarkMode: true });
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("from-red-900/30");
      expect(wrapper.className).toContain("to-pink-900/30");
    });

    it("applies light background classes when isDarkMode is false", () => {
      const { container } = renderErrorMessage({ isDarkMode: false });
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("from-red-50");
      expect(wrapper.className).toContain("to-pink-50");
    });

    it("applies dark text class to the error message when isDarkMode is true", () => {
      renderErrorMessage({ isDarkMode: true });
      const p = screen.getByText("Something went wrong.");
      expect(p.className).toContain("text-red-300");
    });

    it("applies light text class to the error message when isDarkMode is false", () => {
      renderErrorMessage({ isDarkMode: false });
      const p = screen.getByText("Something went wrong.");
      expect(p.className).toContain("text-red-700");
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  describe("accessibility", () => {
    it("renders the error text in a readable element", () => {
      renderErrorMessage();
      expect(screen.getByText("Something went wrong.")).toBeVisible();
    });

    it("does not render any interactive elements", () => {
      renderErrorMessage();
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });
  });
});

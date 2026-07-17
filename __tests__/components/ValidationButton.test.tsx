import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ValidationButton from "../../components/ValidationButton";

vi.mock("lucide-react", () => ({
  CheckCircle: () => <svg data-testid="icon-check-circle" />,
}));

const defaultProps = {
  isUploading: false,
  validateDocument: vi.fn(),
  isDarkMode: false,
};

function renderValidationButton(overrides = {}) {
  return render(<ValidationButton {...defaultProps} {...overrides} />);
}

describe("ValidationButton", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders a button element", () => {
      renderValidationButton();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders 'Validate Document' label when not uploading", () => {
      renderValidationButton();
      expect(screen.getByText("Validate Document")).toBeInTheDocument();
    });

    it("renders the CheckCircle icon when not uploading", () => {
      renderValidationButton();
      expect(screen.getByTestId("icon-check-circle")).toBeInTheDocument();
    });

    it("renders 'Validating...' label when uploading", () => {
      renderValidationButton({ isUploading: true });
      expect(screen.getByText("Validating...")).toBeInTheDocument();
    });

    it("does not render 'Validate Document' label when uploading", () => {
      renderValidationButton({ isUploading: true });
      expect(screen.queryByText("Validate Document")).not.toBeInTheDocument();
    });

    it("does not render the CheckCircle icon when uploading", () => {
      renderValidationButton({ isUploading: true });
      expect(screen.queryByTestId("icon-check-circle")).not.toBeInTheDocument();
    });

    it("renders a spinner SVG when uploading", () => {
      const { container } = renderValidationButton({ isUploading: true });
      expect(container.querySelector("svg.animate-spin")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled state
  // ---------------------------------------------------------------------------
  describe("disabled state", () => {
    it("is not disabled when isUploading is false", () => {
      renderValidationButton({ isUploading: false });
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    it("is disabled when isUploading is true", () => {
      renderValidationButton({ isUploading: true });
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------
  describe("interactions", () => {
    it("calls validateDocument when the button is clicked", async () => {
      const validateDocument = vi.fn();
      renderValidationButton({ validateDocument });

      await userEvent.click(screen.getByRole("button"));

      expect(validateDocument).toHaveBeenCalledTimes(1);
    });

    it("does not call validateDocument when the button is disabled", async () => {
      const validateDocument = vi.fn();
      renderValidationButton({ isUploading: true, validateDocument });

      await userEvent.click(screen.getByRole("button"));

      expect(validateDocument).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Dark mode
  // ---------------------------------------------------------------------------
  describe("dark mode", () => {
    it("applies disabled dark classes when isUploading is true and isDarkMode is true", () => {
      renderValidationButton({ isUploading: true, isDarkMode: true });
      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-gray-600");
      expect(button.className).toContain("text-gray-300");
    });

    it("applies disabled light classes when isUploading is true and isDarkMode is false", () => {
      renderValidationButton({ isUploading: true, isDarkMode: false });
      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-gray-400");
      expect(button.className).toContain("text-white");
    });

    it("applies active dark classes when isUploading is false and isDarkMode is true", () => {
      renderValidationButton({ isUploading: false, isDarkMode: true });
      const button = screen.getByRole("button");
      expect(button.className).toContain("from-blue-600");
      expect(button.className).toContain("hover:from-blue-500");
    });

    it("applies active light classes when isUploading is false and isDarkMode is false", () => {
      renderValidationButton({ isUploading: false, isDarkMode: false });
      const button = screen.getByRole("button");
      expect(button.className).toContain("from-blue-600");
      expect(button.className).toContain("hover:from-blue-700");
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  describe("accessibility", () => {
    it("button is visible", () => {
      renderValidationButton();
      expect(screen.getByRole("button")).toBeVisible();
    });

    it("button has cursor-not-allowed class when disabled", () => {
      renderValidationButton({ isUploading: true });
      expect(screen.getByRole("button").className).toContain("cursor-not-allowed");
    });
  });
});

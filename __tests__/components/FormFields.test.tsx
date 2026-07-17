import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormFields from "../../components/FormFields";

const defaultProps = {
  requiredFields: { organizationName: true, fein: true },
  formFields: { organizationName: "", fein: "" },
  handleInputChange: vi.fn(),
  fieldErrors: {},
  isDarkMode: false,
};

function renderFormFields(overrides = {}) {
  return render(<FormFields {...defaultProps} {...overrides} />);
}

describe("FormFields", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Visibility
  // ---------------------------------------------------------------------------
  describe("visibility", () => {
    it("renders the Organization Name field when required", () => {
      renderFormFields();
      expect(screen.getByPlaceholderText("Enter organization name")).toBeInTheDocument();
    });

    it("renders the FEIN field when required", () => {
      renderFormFields();
      expect(screen.getByPlaceholderText("Enter FEIN")).toBeInTheDocument();
    });

    it("does not render the Organization Name field when not required", () => {
      renderFormFields({ requiredFields: { organizationName: false, fein: true } });
      expect(screen.queryByPlaceholderText("Enter organization name")).not.toBeInTheDocument();
    });

    it("does not render the FEIN field when not required", () => {
      renderFormFields({ requiredFields: { organizationName: true, fein: false } });
      expect(screen.queryByPlaceholderText("Enter FEIN")).not.toBeInTheDocument();
    });

    it("renders neither field when both are not required", () => {
      const { container } = renderFormFields({
        requiredFields: { organizationName: false, fein: false },
      });
      expect(container.querySelectorAll("input")).toHaveLength(0);
    });

    it("renders both fields when both are required", () => {
      const { container } = renderFormFields();
      expect(container.querySelectorAll("input")).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Labels
  // ---------------------------------------------------------------------------
  describe("labels", () => {
    it("renders the Organization Name label", () => {
      renderFormFields();
      expect(screen.getByText(/organization name/i)).toBeInTheDocument();
    });

    it("renders the FEIN label", () => {
      renderFormFields();
      expect(
        screen.getByText(/FEIN \(Federal Employer Identification Number\)/i),
      ).toBeInTheDocument();
    });

    it("renders required asterisks for both fields", () => {
      renderFormFields();
      const asterisks = screen.getAllByText("*");
      expect(asterisks).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Input attributes
  // ---------------------------------------------------------------------------
  describe("input attributes", () => {
    it("Organization Name input has type text", () => {
      renderFormFields();
      expect(screen.getByPlaceholderText("Enter organization name")).toHaveAttribute(
        "type",
        "text",
      );
    });

    it("FEIN input has type text", () => {
      renderFormFields();
      expect(screen.getByPlaceholderText("Enter FEIN")).toHaveAttribute("type", "text");
    });

    it("Organization Name input has correct name attribute", () => {
      renderFormFields();
      expect(screen.getByPlaceholderText("Enter organization name")).toHaveAttribute(
        "name",
        "organizationName",
      );
    });

    it("FEIN input has correct name attribute", () => {
      renderFormFields();
      expect(screen.getByPlaceholderText("Enter FEIN")).toHaveAttribute("name", "fein");
    });

    it("Organization Name input reflects the formFields value", () => {
      renderFormFields({ formFields: { organizationName: "Acme Corp", fein: "" } });
      expect(screen.getByPlaceholderText("Enter organization name")).toHaveValue("Acme Corp");
    });

    it("FEIN input reflects the formFields value", () => {
      renderFormFields({ formFields: { organizationName: "", fein: "12-3456789" } });
      expect(screen.getByPlaceholderText("Enter FEIN")).toHaveValue("12-3456789");
    });
  });

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------
  describe("interactions", () => {
    it("calls handleInputChange when the Organization Name input changes", async () => {
      const handleInputChange = vi.fn();
      renderFormFields({ handleInputChange });

      await userEvent.type(screen.getByPlaceholderText("Enter organization name"), "A");

      expect(handleInputChange).toHaveBeenCalled();
    });

    it("calls handleInputChange when the FEIN input changes", async () => {
      const handleInputChange = vi.fn();
      renderFormFields({ handleInputChange });

      await userEvent.type(screen.getByPlaceholderText("Enter FEIN"), "1");

      expect(handleInputChange).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Field errors
  // ---------------------------------------------------------------------------
  describe("field errors", () => {
    it("applies error border classes to Organization Name input when there is an error", () => {
      renderFormFields({ fieldErrors: { organizationName: "Required" } });
      const input = screen.getByPlaceholderText("Enter organization name");
      expect(input.className).toContain("border-red-300");
    });

    it("applies error border classes to FEIN input when there is an error", () => {
      renderFormFields({ fieldErrors: { fein: "Required" } });
      const input = screen.getByPlaceholderText("Enter FEIN");
      expect(input.className).toContain("border-red-300");
    });

    it("does not apply error border classes to Organization Name input when there is no error", () => {
      renderFormFields({ fieldErrors: {} });
      const input = screen.getByPlaceholderText("Enter organization name");
      expect(input.className).not.toContain("border-red-300");
    });

    it("does not apply error border classes to FEIN input when there is no error", () => {
      renderFormFields({ fieldErrors: {} });
      const input = screen.getByPlaceholderText("Enter FEIN");
      expect(input.className).not.toContain("border-red-300");
    });
  });

  // ---------------------------------------------------------------------------
  // Dark mode
  // ---------------------------------------------------------------------------
  describe("dark mode", () => {
    it("applies dark label classes when isDarkMode is true", () => {
      renderFormFields({ isDarkMode: true });
      const labels = screen.getAllByText(/organization name/i);
      expect(labels[0].className).toContain("text-gray-200");
    });

    it("applies light label classes when isDarkMode is false", () => {
      renderFormFields({ isDarkMode: false });
      const labels = screen.getAllByText(/organization name/i);
      expect(labels[0].className).toContain("text-gray-800");
    });

    it("applies dark input classes when isDarkMode is true and no error", () => {
      renderFormFields({ isDarkMode: true });
      const input = screen.getByPlaceholderText("Enter organization name");
      expect(input.className).toContain("border-gray-600");
    });

    it("applies light input classes when isDarkMode is false and no error", () => {
      renderFormFields({ isDarkMode: false });
      const input = screen.getByPlaceholderText("Enter organization name");
      expect(input.className).toContain("border-gray-200");
    });

    it("applies dark error input classes when isDarkMode is true and there is an error", () => {
      renderFormFields({ isDarkMode: true, fieldErrors: { organizationName: "Required" } });
      const input = screen.getByPlaceholderText("Enter organization name");
      expect(input.className).toContain("bg-gray-700/50");
    });

    it("applies light error input classes when isDarkMode is false and there is an error", () => {
      renderFormFields({ isDarkMode: false, fieldErrors: { organizationName: "Required" } });
      const input = screen.getByPlaceholderText("Enter organization name");
      expect(input.className).toContain("bg-white/50");
    });
  });
});

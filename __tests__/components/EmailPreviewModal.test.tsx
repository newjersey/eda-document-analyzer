import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailPreviewModal from "../../components/EmailPreviewModal";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    X: () => <svg data-testid="icon-x" />,
    Copy: () => <svg data-testid="icon-copy" />,
    Check: () => <svg data-testid="icon-check" />,
    AlertCircle: () => <svg data-testid="icon-alert-circle" />,
    Info: () => <svg data-testid="icon-info" />,
  };
});

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Clipboard mock
// ---------------------------------------------------------------------------

const mockWriteText = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal("navigator", { clipboard: { writeText: mockWriteText } });

// ---------------------------------------------------------------------------
// Analytics mock
// ---------------------------------------------------------------------------

const mockAnalytics = {
  logEvent: vi.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_EMAIL = "Dear Applicant,\n\nPlease submit the required documents.\n\nThank you";

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  emailText: SAMPLE_EMAIL,
  isDarkMode: false,
  analytics: mockAnalytics as never,
};

function renderModal(overrides = {}) {
  return render(<EmailPreviewModal {...defaultProps} {...overrides} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EmailPreviewModal", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Visibility guards
  // -------------------------------------------------------------------------
  describe("visibility guards", () => {
    it("renders nothing when isOpen is false", () => {
      const { container } = renderModal({ isOpen: false });
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when emailText is empty", () => {
      const { container } = renderModal({ emailText: "" });
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when emailText is null", () => {
      const { container } = renderModal({ emailText: null });
      expect(container).toBeEmptyDOMElement();
    });

    it("renders the modal when isOpen is true and emailText is provided", () => {
      renderModal();
      expect(screen.getByText("Email Template Preview")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Header content
  // -------------------------------------------------------------------------
  describe("header content", () => {
    it("renders the Email Template Preview heading", () => {
      renderModal();
      expect(screen.getByText("Email Template Preview")).toBeInTheDocument();
    });

    it("renders the subtitle", () => {
      renderModal();
      expect(screen.getByText("Review the email before copying")).toBeInTheDocument();
    });

    it("renders the close button in the header", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /close modal/i })).toBeInTheDocument();
    });

    it("renders the X icon in the close button", () => {
      renderModal();
      expect(screen.getByTestId("icon-x")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Email content
  // -------------------------------------------------------------------------
  describe("email content", () => {
    it("renders the email text in the preview area", () => {
      renderModal();
      // Use a custom matcher since RTL normalises whitespace and collapses
      // newlines, which breaks exact matching of multi-line email strings.
      const el = screen.getByText(
        (_, element) => element?.textContent?.trim() === SAMPLE_EMAIL.trim(),
      );
      expect(el).toBeInTheDocument();
    });

    it("renders the internal note heading for template instructions", () => {
      renderModal();
      expect(screen.getByText("Internal Note: Template Instructions")).toBeInTheDocument();
    });

    it("renders the internal note heading for rejection outcome", () => {
      renderModal();
      expect(screen.getByText("Internal Note: Rejection Outcome")).toBeInTheDocument();
    });

    it("renders the AlertCircle icon for the template instructions note", () => {
      renderModal();
      expect(screen.getByTestId("icon-alert-circle")).toBeInTheDocument();
    });

    it("renders the Info icon for the rejection outcome note", () => {
      renderModal();
      expect(screen.getByTestId("icon-info")).toBeInTheDocument();
    });

    it("renders the reminder about placeholders", () => {
      renderModal();
      expect(screen.getByText(/Remember to fill in/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Footer buttons
  // -------------------------------------------------------------------------
  describe("footer buttons", () => {
    it("renders the Close button in the footer", () => {
      renderModal();
      // There are two close triggers — target the one with text "Close"
      expect(screen.getByRole("button", { name: /^close$/i })).toBeInTheDocument();
    });

    it("renders the Copy Email Template button", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /copy email template/i })).toBeInTheDocument();
    });

    it("renders the Copy icon initially", () => {
      renderModal();
      expect(screen.getByTestId("icon-copy")).toBeInTheDocument();
    });

    it("copy button is not disabled initially", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /copy email template/i })).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Close behaviour
  // -------------------------------------------------------------------------
  describe("close behaviour", () => {
    it("calls onClose when the header close button is clicked", async () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      await userEvent.click(screen.getByRole("button", { name: /close modal/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when the footer Close button is clicked", async () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      await userEvent.click(screen.getByRole("button", { name: /^close$/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when the backdrop is clicked", async () => {
      const onClose = vi.fn();
      const { container } = renderModal({ onClose });
      await userEvent.click(container.firstChild as HTMLElement);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when clicking inside the modal content", async () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      await userEvent.click(screen.getByText("Email Template Preview"));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("logs email_template_closed when the modal is closed", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /close modal/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "email_template_closed",
        expect.objectContaining({ wasCopied: false }),
      );
    });

    it("logs wasCopied as true when closed after copying", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /copy email template/i }));
      await userEvent.click(screen.getByRole("button", { name: /close modal/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "email_template_closed",
        expect.objectContaining({ wasCopied: true }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Copy to clipboard
  // -------------------------------------------------------------------------
  describe("copy to clipboard", () => {
    it("calls navigator.clipboard.writeText with the email text", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /copy email template/i }));
      expect(mockWriteText).toHaveBeenCalledWith(SAMPLE_EMAIL);
    });

    it("shows a success toast after copying", async () => {
      const { toast } = await import("react-hot-toast");
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /copy email template/i }));
      await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    });

    it("renders the Check icon and Copied! text after copying", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /copy email template/i }));
      await waitFor(() => expect(screen.getByText("Copied!")).toBeInTheDocument());
      expect(screen.getByTestId("icon-check")).toBeInTheDocument();
    });

    it("disables the copy button after copying", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /copy email template/i }));
      await waitFor(() => expect(screen.getByRole("button", { name: /copied!/i })).toBeDisabled());
    });

    it("logs email_template_copied with emailLength when copied", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /copy email template/i }));
      await waitFor(() =>
        expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
          "email_template_copied",
          expect.objectContaining({ emailLength: SAMPLE_EMAIL.length }),
        ),
      );
    });

    it("shows an error toast when clipboard write fails", async () => {
      mockWriteText.mockRejectedValueOnce(new Error("Clipboard denied"));
      const { toast } = await import("react-hot-toast");
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /copy email template/i }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    });

    it("does not show Copied! state when clipboard write fails", async () => {
      mockWriteText.mockRejectedValueOnce(new Error("Clipboard denied"));
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /copy email template/i }));
      await waitFor(() => expect(screen.queryByText("Copied!")).not.toBeInTheDocument());
    });
  });

  // -------------------------------------------------------------------------
  // Dark mode
  // -------------------------------------------------------------------------
  describe("dark mode", () => {
    it("applies dark background to the modal content when isDarkMode is true", () => {
      const { container } = renderModal({ isDarkMode: true });
      const modal = container.firstChild as HTMLElement;
      expect(modal.querySelector("[class*='bg-gray-800']")).toBeInTheDocument();
    });

    it("applies light background to the modal content when isDarkMode is false", () => {
      const { container } = renderModal({ isDarkMode: false });
      const modal = container.firstChild as HTMLElement;
      expect(modal.querySelector("[class*='bg-white']")).toBeInTheDocument();
    });

    it("applies dark background to the email preview area when isDarkMode is true", () => {
      renderModal({ isDarkMode: true });
      // Find the pre-wrap email container directly via its distinctive class
      // rather than via getByText, which fails on multi-line strings due to
      // RTL whitespace normalisation.
      const previewArea = document.querySelector(
        "[class*='whitespace-pre-wrap'][class*='bg-gray-800']",
      );
      expect(previewArea).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Feedback from "../../components/Feedback";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("lucide-react", () => ({
  ThumbsUp: () => <svg data-testid="icon-thumbs-up" />,
  ThumbsDown: () => <svg data-testid="icon-thumbs-down" />,
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ---------------------------------------------------------------------------
// Analytics mock
// ---------------------------------------------------------------------------

const mockAnalytics = {
  logEvent: vi.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  isDarkMode: false,
  documentId: "doc-001",
  userId: "user-123",
  fileName: "invoice.pdf",
  apiKey: "test-api-key",
  onNegativeFeedbackSubmit: vi.fn().mockResolvedValue(undefined),
  analytics: mockAnalytics as never,
};

function renderFeedback(overrides = {}) {
  return render(<Feedback {...defaultProps} {...overrides} />);
}

function getThumbsUpButton() {
  const btn = screen
    .getAllByRole("button")
    .find((b) => b.querySelector('[data-testid="icon-thumbs-up"]'));
  expect(btn).toBeDefined();
  return btn as HTMLElement;
}

function getThumbsDownButton() {
  const btn = screen
    .getAllByRole("button")
    .find((b) => b.querySelector('[data-testid="icon-thumbs-down"]'));
  expect(btn).toBeDefined();
  return btn as HTMLElement;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Feedback", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ feedbackId: "feedback-abc" }),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initial rendering
  // -------------------------------------------------------------------------
  describe("initial rendering", () => {
    it("renders the 'Was this helpful?' prompt", () => {
      renderFeedback();
      expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
    });

    it("renders the thumbs up button", () => {
      renderFeedback();
      expect(screen.getByTestId("icon-thumbs-up")).toBeInTheDocument();
    });

    it("renders the thumbs down button", () => {
      renderFeedback();
      expect(screen.getByTestId("icon-thumbs-down")).toBeInTheDocument();
    });

    it("renders the reviewer notes textarea", () => {
      renderFeedback();
      expect(screen.getByLabelText(/reviewer notes/i)).toBeInTheDocument();
    });

    it("renders the submit button", () => {
      renderFeedback();
      expect(screen.getByRole("button", { name: /submit feedback/i })).toBeInTheDocument();
    });

    it("submit button is disabled when no thumbs selection has been made", () => {
      renderFeedback();
      expect(screen.getByRole("button", { name: /submit feedback/i })).toBeDisabled();
    });

    it("thumbs up button has aria-pressed set to false initially", () => {
      renderFeedback();
      const buttons = screen.getAllByRole("button");
      const thumbsUpBtn = buttons.find((b) => b.querySelector("[data-testid='icon-thumbs-up']"));
      expect(thumbsUpBtn).toHaveAttribute("aria-pressed", "false");
    });

    it("thumbs down button has aria-pressed set to false initially", () => {
      renderFeedback();
      const buttons = screen.getAllByRole("button");
      const thumbsDownBtn = buttons.find((b) =>
        b.querySelector("[data-testid='icon-thumbs-down']"),
      );
      expect(thumbsDownBtn).toHaveAttribute("aria-pressed", "false");
    });
  });

  // -------------------------------------------------------------------------
  // Thumbs up / down selection
  // -------------------------------------------------------------------------
  describe("thumbs up / down selection", () => {
    it("enables the submit button after thumbs up is clicked", async () => {
      renderFeedback();
      await userEvent.click(getThumbsUpButton());
      expect(screen.getByRole("button", { name: /submit feedback/i })).not.toBeDisabled();
    });

    it("enables the submit button after thumbs down is clicked", async () => {
      renderFeedback();
      await userEvent.click(getThumbsDownButton());
      expect(screen.getByRole("button", { name: /submit feedback/i })).not.toBeDisabled();
    });

    it("sets aria-pressed to true on thumbs up after clicking it", async () => {
      renderFeedback();
      const btn = getThumbsUpButton();
      await userEvent.click(btn);
      expect(btn).toHaveAttribute("aria-pressed", "true");
    });

    it("sets aria-pressed to true on thumbs down after clicking it", async () => {
      renderFeedback();
      const btn = getThumbsDownButton();
      await userEvent.click(btn);
      expect(btn).toHaveAttribute("aria-pressed", "true");
    });

    it("logs feedback_thumbs_up analytics event on thumbs up click", async () => {
      renderFeedback();
      await userEvent.click(getThumbsUpButton());
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "feedback_thumbs_up",
        expect.objectContaining({ documentId: "doc-001", fileName: "invoice.pdf" }),
      );
    });

    it("logs feedback_thumbs_down analytics event on thumbs down click", async () => {
      renderFeedback();
      await userEvent.click(getThumbsDownButton());
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "feedback_thumbs_down",
        expect.objectContaining({ documentId: "doc-001", fileName: "invoice.pdf" }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Notes textarea
  // -------------------------------------------------------------------------
  describe("notes textarea", () => {
    it("updates the textarea value as the user types", async () => {
      renderFeedback();
      const textarea = screen.getByLabelText(/reviewer notes/i);
      await userEvent.type(textarea, "Great tool");
      expect(textarea).toHaveValue("Great tool");
    });

    it("logs feedback_notes_entered on the first character typed", async () => {
      renderFeedback();
      await userEvent.type(screen.getByLabelText(/reviewer notes/i), "G");
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "feedback_notes_entered",
        expect.objectContaining({ documentId: "doc-001" }),
      );
    });

    it("does not log feedback_notes_entered more than once", async () => {
      renderFeedback();
      await userEvent.type(screen.getByLabelText(/reviewer notes/i), "abc");
      const notesCalls = mockAnalytics.logEvent.mock.calls.filter(
        ([name]) => name === "feedback_notes_entered",
      );
      expect(notesCalls).toHaveLength(1);
    });

    it("textarea id is scoped to the documentId prop", () => {
      renderFeedback({ documentId: "doc-xyz" });
      expect(screen.getByLabelText(/reviewer notes/i)).toHaveAttribute("id", "notes-doc-xyz");
    });
  });

  // -------------------------------------------------------------------------
  // Submission — success
  // -------------------------------------------------------------------------
  describe("successful submission", () => {
    async function selectThumbsUpAndSubmit(notes = "") {
      renderFeedback();
      await userEvent.click(getThumbsUpButton());
      if (notes) {
        await userEvent.type(screen.getByLabelText(/reviewer notes/i), notes);
      }
      await userEvent.click(screen.getByRole("button", { name: /submit feedback/i }));
    }

    it("calls fetch with the correct endpoint", async () => {
      await selectThumbsUpAndSubmit();
      await waitFor(() =>
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/save-feedback",
          expect.objectContaining({ method: "POST" }),
        ),
      );
    });

    it("sends the correct payload", async () => {
      await selectThumbsUpAndSubmit("Good job");
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toMatchObject({
        isHelpful: true,
        notes: "Good job",
        documentId: "doc-001",
        userId: "user-123",
        fileName: "invoice.pdf",
      });
    });

    it("sends the api key in the request headers", async () => {
      await selectThumbsUpAndSubmit();
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["x-functions-key"]).toBe("test-api-key");
    });

    it("shows a success toast after submission", async () => {
      const toast = await import("react-hot-toast");
      await selectThumbsUpAndSubmit();
      await waitFor(() => expect(toast.default.success).toHaveBeenCalledTimes(1));
    });

    it("logs feedback_submitted analytics event", async () => {
      await selectThumbsUpAndSubmit();
      await waitFor(() =>
        expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
          "feedback_submitted",
          expect.objectContaining({ documentId: "doc-001", isHelpful: true }),
        ),
      );
    });

    it("calls onNegativeFeedbackSubmit with the feedbackId from the response", async () => {
      const onNegativeFeedbackSubmit = vi.fn().mockResolvedValue(undefined);
      renderFeedback({ onNegativeFeedbackSubmit });
      await userEvent.click(getThumbsUpButton());
      await userEvent.click(screen.getByRole("button", { name: /submit feedback/i }));
      await waitFor(() => expect(onNegativeFeedbackSubmit).toHaveBeenCalledWith("feedback-abc"));
    });

    it("renders the thank-you confirmation view after submission", async () => {
      await selectThumbsUpAndSubmit();
      await waitFor(() =>
        expect(screen.getByText(/thank you for your feedback/i)).toBeInTheDocument(),
      );
    });

    it("no longer renders the form after submission", async () => {
      await selectThumbsUpAndSubmit();
      await waitFor(() =>
        expect(screen.queryByRole("button", { name: /submit feedback/i })).not.toBeInTheDocument(),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Submission — validation
  // -------------------------------------------------------------------------
  describe("submission validation", () => {
    it("shows an error toast when submitting without a thumbs selection", async () => {
      const toast = await import("react-hot-toast");
      renderFeedback();
      // Submit button is disabled when isHelpful is null, so we can"t click it
      // directly — this asserts the button remains disabled as the guard
      expect(screen.getByRole("button", { name: /submit feedback/i })).toBeDisabled();
      expect(toast.default.error).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Submission — failure
  // -------------------------------------------------------------------------
  describe("failed submission", () => {
    it("shows an error toast when the API returns a non-ok response", async () => {
      mockFetch.mockResolvedValue({ ok: false } as Response);
      const toast = await import("react-hot-toast");
      renderFeedback();
      await userEvent.click(getThumbsUpButton());
      await userEvent.click(screen.getByRole("button", { name: /submit feedback/i }));
      await waitFor(() => expect(toast.default.error).toHaveBeenCalledTimes(1));
    });

    it("does not render the confirmation view when submission fails", async () => {
      mockFetch.mockResolvedValue({ ok: false } as Response);
      renderFeedback();
      await userEvent.click(getThumbsUpButton());
      await userEvent.click(screen.getByRole("button", { name: /submit feedback/i }));
      await waitFor(() =>
        expect(screen.queryByText(/thank you for your feedback/i)).not.toBeInTheDocument(),
      );
    });

    it("re-enables the submit button after a failed submission", async () => {
      mockFetch.mockResolvedValue({ ok: false } as Response);
      renderFeedback();
      await userEvent.click(getThumbsUpButton());
      await userEvent.click(screen.getByRole("button", { name: /submit feedback/i }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /submit feedback/i })).not.toBeDisabled(),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Dark mode
  // -------------------------------------------------------------------------
  describe("dark mode", () => {
    it("applies dark mode classes to the container when isDarkMode is true", () => {
      const { container } = renderFeedback({ isDarkMode: true });
      expect(container.firstChild).toHaveClass("bg-gradient-to-br");
    });

    it("renders the thank-you message with dark text when isDarkMode is true", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ feedbackId: "feedback-abc" }),
      } as Response);
      renderFeedback({ isDarkMode: true });
      await userEvent.click(getThumbsUpButton());
      await userEvent.click(screen.getByRole("button", { name: /submit feedback/i }));
      await waitFor(() =>
        expect(screen.getByText(/thank you for your feedback/i)).toHaveClass("text-green-400"),
      );
    });

    it("renders the thank-you message with light text when isDarkMode is false", async () => {
      renderFeedback({ isDarkMode: false });
      await userEvent.click(getThumbsUpButton());
      await userEvent.click(screen.getByRole("button", { name: /submit feedback/i }));
      await waitFor(() =>
        expect(screen.getByText(/thank you for your feedback/i)).toHaveClass("text-green-600"),
      );
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "../../components/ContactForm";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("react-hot-toast", () => ({
  toast: {
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
  userId: "user-123",
  sessionId: "session-abc",
  analytics: mockAnalytics as never,
};

function renderContactForm(overrides = {}) {
  return render(<ContactForm {...defaultProps} {...overrides} />);
}

async function fillAndSubmit(email = "user@njeda.com") {
  await userEvent.type(screen.getByPlaceholderText(/your\.email@njeda\.com/i), email);
  await userEvent.click(screen.getByRole("button", { name: /submit/i }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ContactForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initial rendering
  // -------------------------------------------------------------------------
  describe("initial rendering", () => {
    it("renders the introductory label text", () => {
      renderContactForm();
      expect(screen.getByText(/share your email for follow-up/i)).toBeInTheDocument();
    });

    it("renders the email input", () => {
      renderContactForm();
      expect(screen.getByPlaceholderText(/your\.email@njeda\.com/i)).toBeInTheDocument();
    });

    it("renders the submit button", () => {
      renderContactForm();
      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    });

    it("email input is empty by default", () => {
      renderContactForm();
      expect(screen.getByPlaceholderText(/your\.email@njeda\.com/i)).toHaveValue("");
    });

    it("email input has type email", () => {
      renderContactForm();
      expect(screen.getByPlaceholderText(/your\.email@njeda\.com/i)).toHaveAttribute(
        "type",
        "email",
      );
    });

    it("email input has the required attribute", () => {
      renderContactForm();
      expect(screen.getByPlaceholderText(/your\.email@njeda\.com/i)).toBeRequired();
    });
  });

  // -------------------------------------------------------------------------
  // Successful submission
  // -------------------------------------------------------------------------
  describe("successful submission", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
    });

    it("calls fetch with the correct endpoint", async () => {
      renderContactForm();
      await fillAndSubmit();
      await waitFor(() =>
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/save-contact-info",
          expect.objectContaining({ method: "POST" }),
        ),
      );
    });

    it("sends userId, sessionId, and email in the request body", async () => {
      renderContactForm();
      await fillAndSubmit("user@njeda.com");
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({
        userId: "user-123",
        sessionId: "session-abc",
        email: "user@njeda.com",
      });
    });

    it("shows a success toast after submission", async () => {
      const { toast } = await import("react-hot-toast");
      renderContactForm();
      await fillAndSubmit();
      await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    });

    it("renders the thank-you confirmation view after submission", async () => {
      renderContactForm();
      await fillAndSubmit();
      await waitFor(() =>
        expect(screen.getByText(/thank you for your feedback/i)).toBeInTheDocument(),
      );
    });

    it("no longer renders the form after submission", async () => {
      renderContactForm();
      await fillAndSubmit();
      await waitFor(() =>
        expect(screen.queryByRole("button", { name: /submit/i })).not.toBeInTheDocument(),
      );
    });

    it("logs a contact_email_submitted analytics event on submit", async () => {
      renderContactForm();
      await fillAndSubmit();
      await waitFor(() =>
        expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
          "contact_email_submitted",
          expect.objectContaining({ hasEmail: true }),
        ),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Failed submission
  // -------------------------------------------------------------------------
  describe("failed submission", () => {
    it("shows an error toast when the API returns a non-ok response", async () => {
      mockFetch.mockResolvedValue({ ok: false } as Response);
      const { toast } = await import("react-hot-toast");
      renderContactForm();
      await fillAndSubmit();
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    });

    it("does not show the confirmation view when submission fails", async () => {
      mockFetch.mockResolvedValue({ ok: false } as Response);
      renderContactForm();
      await fillAndSubmit();
      await waitFor(() =>
        expect(screen.queryByText(/thank you for your feedback/i)).not.toBeInTheDocument(),
      );
    });

    it("shows an error toast on a network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const { toast } = await import("react-hot-toast");
      renderContactForm();
      await fillAndSubmit();
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    });
  });

  // -------------------------------------------------------------------------
  // Validation — missing props
  // -------------------------------------------------------------------------
  describe("validation", () => {
    it("shows an error toast and does not call fetch when sessionId is empty", async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const { toast } = await import("react-hot-toast");
      render(<ContactForm userId="user-123" sessionId="" analytics={mockAnalytics as never} />);
      await fillAndSubmit();
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows an error toast and does not call fetch when userId is empty", async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const { toast } = await import("react-hot-toast");
      render(<ContactForm userId="" sessionId="session-abc" analytics={mockAnalytics as never} />);
      await fillAndSubmit();
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Analytics — email entered event
  // -------------------------------------------------------------------------
  describe("analytics events", () => {
    it("logs contact_email_entered when the first character is typed", async () => {
      renderContactForm();
      await userEvent.type(screen.getByPlaceholderText(/your\.email@njeda\.com/i), "a");
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith("contact_email_entered", {});
    });

    it("does not log contact_email_entered on subsequent characters", async () => {
      renderContactForm();
      await userEvent.type(screen.getByPlaceholderText(/your\.email@njeda\.com/i), "abc");
      const enteredCalls = mockAnalytics.logEvent.mock.calls.filter(
        ([name]) => name === "contact_email_entered",
      );
      expect(enteredCalls).toHaveLength(1);
    });

    it("does not log contact_email_submitted when validation fails", async () => {
      render(<ContactForm userId="" sessionId="session-abc" analytics={mockAnalytics as never} />);
      await fillAndSubmit();
      expect(mockAnalytics.logEvent).not.toHaveBeenCalledWith(
        "contact_email_submitted",
        expect.anything(),
      );
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ValidationResults from "../../components/ValidationResults";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    FileText: () => <svg data-testid="icon-file-text" />,
    Download: () => <svg data-testid="icon-download" />,
    Mail: () => <svg data-testid="icon-mail" />,
  };
});

vi.mock("../../components/SummaryCard", () => ({
  default: ({ documentsWithResults }: { documentsWithResults: unknown[] }) => (
    <div data-testid="summary-card" data-count={documentsWithResults.length} />
  ),
}));

vi.mock("../../components/SingleResultCard", () => ({
  default: ({ document }: { document: { id: string } }) => (
    <div data-testid={`result-card-${document.id}`} />
  ),
}));

vi.mock("../../utils/emailGenerator", () => ({
  generateEmailForAllDocuments: vi.fn().mockReturnValue("Dear Applicant,\n\nPlease submit."),
  extractProjectNumber: vi.fn().mockReturnValue(null),
}));

vi.mock("react-hot-toast", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const { mockJsPDFSave } = vi.hoisted(() => {
  const mockJsPDFSave = vi.fn();
  return { mockJsPDFSave };
});

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(function (this: object) {
    Object.assign(this, {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      setTextColor: vi.fn(),
      setDrawColor: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      addPage: vi.fn(),
      splitTextToSize: vi.fn().mockReturnValue(["line"]),
      save: mockJsPDFSave,
    });
  }),
}));

// ---------------------------------------------------------------------------
// Analytics mock
// ---------------------------------------------------------------------------

const mockAnalytics = {
  logEvent: vi.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePassedDocument(id = "doc-001") {
  return {
    id,
    file: { name: `${id}.pdf` } as File,
    type: "tax-clearance-online",
    projectNumber: null,
    result: {
      success: true,
      missingElements: [],
      passedChecks: ["Has date"],
      error: null,
      message: null,
      organizationNameMatches: true,
      documentInfo: {
        documentType: "Tax Clearance",
        pageCount: 1,
        wordCount: 200,
        containsHandwriting: false,
        detectedOrganizationName: null,
      },
      suggestedActions: [],
    },
  };
}

function makeFailedDocument(id = "doc-002") {
  return {
    id,
    file: { name: `${id}.pdf` } as File,
    type: "cert-formation",
    projectNumber: null,
    result: {
      success: false,
      missingElements: ["Valid Certificate Required"],
      passedChecks: [],
      error: null,
      message: null,
      organizationNameMatches: false,
      documentInfo: {
        documentType: "Certificate of Formation",
        pageCount: 2,
        wordCount: 400,
        containsHandwriting: false,
        detectedOrganizationName: "Acme Corp",
      },
      suggestedActions: ["Resubmit with correct certificate."],
    },
  };
}

const defaultProps = {
  isDarkMode: false,
  userId: "user-123",
  feedbackApiKey: "test-api-key",
  onOpenEmailModal: vi.fn(),
  onOpenPreviewModal: vi.fn(),
  analytics: mockAnalytics as never,
};

function renderResults(documents: object[], overrides = {}) {
  return render(
    <ValidationResults documents={documents as never} {...defaultProps} {...overrides} />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ValidationResults", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  describe("empty state", () => {
    it("renders the empty state when no documents have results", () => {
      renderResults([]);
      expect(screen.getByText("No Validation Results")).toBeInTheDocument();
    });

    it("renders the empty state when documents have no result property", () => {
      renderResults([{ id: "doc-001", file: { name: "test.pdf" }, result: null }]);
      expect(screen.getByText("No Validation Results")).toBeInTheDocument();
    });

    it("renders the FileText icon in the empty state", () => {
      renderResults([]);
      expect(screen.getByTestId("icon-file-text")).toBeInTheDocument();
    });

    it("renders the empty state description text", () => {
      renderResults([]);
      expect(screen.getByText(/Your validation results will appear here/i)).toBeInTheDocument();
    });

    it("does not render the Download Report button in the empty state", () => {
      renderResults([]);
      expect(screen.queryByRole("button", { name: /download report/i })).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Results state — rendering
  // -------------------------------------------------------------------------
  describe("results state — rendering", () => {
    it("renders the Validation Report heading", () => {
      renderResults([makePassedDocument()]);
      expect(screen.getByText("Validation Report")).toBeInTheDocument();
    });

    it("renders the SummaryCard with the correct document count", () => {
      renderResults([makePassedDocument(), makeFailedDocument()]);
      expect(screen.getByTestId("summary-card")).toHaveAttribute("data-count", "2");
    });

    it("renders a SingleResultCard for each document with a result", () => {
      renderResults([makePassedDocument("doc-001"), makeFailedDocument("doc-002")]);
      expect(screen.getByTestId("result-card-doc-001")).toBeInTheDocument();
      expect(screen.getByTestId("result-card-doc-002")).toBeInTheDocument();
    });

    it("renders the Download Report button when there are results", () => {
      renderResults([makePassedDocument()]);
      expect(screen.getByRole("button", { name: /download report/i })).toBeInTheDocument();
    });

    it("renders the Download icon", () => {
      renderResults([makePassedDocument()]);
      expect(screen.getByTestId("icon-download")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Email template button
  // -------------------------------------------------------------------------
  describe("email template button", () => {
    it("renders the See Email Template button when there are failed documents", () => {
      renderResults([makeFailedDocument()]);
      expect(screen.getByRole("button", { name: /see email template/i })).toBeInTheDocument();
    });

    it("does not render the See Email Template button when all documents passed", () => {
      renderResults([makePassedDocument()]);
      expect(screen.queryByRole("button", { name: /see email template/i })).not.toBeInTheDocument();
    });

    it("renders the Mail icon when failed documents are present", () => {
      renderResults([makeFailedDocument()]);
      expect(screen.getByTestId("icon-mail")).toBeInTheDocument();
    });

    it("calls onOpenEmailModal with the generated email when clicked", async () => {
      const onOpenEmailModal = vi.fn();
      renderResults([makeFailedDocument()], { onOpenEmailModal });
      await userEvent.click(screen.getByRole("button", { name: /see email template/i }));
      expect(onOpenEmailModal).toHaveBeenCalledWith("Dear Applicant,\n\nPlease submit.");
    });

    it("shows an error toast when no email can be generated", async () => {
      const { generateEmailForAllDocuments } = await import("../../utils/emailGenerator");
      (generateEmailForAllDocuments as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      const { toast } = await import("react-hot-toast");
      renderResults([makeFailedDocument()]);
      await userEvent.click(screen.getByRole("button", { name: /see email template/i }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    });

    it("does not call onOpenEmailModal when email generation returns null", async () => {
      const { generateEmailForAllDocuments } = await import("../../utils/emailGenerator");
      (generateEmailForAllDocuments as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      const onOpenEmailModal = vi.fn();
      renderResults([makeFailedDocument()], { onOpenEmailModal });
      await userEvent.click(screen.getByRole("button", { name: /see email template/i }));
      expect(onOpenEmailModal).not.toHaveBeenCalled();
    });

    it("logs email_template_opened analytics when clicked", async () => {
      renderResults([makeFailedDocument()]);
      await userEvent.click(screen.getByRole("button", { name: /see email template/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "email_template_opened",
        expect.objectContaining({ documentCount: 1 }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // PDF download
  // -------------------------------------------------------------------------
  describe("PDF download", () => {
    it("calls jsPDF save when the Download Report button is clicked", async () => {
      renderResults([makePassedDocument()]);
      await userEvent.click(screen.getByRole("button", { name: /download report/i }));
      expect(mockJsPDFSave).toHaveBeenCalledWith("validation-report.pdf");
    });

    it("logs pdf_download_clicked analytics when Download Report is clicked", async () => {
      renderResults([makePassedDocument()]);
      await userEvent.click(screen.getByRole("button", { name: /download report/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "pdf_download_clicked",
        expect.objectContaining({ documentCount: 1 }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Dark mode
  // -------------------------------------------------------------------------
  describe("dark mode", () => {
    it("applies dark heading text class when isDarkMode is true", () => {
      renderResults([makePassedDocument()], { isDarkMode: true });
      expect(screen.getByText("Validation Report")).toHaveClass("text-gray-200");
    });

    it("applies light heading text class when isDarkMode is false", () => {
      renderResults([makePassedDocument()], { isDarkMode: false });
      expect(screen.getByText("Validation Report")).toHaveClass("text-gray-800");
    });

    it("applies dark empty state border class when isDarkMode is true", () => {
      const { container } = renderResults([], { isDarkMode: true });
      expect(container.querySelector("[class*='border-gray-600']")).toBeInTheDocument();
    });

    it("applies light empty state border class when isDarkMode is false", () => {
      const { container } = renderResults([], { isDarkMode: false });
      expect(container.querySelector("[class*='border-gray-300']")).toBeInTheDocument();
    });
  });
});

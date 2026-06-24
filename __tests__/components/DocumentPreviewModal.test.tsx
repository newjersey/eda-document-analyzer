import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentPreviewModal from "../../components/DocumentPreviewModal";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    X: () => <svg data-testid="icon-x" />,
    FileText: () => <svg data-testid="icon-file-text" />,
    ZoomIn: () => <svg data-testid="icon-zoom-in" />,
    ZoomOut: () => <svg data-testid="icon-zoom-out" />,
    Maximize2: () => <svg data-testid="icon-maximize" />,
  };
});

vi.mock("../../components/DocumentViewer", () => ({
  default: ({ file }: { file: File }) => <div data-testid="document-viewer">{file?.name}</div>,
}));

vi.mock("../../components/SingleResultCard", () => ({
  default: ({ document }: { document: { id: string } }) => (
    <div data-testid={`single-result-card-${document.id}`} />
  ),
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

function makeDocument(overrides = {}) {
  return {
    id: "doc-001",
    file: { name: "invoice.pdf" } as File,
    type: "tax-clearance-online",
    result: null,
    ...overrides,
  };
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  document: makeDocument(),
  isDarkMode: false,
  userId: "user-123",
  feedbackApiKey: "test-api-key",
  analytics: mockAnalytics as never,
};

function renderModal(overrides = {}) {
  return render(<DocumentPreviewModal {...defaultProps} {...overrides} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DocumentPreviewModal", () => {
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

    it("renders nothing when document is null", () => {
      const { container } = renderModal({ document: null });
      expect(container).toBeEmptyDOMElement();
    });

    it("renders the modal when isOpen is true and document is provided", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------
  describe("accessibility", () => {
    it("has role dialog on the backdrop", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("has aria-modal set to true", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    });

    it("has aria-labelledby pointing to the title element", () => {
      renderModal();
      const dialog = screen.getByRole("dialog");
      const titleId = dialog.getAttribute("aria-labelledby");
      expect(document.getElementById(titleId ?? "")).toHaveTextContent("Document Preview");
    });
  });

  // -------------------------------------------------------------------------
  // Header content
  // -------------------------------------------------------------------------
  describe("header content", () => {
    it("renders the Document Preview heading", () => {
      renderModal();
      expect(screen.getByText("Document Preview")).toBeInTheDocument();
    });

    it("renders the document file name in the header", () => {
      renderModal();
      // Use getAllByText and find the <p> element specifically, since the
      // DocumentViewer mock also renders the file name as text content.
      const matches = screen.getAllByText("invoice.pdf");
      const headerP = matches.find((el) => el.tagName === "P");
      expect(headerP).toBeInTheDocument();
    });

    it("renders the FileText icon in the header", () => {
      renderModal();
      expect(screen.getByTestId("icon-file-text")).toBeInTheDocument();
    });

    it("renders the close button", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /close preview/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Close behaviour
  // -------------------------------------------------------------------------
  describe("close behaviour", () => {
    it("calls onClose when the close button is clicked", async () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      await userEvent.click(screen.getByRole("button", { name: /close preview/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("logs document_preview_closed with method close_button when the close button is clicked", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /close preview/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_preview_closed",
        expect.objectContaining({ method: "close_button" }),
      );
    });

    it("calls onClose when the Escape key is pressed", () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("logs document_preview_closed with method escape_key when Escape is pressed", () => {
      renderModal();
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_preview_closed",
        expect.objectContaining({ method: "escape_key" }),
      );
    });

    it("calls onClose when the backdrop is clicked", async () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      await userEvent.click(screen.getByRole("dialog"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("logs document_preview_closed with method backdrop_click when the backdrop is clicked", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("dialog"));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_preview_closed",
        expect.objectContaining({ method: "backdrop_click" }),
      );
    });

    it("does not call onClose when clicking inside the modal content", async () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      await userEvent.click(screen.getByText("Document Preview"));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Analytics — modal opened
  // -------------------------------------------------------------------------
  describe("analytics — modal opened", () => {
    it("logs document_preview_opened when the modal opens", () => {
      renderModal();
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_preview_opened",
        expect.objectContaining({ documentId: "doc-001", fileName: "invoice.pdf" }),
      );
    });

    it("logs hasValidationResult as false when result is null", () => {
      renderModal({ document: makeDocument({ result: null }) });
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_preview_opened",
        expect.objectContaining({ hasValidationResult: false }),
      );
    });

    it("logs hasValidationResult as true when result is present", () => {
      renderModal({
        document: makeDocument({ result: { success: true, missingElements: [] } }),
      });
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_preview_opened",
        expect.objectContaining({ hasValidationResult: true }),
      );
    });

    it("does not log document_preview_opened when isOpen is false", () => {
      renderModal({ isOpen: false });
      expect(mockAnalytics.logEvent).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Zoom controls
  // -------------------------------------------------------------------------
  describe("zoom controls", () => {
    it("renders the zoom out button", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
    });

    it("renders the zoom in button", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
    });

    it("renders the zoom reset button showing 100% initially", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /reset zoom/i })).toHaveTextContent("100%");
    });

    it("zoom out button is disabled at minimum zoom level (50%)", async () => {
      renderModal();
      const zoomOutBtn = screen.getByRole("button", { name: /zoom out/i });
      // Click zoom out until we reach the minimum
      for (let i = 0; i < 5; i++) {
        await userEvent.click(zoomOutBtn);
      }
      expect(zoomOutBtn).toBeDisabled();
    });

    it("zoom in button is disabled at maximum zoom level (300%)", async () => {
      renderModal();
      const zoomInBtn = screen.getByRole("button", { name: /zoom in/i });
      for (let i = 0; i < 9; i++) {
        await userEvent.click(zoomInBtn);
      }
      expect(zoomInBtn).toBeDisabled();
    });

    it("increases the zoom percentage display when zoom in is clicked", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /zoom in/i }));
      expect(screen.getByRole("button", { name: /reset zoom/i })).toHaveTextContent("125%");
    });

    it("decreases the zoom percentage display when zoom out is clicked", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /zoom out/i }));
      expect(screen.getByRole("button", { name: /reset zoom/i })).toHaveTextContent("75%");
    });

    it("resets the zoom to 100% when the reset button is clicked", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /zoom in/i }));
      await userEvent.click(screen.getByRole("button", { name: /reset zoom/i }));
      expect(screen.getByRole("button", { name: /reset zoom/i })).toHaveTextContent("100%");
    });

    it("resets zoom to 100% when the modal reopens", async () => {
      const { rerender } = renderModal();
      await userEvent.click(screen.getByRole("button", { name: /zoom in/i }));
      rerender(<DocumentPreviewModal {...defaultProps} isOpen={false} />);
      rerender(<DocumentPreviewModal {...defaultProps} isOpen={true} />);
      expect(screen.getByRole("button", { name: /reset zoom/i })).toHaveTextContent("100%");
    });

    it("logs document_preview_zoom_in when zoom in is clicked", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /zoom in/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_preview_zoom_in",
        expect.objectContaining({ documentId: "doc-001" }),
      );
    });

    it("logs document_preview_zoom_out when zoom out is clicked", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /zoom out/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_preview_zoom_out",
        expect.objectContaining({ documentId: "doc-001" }),
      );
    });

    it("logs document_preview_zoom_reset when the reset button is clicked", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: /reset zoom/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_preview_zoom_reset",
        expect.objectContaining({ documentId: "doc-001" }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Layout — document only (no validation result)
  // -------------------------------------------------------------------------
  describe("layout — document only", () => {
    it("renders the DocumentViewer when result is null", () => {
      renderModal({ document: makeDocument({ result: null }) });
      expect(screen.getByTestId("document-viewer")).toBeInTheDocument();
    });

    it("does not render the SingleResultCard when result is null", () => {
      renderModal({ document: makeDocument({ result: null }) });
      expect(screen.queryByTestId("single-result-card-doc-001")).not.toBeInTheDocument();
    });

    it("does not render the Validation Result panel label when result is null", () => {
      renderModal({ document: makeDocument({ result: null }) });
      expect(screen.queryByText("Validation Result")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Layout — side-by-side (with validation result)
  // -------------------------------------------------------------------------
  describe("layout — side-by-side with validation result", () => {
    const documentWithResult = makeDocument({
      result: { success: true, missingElements: [] },
    });

    it("renders the DocumentViewer in the side-by-side layout", () => {
      renderModal({ document: documentWithResult });
      expect(screen.getByTestId("document-viewer")).toBeInTheDocument();
    });

    it("renders the SingleResultCard in the side-by-side layout", () => {
      renderModal({ document: documentWithResult });
      expect(screen.getByTestId("single-result-card-doc-001")).toBeInTheDocument();
    });

    it("renders the Document panel label", () => {
      renderModal({ document: documentWithResult });
      expect(screen.getByText("Document")).toBeInTheDocument();
    });

    it("renders the Validation Result panel label", () => {
      renderModal({ document: documentWithResult });
      expect(screen.getByText("Validation Result")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Dark mode
  // -------------------------------------------------------------------------
  describe("dark mode", () => {
    it("applies dark background to the modal content when isDarkMode is true", () => {
      renderModal({ isDarkMode: true });
      const modal = screen.getByRole("dialog").querySelector("[class*='bg-gray-800']");
      expect(modal).toBeInTheDocument();
    });

    it("applies light background to the modal content when isDarkMode is false", () => {
      renderModal({ isDarkMode: false });
      const modal = screen.getByRole("dialog").querySelector("[class*='bg-white']");
      expect(modal).toBeInTheDocument();
    });
  });
});

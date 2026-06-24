import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileUploadArea from "../../components/FileUploadArea";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    CheckCircle: () => <svg data-testid="icon-check-circle" />,
    ChevronDown: ({ className }: { className: string }) => (
      <svg data-testid="icon-chevron-down" className={className} />
    ),
    FileText: () => <svg data-testid="icon-file-text" />,
    PlusCircle: () => <svg data-testid="icon-plus-circle" />,
    Upload: () => <svg data-testid="icon-upload" />,
    X: () => <svg data-testid="icon-x" />,
  };
});

vi.mock("../../components/GuidanceContent", () => ({
  default: ({ onViewSample }: { onViewSample: (info: unknown) => void }) => (
    <div data-testid="guidance-content">
      <button
        type="button"
        onClick={() =>
          onViewSample({
            type: "cert-formation",
            label: "Certificate of Formation",
            samplePath: "/sample-documents/cert-formation.pdf",
          })
        }
      >
        View Sample
      </button>
    </div>
  ),
}));

vi.mock("../../utils/documentTypeDetector", () => ({
  getAvailableDocumentTypes: vi.fn().mockReturnValue([
    { value: "tax-clearance-online", label: "Tax Clearance Certificate (Online)" },
    { value: "cert-formation", label: "Certificate of Formation" },
  ]),
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

function makeDocument(overrides = {}) {
  return {
    id: "doc-001",
    file: { name: "invoice.pdf", size: 1024 } as File,
    type: "tax-clearance-online",
    detectedCategory: "tax-clearance",
    result: null,
    projectNumber: null,
    ...overrides,
  };
}

const defaultProps = {
  documents: [],
  handleDocumentTypeChange: vi.fn(),
  removeDocument: vi.fn(),
  isDragOver: false,
  handleFileChange: vi.fn(),
  handleDragEnter: vi.fn(),
  handleDragLeave: vi.fn(),
  handleDragOver: vi.fn(),
  handleDrop: vi.fn(),
  isDarkMode: false,
  handleDocumentPreview: vi.fn(),
  analytics: mockAnalytics as never,
};

function renderUploadArea(overrides = {}) {
  return render(<FileUploadArea {...defaultProps} {...overrides} />);
}

function makeDropEvent(files: File[]) {
  return {
    dataTransfer: {
      files,
      items: files.map((f) => ({ kind: "file", getAsFile: () => f })),
      types: ["Files"],
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FileUploadArea", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Empty state (no documents)
  // -------------------------------------------------------------------------
  describe("empty state", () => {
    it("renders the Upload icon when no documents are present", () => {
      renderUploadArea();
      expect(screen.getByTestId("icon-upload")).toBeInTheDocument();
    });

    it("renders the drag and drop prompt when no documents are present", () => {
      renderUploadArea();
      expect(screen.getByText("Drag & drop or add your files")).toBeInTheDocument();
    });

    it("renders the Browse Files button when no documents are present", () => {
      renderUploadArea();
      expect(screen.getByRole("button", { name: /browse files/i })).toBeInTheDocument();
    });

    it("renders the accepted file types hint", () => {
      renderUploadArea();
      expect(screen.getByText(/PDF, JPG, PNG/i)).toBeInTheDocument();
    });

    it("renders the hidden file input", () => {
      renderUploadArea();
      const input = document.getElementById("file-upload") as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "file");
    });
  });

  // -------------------------------------------------------------------------
  // Drag-over state
  // -------------------------------------------------------------------------
  describe("drag-over state", () => {
    it("renders the drop prompt when isDragOver is true", () => {
      renderUploadArea({ isDragOver: true });
      expect(screen.getByText("Drop your files here!")).toBeInTheDocument();
    });

    it("renders the Release to upload hint when isDragOver is true", () => {
      renderUploadArea({ isDragOver: true });
      expect(screen.getByText("Release to upload")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Documents present state
  // -------------------------------------------------------------------------
  describe("documents present state", () => {
    it("renders the CheckCircle icon when documents are present", () => {
      renderUploadArea({ documents: [makeDocument()] });
      expect(screen.getByTestId("icon-check-circle")).toBeInTheDocument();
    });

    it("renders the correct file count label", () => {
      renderUploadArea({ documents: [makeDocument()] });
      expect(screen.getByText("1 file(s) ready for validation")).toBeInTheDocument();
    });

    it("renders the file name for each document", () => {
      renderUploadArea({ documents: [makeDocument()] });
      expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
    });

    it("renders the FileText icon for each document", () => {
      renderUploadArea({ documents: [makeDocument()] });
      expect(screen.getByTestId("icon-file-text")).toBeInTheDocument();
    });

    it("renders a document type dropdown for each document", () => {
      renderUploadArea({ documents: [makeDocument()] });
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders the remove button for each document", () => {
      renderUploadArea({ documents: [makeDocument()] });
      expect(screen.getByRole("button", { name: /remove file/i })).toBeInTheDocument();
    });

    it("renders the Add Another File button when documents are present", () => {
      renderUploadArea({ documents: [makeDocument()] });
      expect(screen.getByRole("button", { name: /add another file/i })).toBeInTheDocument();
    });

    it("renders the correct file count for multiple documents", () => {
      renderUploadArea({
        documents: [
          makeDocument({ id: "doc-001" }),
          makeDocument({ id: "doc-002", file: { name: "contract.pdf" } as File }),
        ],
      });
      expect(screen.getByText("2 file(s) ready for validation")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // File preview interaction
  // -------------------------------------------------------------------------
  describe("file preview interaction", () => {
    it("calls handleDocumentPreview when a file name is clicked", async () => {
      const handleDocumentPreview = vi.fn();
      const doc = makeDocument();
      renderUploadArea({ documents: [doc], handleDocumentPreview });
      await userEvent.click(screen.getByText("invoice.pdf"));
      expect(handleDocumentPreview).toHaveBeenCalledWith(doc);
    });
  });

  // -------------------------------------------------------------------------
  // Document type dropdown
  // -------------------------------------------------------------------------
  describe("document type dropdown", () => {
    it("shows the available document types in the dropdown", () => {
      renderUploadArea({ documents: [makeDocument()] });
      expect(
        screen.getByRole("option", { name: /Tax Clearance Certificate/i }),
      ).toBeInTheDocument();
    });

    it("calls handleDocumentTypeChange when a new type is selected", async () => {
      const handleDocumentTypeChange = vi.fn();
      renderUploadArea({
        documents: [makeDocument({ type: "tax-clearance-online" })],
        handleDocumentTypeChange,
      });
      await userEvent.selectOptions(screen.getByRole("combobox"), "cert-formation");
      expect(handleDocumentTypeChange).toHaveBeenCalledWith("doc-001", "cert-formation");
    });

    it("logs document_type_changed analytics when an existing type is changed", async () => {
      renderUploadArea({
        documents: [makeDocument({ type: "tax-clearance-online" })],
      });
      await userEvent.selectOptions(screen.getByRole("combobox"), "cert-formation");
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_type_changed",
        expect.objectContaining({
          documentId: "doc-001",
          previousType: "tax-clearance-online",
          newType: "cert-formation",
        }),
      );
    });

    it("logs document_type_manually_selected when a type is selected for the first time", async () => {
      renderUploadArea({
        documents: [makeDocument({ type: "" })],
      });
      await userEvent.selectOptions(screen.getByRole("combobox"), "cert-formation");
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "document_type_manually_selected",
        expect.objectContaining({ documentId: "doc-001", selectedType: "cert-formation" }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Remove document
  // -------------------------------------------------------------------------
  describe("remove document", () => {
    it("calls removeDocument when the remove button is clicked", async () => {
      const removeDocument = vi.fn();
      renderUploadArea({ documents: [makeDocument()], removeDocument });
      await userEvent.click(screen.getByRole("button", { name: /remove file/i }));
      expect(removeDocument).toHaveBeenCalledWith("doc-001");
    });

    it("logs file_removed analytics when a document is removed", async () => {
      renderUploadArea({ documents: [makeDocument()] });
      await userEvent.click(screen.getByRole("button", { name: /remove file/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "file_removed",
        expect.objectContaining({ documentId: "doc-001" }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Drag and drop
  // -------------------------------------------------------------------------
  describe("drag and drop", () => {
    it("calls handleDragEnter when a file is dragged over", () => {
      const handleDragEnter = vi.fn();
      renderUploadArea({ handleDragEnter });
      const dropZone =
        screen.getByTestId("icon-upload").closest("[onDragEnter]") ??
        document.querySelector("[class*='border-dashed']");
      fireEvent.dragEnter(dropZone as HTMLElement);
      expect(handleDragEnter).toHaveBeenCalledTimes(1);
    });

    it("calls handleDrop and logs drag_and_drop analytics when files are dropped", () => {
      const handleDrop = vi.fn();
      renderUploadArea({ handleDrop });
      const dropZone = document.querySelector("[class*='border-dashed']") as HTMLElement;
      const file = new File(["content"], "dropped.pdf", { type: "application/pdf" });
      fireEvent.drop(dropZone, makeDropEvent([file]));
      expect(handleDrop).toHaveBeenCalledTimes(1);
    });

    it("logs file_upload_local with method drag_and_drop when files are dropped", () => {
      renderUploadArea();
      const dropZone = document.querySelector("[class*='border-dashed']") as HTMLElement;
      const file = new File(["content"], "dropped.pdf", { type: "application/pdf" });
      fireEvent.drop(dropZone, makeDropEvent([file]));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "file_upload_local",
        expect.objectContaining({ method: "drag_and_drop", fileCount: 1 }),
      );
    });

    it("does not log file_upload_local when dropped with no files", () => {
      renderUploadArea();
      const dropZone = document.querySelector("[class*='border-dashed']") as HTMLElement;
      fireEvent.drop(dropZone, makeDropEvent([]));
      expect(mockAnalytics.logEvent).not.toHaveBeenCalledWith(
        "file_upload_local",
        expect.objectContaining({ method: "drag_and_drop" }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Browse button
  // -------------------------------------------------------------------------
  describe("browse button", () => {
    it("logs file_upload_local with method browse_button when clicked", async () => {
      renderUploadArea();
      await userEvent.click(screen.getByRole("button", { name: /browse files/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "file_upload_local",
        expect.objectContaining({ method: "browse_button" }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Guidance accordion
  // -------------------------------------------------------------------------
  describe("guidance accordion", () => {
    it("renders the How to Select the Right Document accordion header", () => {
      renderUploadArea();
      expect(screen.getAllByText("How to Select the Right Document?").length).toBeGreaterThan(0);
    });

    it("does not render GuidanceContent when the accordion is closed", () => {
      renderUploadArea();
      expect(screen.queryByTestId("guidance-content")).not.toBeInTheDocument();
    });

    it("renders GuidanceContent when the accordion is opened", async () => {
      renderUploadArea();
      await userEvent.click(
        screen.getByRole("button", { name: /how to select the right document/i }),
      );
      expect(screen.getByTestId("guidance-content")).toBeInTheDocument();
    });

    it("logs guidance_opened analytics when the accordion is expanded", async () => {
      renderUploadArea();
      await userEvent.click(
        screen.getByRole("button", { name: /how to select the right document/i }),
      );
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith("guidance_opened", {});
    });

    it("logs guidance_closed analytics when the accordion is collapsed", async () => {
      renderUploadArea();
      const btn = screen.getByRole("button", { name: /how to select the right document/i });
      await userEvent.click(btn);
      await userEvent.click(btn);
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith("guidance_closed", {});
    });

    it("hides GuidanceContent when the accordion is closed again", async () => {
      renderUploadArea();
      const btn = screen.getByRole("button", { name: /how to select the right document/i });
      await userEvent.click(btn);
      await userEvent.click(btn);
      expect(screen.queryByTestId("guidance-content")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // View sample document
  // -------------------------------------------------------------------------
  describe("view sample document", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(["pdf content"], { type: "application/pdf" })),
      } as Response);
    });

    it("calls handleDocumentPreview with a sample document object when fetch succeeds", async () => {
      const handleDocumentPreview = vi.fn();
      renderUploadArea({ handleDocumentPreview });
      await userEvent.click(
        screen.getByRole("button", { name: /how to select the right document/i }),
      );
      await userEvent.click(screen.getByRole("button", { name: /view sample/i }));
      await waitFor(() => expect(handleDocumentPreview).toHaveBeenCalledTimes(1));
      const arg = handleDocumentPreview.mock.calls[0][0];
      expect(arg.id).toBe("sample-cert-formation");
      expect(arg.type).toBe("cert-formation");
    });

    it("logs guidance_sample_viewed analytics when a sample is viewed", async () => {
      renderUploadArea();
      await userEvent.click(
        screen.getByRole("button", { name: /how to select the right document/i }),
      );
      await userEvent.click(screen.getByRole("button", { name: /view sample/i }));
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        "guidance_sample_viewed",
        expect.objectContaining({ documentType: "cert-formation" }),
      );
    });

    it("shows an error toast when fetching the sample document fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const toast = await import("react-hot-toast");
      renderUploadArea();
      await userEvent.click(
        screen.getByRole("button", { name: /how to select the right document/i }),
      );
      await userEvent.click(screen.getByRole("button", { name: /view sample/i }));
      await waitFor(() => expect(toast.default.error).toHaveBeenCalledTimes(1));
    });
  });

  // -------------------------------------------------------------------------
  // Dark mode
  // -------------------------------------------------------------------------
  describe("dark mode", () => {
    it("applies dark border to the guidance accordion when isDarkMode is true", () => {
      const { container } = renderUploadArea({ isDarkMode: true });
      const accordion = container.querySelector("[class*='border-gray-700']");
      expect(accordion).toBeInTheDocument();
    });

    it("applies light border to the guidance accordion when isDarkMode is false", () => {
      const { container } = renderUploadArea({ isDarkMode: false });
      const accordion = container.querySelector("[class*='border-gray-200']");
      expect(accordion).toBeInTheDocument();
    });
  });
});

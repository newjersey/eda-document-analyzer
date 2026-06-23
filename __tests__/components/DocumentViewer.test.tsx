import { render, screen, waitFor } from "@testing-library/react";
import DocumentViewer from "../../components/DocumentViewer";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    FileText: () => <svg data-testid="icon-file-text" />,
    AlertCircle: () => <svg data-testid="icon-alert-circle" />,
  };
});

vi.mock("mammoth", () => ({
  default: {
    convertToHtml: vi.fn().mockResolvedValue({ value: "<p>Word content</p>", messages: [] }),
  },
}));

vi.mock("next/dynamic", () => ({
  default: (_fn: () => Promise<{ default: React.ComponentType }>) => {
    // Return a simple stub that renders a placeholder testid
    const Stub = ({ pdfData }: { pdfData: unknown }) =>
      pdfData ? <div data-testid="pdf-viewer" /> : null;
    Stub.displayName = "PDFViewerStub";
    return Stub;
  },
}));

// ---------------------------------------------------------------------------
// File factory helpers
// ---------------------------------------------------------------------------

function makeFile(name: string, type: string, content = "file content"): File {
  return new File([content], name, { type });
}

function makePdfFile() {
  return makeFile("document.pdf", "application/pdf");
}

function makeImageFile(ext = "png") {
  return makeFile(`photo.${ext}`, `image/${ext}`);
}

function makeTextFile() {
  return makeFile("notes.txt", "text/plain", "Hello, world!");
}

function makeDocxFile() {
  return makeFile(
    "report.docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
}

function makeDocFile() {
  return makeFile("report.doc", "application/msword");
}

function makeUnsupportedFile() {
  return makeFile("archive.zip", "application/zip");
}

// ---------------------------------------------------------------------------
// Browser API stubs
// ---------------------------------------------------------------------------

const mockArrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
const mockText = vi.fn().mockResolvedValue("Hello, world!");
const mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
const mockRevokeObjectURL = vi.fn();

vi.stubGlobal("URL", {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  isDarkMode: false,
  zoomLevel: 1.0,
};

function renderViewer(file: File | null, overrides = {}) {
  return render(<DocumentViewer file={file} {...defaultProps} {...overrides} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DocumentViewer", () => {
  beforeEach(() => {
    // Attach mocked methods to File prototype so all File instances use them
    File.prototype.arrayBuffer = mockArrayBuffer;
    File.prototype.text = mockText;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // No file provided
  // -------------------------------------------------------------------------
  describe("no file provided", () => {
    it("renders the error state when file is null", async () => {
      renderViewer(null);
      await waitFor(() => expect(screen.getByText("No file provided")).toBeInTheDocument());
    });

    it("renders the AlertCircle icon when file is null", async () => {
      renderViewer(null);
      await waitFor(() => expect(screen.getByTestId("icon-alert-circle")).toBeInTheDocument());
    });
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  describe("loading state", () => {
    it("renders a loading spinner initially", () => {
      renderViewer(makePdfFile());
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("renders the loading text initially", () => {
      renderViewer(makePdfFile());
      expect(screen.getByText("Loading document preview...")).toBeInTheDocument();
    });

    it("applies dark background to the loading container when isDarkMode is true", () => {
      const { container } = renderViewer(makePdfFile(), { isDarkMode: true });
      expect(container.firstChild).toHaveClass("bg-gray-800");
    });

    it("applies light background to the loading container when isDarkMode is false", () => {
      const { container } = renderViewer(makePdfFile(), { isDarkMode: false });
      expect(container.firstChild).toHaveClass("bg-gray-50");
    });
  });

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  describe("error state", () => {
    it("renders the error message when preview generation fails", async () => {
      mockArrayBuffer.mockRejectedValueOnce(new Error("Read error"));
      renderViewer(makePdfFile());
      await waitFor(() =>
        expect(screen.getByText("Failed to load document preview")).toBeInTheDocument(),
      );
    });

    it("renders the AlertCircle icon in the error state", async () => {
      mockArrayBuffer.mockRejectedValueOnce(new Error("Read error"));
      renderViewer(makePdfFile());
      await waitFor(() => expect(screen.getByTestId("icon-alert-circle")).toBeInTheDocument());
    });

    it("displays the file name in the error state", async () => {
      mockArrayBuffer.mockRejectedValueOnce(new Error("Read error"));
      renderViewer(makePdfFile());
      await waitFor(() => expect(screen.getByText("File: document.pdf")).toBeInTheDocument());
    });

    it("renders the unsupported file type error message", async () => {
      renderViewer(makeUnsupportedFile());
      await waitFor(() =>
        expect(screen.getByText("Preview not available for this file type")).toBeInTheDocument(),
      );
    });

    it("applies dark background to the error container when isDarkMode is true", async () => {
      mockArrayBuffer.mockRejectedValueOnce(new Error("Read error"));
      const { container } = renderViewer(makePdfFile(), { isDarkMode: true });
      await waitFor(() => expect(container.firstChild).toHaveClass("bg-gray-800"));
    });
  });

  // -------------------------------------------------------------------------
  // PDF preview
  // -------------------------------------------------------------------------
  describe("PDF preview", () => {
    it("renders the PDFViewer for a PDF file by MIME type", async () => {
      renderViewer(makePdfFile());
      await waitFor(() => expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument());
    });

    it("renders the PDFViewer for a file with a .pdf extension regardless of MIME type", async () => {
      const file = makeFile("document.pdf", "application/octet-stream");
      renderViewer(file);
      await waitFor(() => expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument());
    });

    it("calls arrayBuffer on the file to read PDF data", async () => {
      renderViewer(makePdfFile());
      await waitFor(() => expect(mockArrayBuffer).toHaveBeenCalledTimes(1));
    });
  });

  // -------------------------------------------------------------------------
  // Image preview
  // -------------------------------------------------------------------------
  describe("image preview", () => {
    it("renders an img element for a PNG file", async () => {
      renderViewer(makeImageFile("png"));
      await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    });

    it("renders an img element for a JPG file", async () => {
      renderViewer(makeImageFile("jpg"));
      await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    });

    it("sets the img src to the blob URL", async () => {
      renderViewer(makeImageFile("png"));
      await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", "blob:mock-url"));
    });

    it("calls URL.createObjectURL with the file", async () => {
      const file = makeImageFile("png");
      renderViewer(file);
      await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalledWith(file));
    });

    it("applies the zoom level to the image width style", async () => {
      renderViewer(makeImageFile("png"), { zoomLevel: 1.5 });
      await waitFor(() => {
        const img = screen.getByRole("img");
        expect(img).toHaveStyle({ width: "150%" });
      });
    });
  });

  // -------------------------------------------------------------------------
  // Text preview
  // -------------------------------------------------------------------------
  describe("text preview", () => {
    it("renders the text content for a plain text file", async () => {
      renderViewer(makeTextFile());
      await waitFor(() => expect(screen.getByText("Hello, world!")).toBeInTheDocument());
    });

    it("renders a pre element for text content", async () => {
      renderViewer(makeTextFile());
      await waitFor(() => expect(document.querySelector("pre")).toBeInTheDocument());
    });

    it("applies dark background to the text container when isDarkMode is true", async () => {
      renderViewer(makeTextFile(), { isDarkMode: true });
      await waitFor(() => {
        // Target the pre element's grandparent — the text content wrapper —
        // which carries the bg class. querySelector(".overflow-auto") would
        // match the outer document-viewer-container instead.
        const textContainer = document.querySelector("pre")?.parentElement?.parentElement;
        expect(textContainer).toHaveClass("bg-gray-900");
      });
    });

    it("applies the zoom level to the font size style", async () => {
      renderViewer(makeTextFile(), { zoomLevel: 1.5 });
      await waitFor(() => {
        const zoomDiv = document.querySelector("pre")?.parentElement;
        expect(zoomDiv).toHaveStyle({ fontSize: "1.5rem" });
      });
    });
  });

  // -------------------------------------------------------------------------
  // Word document preview
  // -------------------------------------------------------------------------
  describe("Word document preview", () => {
    it("renders the converted HTML for a DOCX file", async () => {
      renderViewer(makeDocxFile());
      await waitFor(() => expect(screen.getByText("Word content")).toBeInTheDocument());
    });

    it("renders the converted HTML for a DOC file", async () => {
      renderViewer(makeDocFile());
      await waitFor(() => expect(screen.getByText("Word content")).toBeInTheDocument());
    });

    it("renders the converted HTML for a file with .docx extension", async () => {
      const file = makeFile("report.docx", "application/octet-stream");
      renderViewer(file);
      await waitFor(() => expect(screen.getByText("Word content")).toBeInTheDocument());
    });

    it("shows an error when mammoth fails to convert", async () => {
      const mammoth = await import("mammoth");
      (mammoth.default.convertToHtml as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Conversion failed"),
      );
      renderViewer(makeDocxFile());
      await waitFor(() =>
        expect(screen.getByText(/Failed to convert Word document/i)).toBeInTheDocument(),
      );
    });

    it("shows an error when mammoth returns empty content", async () => {
      const mammoth = await import("mammoth");
      (mammoth.default.convertToHtml as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        value: "",
        messages: [],
      });
      renderViewer(makeDocxFile());
      await waitFor(() =>
        expect(screen.getByText(/Failed to convert Word document/i)).toBeInTheDocument(),
      );
    });

    it("applies the zoom level to the Word content font size style", async () => {
      renderViewer(makeDocxFile(), { zoomLevel: 2 });
      await waitFor(() => {
        const proseDiv = document.querySelector(".prose");
        expect(proseDiv).toHaveStyle({ fontSize: "2rem" });
      });
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------
  describe("cleanup", () => {
    it("calls URL.revokeObjectURL when the component unmounts after an image preview", async () => {
      const { unmount } = renderViewer(makeImageFile("png"));
      await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
      unmount();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });
});

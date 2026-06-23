import { render, screen, waitFor } from "@testing-library/react";
import PDFViewer from "../../components/PDFViewer";

// ---------------------------------------------------------------------------
// Mock pdfjs-dist
// ---------------------------------------------------------------------------

const { mockGetDocument, mockGetPage, mockRender } = vi.hoisted(() => {
  const mockRender = vi.fn().mockReturnValue({ promise: Promise.resolve() });
  const mockGetPage = vi.fn().mockResolvedValue({
    getViewport: vi.fn().mockReturnValue({ height: 800, width: 600 }),
    render: mockRender,
  });
  const mockGetDocument = vi.fn().mockReturnValue({
    promise: Promise.resolve({ numPages: 2, getPage: mockGetPage }),
  });
  return { mockGetDocument, mockGetPage, mockRender };
});

vi.mock("pdfjs-dist", () => ({
  getDocument: mockGetDocument,
  GlobalWorkerOptions: { workerSrc: "" },
  version: "3.0.0",
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  pdfData: "base64encodedpdfdata",
  isDarkMode: false,
  zoomLevel: 1,
};

function renderPDFViewer(overrides = {}) {
  return render(<PDFViewer {...defaultProps} {...overrides} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PDFViewer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  describe("loading state", () => {
    it("renders the loading spinner while the PDF is being loaded", () => {
      // Keep the promise pending so the loading state stays visible
      mockGetDocument.mockReturnValueOnce({ promise: new Promise(() => {}) });
      renderPDFViewer();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("applies dark background to the loading container when isDarkMode is true", () => {
      mockGetDocument.mockReturnValueOnce({ promise: new Promise(() => {}) });
      const { container } = renderPDFViewer({ isDarkMode: true });
      expect(container.firstChild).toHaveClass("bg-gray-900");
    });

    it("applies light background to the loading container when isDarkMode is false", () => {
      mockGetDocument.mockReturnValueOnce({ promise: new Promise(() => {}) });
      const { container } = renderPDFViewer({ isDarkMode: false });
      expect(container.firstChild).toHaveClass("bg-gray-100");
    });
  });

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  describe("error state", () => {
    it("renders the error message when the PDF fails to load", async () => {
      mockGetDocument.mockReturnValueOnce({
        promise: Promise.reject(new Error("Network error")),
      });
      renderPDFViewer();
      await waitFor(() =>
        expect(screen.getByText("Failed to load PDF document")).toBeInTheDocument(),
      );
    });

    it("applies dark text class to the error message when isDarkMode is true", async () => {
      mockGetDocument.mockReturnValueOnce({
        promise: Promise.reject(new Error("Network error")),
      });
      renderPDFViewer({ isDarkMode: true });
      await waitFor(() => {
        const msg = screen.getByText("Failed to load PDF document");
        expect(msg).toHaveClass("text-gray-300");
      });
    });

    it("applies light text class to the error message when isDarkMode is false", async () => {
      mockGetDocument.mockReturnValueOnce({
        promise: Promise.reject(new Error("Network error")),
      });
      renderPDFViewer({ isDarkMode: false });
      await waitFor(() => {
        const msg = screen.getByText("Failed to load PDF document");
        expect(msg).toHaveClass("text-gray-600");
      });
    });
  });

  // -------------------------------------------------------------------------
  // Successful load
  // -------------------------------------------------------------------------
  describe("successful load", () => {
    it("calls getDocument with the provided pdfData", async () => {
      renderPDFViewer({ pdfData: "mypdfdata" });
      await waitFor(() => expect(mockGetDocument).toHaveBeenCalledWith({ data: "mypdfdata" }));
    });

    it("does not call getDocument when pdfData is empty", () => {
      renderPDFViewer({ pdfData: "" });
      expect(mockGetDocument).not.toHaveBeenCalled();
    });

    it("renders the container div after loading", async () => {
      const { container } = renderPDFViewer();
      await waitFor(() =>
        expect(container.querySelector("[class*='flex-col']")).toBeInTheDocument(),
      );
    });

    it("applies dark background to the container when isDarkMode is true", async () => {
      const { container } = renderPDFViewer({ isDarkMode: true });
      await waitFor(() => expect(container.firstChild).toHaveClass("bg-gray-900"));
    });

    it("applies light background to the container when isDarkMode is false", async () => {
      const { container } = renderPDFViewer({ isDarkMode: false });
      await waitFor(() => expect(container.firstChild).toHaveClass("bg-gray-100"));
    });
  });

  // -------------------------------------------------------------------------
  // Page rendering
  // -------------------------------------------------------------------------
  describe("page rendering", () => {
    it("calls getPage for each page in the document", async () => {
      renderPDFViewer();
      await waitFor(() => expect(mockGetPage).toHaveBeenCalledTimes(2));
      expect(mockGetPage).toHaveBeenCalledWith(1);
      expect(mockGetPage).toHaveBeenCalledWith(2);
    });

    it("calls getViewport with the correct scale based on zoomLevel", async () => {
      const mockGetViewport = vi.fn().mockReturnValue({ height: 800, width: 600 });
      mockGetPage.mockResolvedValue({ getViewport: mockGetViewport, render: mockRender });

      renderPDFViewer({ zoomLevel: 2 });
      await waitFor(() => expect(mockGetViewport).toHaveBeenCalledWith({ scale: 1.5 * 2 }));
    });

    it("calls render on each page", async () => {
      renderPDFViewer();
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(2));
    });

    it("re-renders pages when zoomLevel changes", async () => {
      const { rerender } = renderPDFViewer({ zoomLevel: 1 });
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(2));

      mockRender.mockClear();
      rerender(<PDFViewer {...defaultProps} zoomLevel={2} />);
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(2));
    });

    it("renders a single page document correctly", async () => {
      mockGetDocument.mockReturnValueOnce({
        promise: Promise.resolve({ numPages: 1, getPage: mockGetPage }),
      });
      renderPDFViewer();
      await waitFor(() => expect(mockGetPage).toHaveBeenCalledTimes(1));
      expect(mockGetPage).toHaveBeenCalledWith(1);
    });
  });

  // -------------------------------------------------------------------------
  // pdfData changes
  // -------------------------------------------------------------------------
  describe("pdfData changes", () => {
    it("reloads the PDF when pdfData changes", async () => {
      const { rerender } = renderPDFViewer({ pdfData: "original-data" });
      await waitFor(() => expect(mockGetDocument).toHaveBeenCalledTimes(1));

      rerender(<PDFViewer {...defaultProps} pdfData="new-data" />);
      await waitFor(() => expect(mockGetDocument).toHaveBeenCalledTimes(2));
      expect(mockGetDocument).toHaveBeenLastCalledWith({ data: "new-data" });
    });

    it("does not reload when pdfData stays the same", async () => {
      const { rerender } = renderPDFViewer({ pdfData: "same-data" });
      await waitFor(() => expect(mockGetDocument).toHaveBeenCalledTimes(1));

      rerender(<PDFViewer {...defaultProps} pdfData="same-data" />);
      expect(mockGetDocument).toHaveBeenCalledTimes(1);
    });
  });
});

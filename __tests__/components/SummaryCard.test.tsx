import { render, screen } from "@testing-library/react";
import SummaryCard from "../../components/SummaryCard";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    Check: () => <svg data-testid="icon-check" />,
    X: () => <svg data-testid="icon-x" />,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePassedDocument(id = "doc-001") {
  return {
    id,
    file: { name: `${id}.pdf` } as File,
    type: "tax-clearance-online",
    result: { success: true, missingElements: [], error: null },
  };
}

function makeFailedDocument(id = "doc-002") {
  return {
    id,
    file: { name: `${id}.pdf` } as File,
    type: "cert-formation",
    result: { success: false, missingElements: ["Valid Tax Clearance Required"], error: null },
  };
}

function makeErrorDocument(id = "doc-003") {
  return {
    id,
    file: { name: `${id}.pdf` } as File,
    type: "cert-authority",
    result: { success: false, missingElements: [], error: "Parse error" },
  };
}

const defaultProps = {
  isDarkMode: false,
};

function renderCard(documentsWithResults: object[], overrides = {}) {
  return render(
    <SummaryCard
      documentsWithResults={documentsWithResults as never}
      {...defaultProps}
      {...overrides}
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SummaryCard", () => {
  // -------------------------------------------------------------------------
  // Null / empty guards
  // -------------------------------------------------------------------------
  describe("null and empty guards", () => {
    it("renders nothing when documentsWithResults is null", () => {
      const { container } = renderCard(null as never);
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when documentsWithResults is an empty array", () => {
      const { container } = renderCard([]);
      expect(container).toBeEmptyDOMElement();
    });
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders the Validation Summary heading", () => {
      renderCard([makePassedDocument()]);
      expect(screen.getByText("Validation Summary")).toBeInTheDocument();
    });

    it("renders the Passed label", () => {
      renderCard([makePassedDocument()]);
      expect(screen.getByText("Passed")).toBeInTheDocument();
    });

    it("renders the Failed label", () => {
      renderCard([makePassedDocument()]);
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });

    it("renders the Check icon", () => {
      renderCard([makePassedDocument()]);
      expect(screen.getByTestId("icon-check")).toBeInTheDocument();
    });

    it("renders the X icon", () => {
      renderCard([makePassedDocument()]);
      expect(screen.getByTestId("icon-x")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Pass / fail counts
  // -------------------------------------------------------------------------
  describe("pass and fail counts", () => {
    it("shows 1 passed and 0 failed for a single passing document", () => {
      renderCard([makePassedDocument()]);
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("shows 0 passed and 1 failed for a single failing document", () => {
      renderCard([makeFailedDocument()]);
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("correctly counts multiple passed documents", () => {
      renderCard([
        makePassedDocument("doc-001"),
        makePassedDocument("doc-002"),
        makePassedDocument("doc-003"),
      ]);
      const counts = screen.getAllByText("3");
      // passedCount = 3, failedCount = 0 — only "3" and "0" are rendered
      expect(counts.length).toBe(1);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("correctly counts a mix of passed and failed documents", () => {
      renderCard([
        makePassedDocument("doc-001"),
        makePassedDocument("doc-002"),
        makeFailedDocument("doc-003"),
        makeFailedDocument("doc-004"),
        makeFailedDocument("doc-005"),
      ]);
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("does not count error documents in either passed or failed", () => {
      renderCard([makePassedDocument("doc-001"), makeErrorDocument("doc-002")]);
      // passedCount = 1, failedCount = 0 — error documents are excluded
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("shows 0 passed and 0 failed when all documents have errors", () => {
      renderCard([makeErrorDocument("doc-001"), makeErrorDocument("doc-002")]);
      const zeros = screen.getAllByText("0");
      expect(zeros).toHaveLength(2);
    });

    it("treats a document with an empty missingElements array as passed", () => {
      renderCard([makePassedDocument()]);
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Dark mode
  // -------------------------------------------------------------------------
  describe("dark mode", () => {
    it("applies dark gradient classes to the container when isDarkMode is true", () => {
      const { container } = renderCard([makePassedDocument()], { isDarkMode: true });
      expect(container.firstChild).toHaveClass("from-gray-800/80");
    });

    it("applies light gradient classes to the container when isDarkMode is false", () => {
      const { container } = renderCard([makePassedDocument()], { isDarkMode: false });
      expect(container.firstChild).toHaveClass("from-white/80");
    });

    it("applies dark text class to the heading when isDarkMode is true", () => {
      renderCard([makePassedDocument()], { isDarkMode: true });
      expect(screen.getByText("Validation Summary")).toHaveClass("text-gray-200");
    });

    it("applies light text class to the heading when isDarkMode is false", () => {
      renderCard([makePassedDocument()], { isDarkMode: false });
      expect(screen.getByText("Validation Summary")).toHaveClass("text-gray-800");
    });

    it("applies dark passed count text class when isDarkMode is true", () => {
      renderCard([makePassedDocument()], { isDarkMode: true });
      expect(screen.getByText("1")).toHaveClass("text-emerald-300");
    });

    it("applies light passed count text class when isDarkMode is false", () => {
      renderCard([makePassedDocument()], { isDarkMode: false });
      expect(screen.getByText("1")).toHaveClass("text-emerald-700");
    });

    it("applies dark failed count text class when isDarkMode is true", () => {
      renderCard([makeFailedDocument()], { isDarkMode: true });
      expect(screen.getByText("1")).toHaveClass("text-red-300");
    });

    it("applies light failed count text class when isDarkMode is false", () => {
      renderCard([makeFailedDocument()], { isDarkMode: false });
      expect(screen.getByText("1")).toHaveClass("text-red-700");
    });
  });
});

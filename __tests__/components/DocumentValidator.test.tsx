/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentValidator from "../../components/DocumentValidator";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Analytics: the hook returns an object of methods the component calls.
// (Mock the hook boundary rather than the class — simpler and matches usage.)
const analyticsMock = {
  logEvent: vi.fn(),
  logValidation: vi.fn().mockResolvedValue(undefined),
  startValidation: vi.fn(),
  getSessionId: vi.fn().mockReturnValue("test-session-id"),
};
vi.mock("../../hooks/useAnalytics", () => ({
  useAnalytics: () => analyticsMock,
}));

vi.mock("../../hooks/useUserId", () => ({
  useUserId: () => "test-user-id",
}));

// Deterministic ids so assertions are stable.
let uuidCounter = 0;
vi.mock("uuid", () => ({
  v4: () => `test-uuid-${++uuidCounter}`,
}));

vi.mock("react-hot-toast", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Auto-detection is a pure util; stub it to a known value.
vi.mock("../../utils/documentTypeDetector", () => ({
  detectDocumentType: (fileName: string) => ({
    autoSelectedType: fileName.includes("tax") ? "tax-clearance-online" : "",
    detectedCategory: fileName.includes("tax") ? "tax" : undefined,
  }),
}));

// Replace child components with lightweight stubs that expose just enough
// to drive the parent's logic. This isolates DocumentValidator under test.
vi.mock("../../components/Header", () => ({
  default: ({ toggleTheme, onRefresh }) => (
    <div>
      <button onClick={toggleTheme}>toggle-theme</button>
      <button onClick={onRefresh}>refresh</button>
    </div>
  ),
}));
vi.mock("../../components/FormFields", () => ({
  default: ({ handleInputChange, fieldErrors }) => (
    <div>
      <input aria-label="organizationName" name="organizationName" onChange={handleInputChange} />
      <input aria-label="fein" name="fein" onChange={handleInputChange} />
      {fieldErrors.organizationName && <span>{fieldErrors.organizationName}</span>}
      {fieldErrors.fein && <span>{fieldErrors.fein}</span>}
    </div>
  ),
}));
vi.mock("../../components/FileUploadArea", () => ({
  default: ({ documents, handleFileChange, handleDocumentTypeChange, removeDocument }) => (
    <div>
      <input aria-label="file-input" type="file" onChange={handleFileChange} />
      <div data-testid="doc-count">{documents.length}</div>
      {documents.map((d) => (
        <div key={d.id} data-testid={`doc-${d.id}`}>
          <span>{d.file.name}</span>
          <span data-testid={`type-${d.id}`}>{d.type}</span>
          <button onClick={() => handleDocumentTypeChange(d.id, "cert-formation")}>
            set-type-{d.id}
          </button>
          <button onClick={() => removeDocument(d.id)}>remove-{d.id}</button>
        </div>
      ))}
    </div>
  ),
}));
vi.mock("../../components/ValidationButton", () => ({
  default: ({ validateDocument, isUploading }) => (
    <button onClick={validateDocument} disabled={isUploading}>
      {isUploading ? "validating" : "validate"}
    </button>
  ),
}));
vi.mock("../../components/ErrorMessage", () => ({
  default: ({ error }) => (error ? <div role="alert">{error}</div> : null),
}));
vi.mock("../../components/ValidationResults", () => ({
  default: ({ documents }) => (
    <div data-testid="results-count">{documents.filter((d) => d.result !== null).length}</div>
  ),
}));
vi.mock("../../components/ContactForm", () => ({
  ContactForm: () => <div data-testid="contact-form" />,
}));
vi.mock("../../components/EmailPreviewModal", () => ({ default: () => null }));
vi.mock("../../components/DocumentPreviewModal", () => ({ default: () => null }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name: string, { type = "application/pdf", size = 1024 } = {}): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function uploadFiles(files: File[]) {
  const input = screen.getByLabelText("file-input") as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
}

// ---------------------------------------------------------------------------
// Global environment mocks (matchMedia, localStorage, fetch, FileReader)
// ---------------------------------------------------------------------------

beforeEach(() => {
  uuidCounter = 0;
  vi.clearAllMocks();

  // matchMedia — jsdom doesn't implement it.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });

  // localStorage
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  });

  // FileReader — resolve base64 synchronously-ish for fileToBase64.
  class MockFileReader {
    result: string | null = null;
    error: unknown = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readAsDataURL() {
      this.result = "data:application/pdf;base64,ZmFrZQ==";
      queueMicrotask(() => this.onload && this.onload());
    }
  }
  vi.stubGlobal("FileReader", MockFileReader);

  // fetch — default happy path; override per-test as needed.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ documentInfo: {}, suggestedActions: [] }),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ===========================================================================
// Smoke / render
// ===========================================================================

describe("DocumentValidator — rendering", () => {
  it("renders without crashing", () => {
    render(<DocumentValidator />);
    expect(screen.getByText("validate")).toBeInTheDocument();
  });

  it("starts with no documents and no results", () => {
    render(<DocumentValidator />);
    expect(screen.getByTestId("doc-count")).toHaveTextContent("0");
    expect(screen.getByTestId("results-count")).toHaveTextContent("0");
  });

  it("reads saved theme from localStorage on mount", () => {
    localStorage.setItem("theme", "dark");
    render(<DocumentValidator />);
    // Effect writes the resolved theme back; assert it persisted as dark.
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("does not show the contact form before validation has run", () => {
    render(<DocumentValidator />);
    expect(screen.queryByTestId("contact-form")).not.toBeInTheDocument();
  });
});

// ===========================================================================
// File upload + validation of file types/sizes
// ===========================================================================

describe("DocumentValidator — file upload", () => {
  it("adds an uploaded file to the document list", () => {
    render(<DocumentValidator />);
    uploadFiles([makeFile("report.pdf")]);
    expect(screen.getByTestId("doc-count")).toHaveTextContent("1");
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("auto-detects document type from filename", () => {
    render(<DocumentValidator />);
    uploadFiles([makeFile("tax-clearance.pdf")]);
    expect(screen.getByTestId("type-test-uuid-1")).toHaveTextContent("tax-clearance-online");
  });

  it("logs an analytics event when a type is auto-detected", () => {
    render(<DocumentValidator />);
    uploadFiles([makeFile("tax-clearance.pdf")]);
    expect(analyticsMock.logEvent).toHaveBeenCalledWith(
      "document_type_auto_detected",
      expect.objectContaining({ detectedType: "tax-clearance-online" }),
    );
  });

  it("rejects an invalid file type", () => {
    render(<DocumentValidator />);
    uploadFiles([makeFile("malware.exe", { type: "application/octet-stream" })]);
    expect(screen.getByRole("alert")).toHaveTextContent(/valid file types/i);
    expect(screen.getByTestId("doc-count")).toHaveTextContent("0");
  });

  it("rejects a file over the 23 MB size limit", () => {
    render(<DocumentValidator />);
    uploadFiles([makeFile("huge.pdf", { size: 24 * 1024 * 1024 })]);
    expect(screen.getByRole("alert")).toHaveTextContent(/23 MB/i);
    expect(screen.getByTestId("doc-count")).toHaveTextContent("0");
  });

  it("removes a document when removeDocument is called", async () => {
    const user = userEvent.setup();
    render(<DocumentValidator />);
    uploadFiles([makeFile("report.pdf")]);
    await user.click(screen.getByText("remove-test-uuid-1"));
    expect(screen.getByTestId("doc-count")).toHaveTextContent("0");
  });

  it("changes a document type", async () => {
    const user = userEvent.setup();
    render(<DocumentValidator />);
    uploadFiles([makeFile("report.pdf")]);
    await user.click(screen.getByText("set-type-test-uuid-1"));
    expect(screen.getByTestId("type-test-uuid-1")).toHaveTextContent("cert-formation");
  });
});

// ===========================================================================
// Required fields
// ===========================================================================

describe("DocumentValidator — required fields", () => {
  it("surfaces org-name + FEIN fields when a tax clearance doc is present", async () => {
    render(<DocumentValidator />);
    uploadFiles([makeFile("tax-clearance.pdf")]);
    await waitFor(() => {
      expect(screen.getByLabelText("organizationName")).toBeInTheDocument();
      expect(screen.getByLabelText("fein")).toBeInTheDocument();
    });
  });

  it("blocks validation and shows field errors when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<DocumentValidator />);
    uploadFiles([makeFile("tax-clearance.pdf")]);
    await user.click(screen.getByText("validate"));
    expect(screen.getByRole("alert")).toHaveTextContent(/required fields/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Validation flow
// ===========================================================================

describe("DocumentValidator — validation", () => {
  // helper
  async function fillOrgName(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("organizationName"), "Acme Inc");
  }

  it("blocks validation with no documents", async () => {
    const user = userEvent.setup();
    render(<DocumentValidator />);
    await user.click(screen.getByText("validate"));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least one document/i);
  });

  it("blocks validation when a document has no type selected", async () => {
    const user = userEvent.setup();
    render(<DocumentValidator />);
    uploadFiles([makeFile("unknown.pdf")]); // detector returns empty type
    await user.click(screen.getByText("validate"));
    expect(screen.getByRole("alert")).toHaveTextContent(/select a document type/i);
  });

  it("validates a typed document and records the result", async () => {
    const user = userEvent.setup();
    render(<DocumentValidator />);
    uploadFiles([makeFile("unknown.pdf")]);
    await user.click(screen.getByText("set-type-test-uuid-1")); // gives it a type
    await fillOrgName(user);
    await user.click(screen.getByText("validate"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/validate-document"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(screen.getByTestId("results-count")).toHaveTextContent("1");
    });
  });

  it("shows the contact form after a validation run", async () => {
    const user = userEvent.setup();
    render(<DocumentValidator />);
    uploadFiles([makeFile("unknown.pdf")]);
    await user.click(screen.getByText("set-type-test-uuid-1"));
    await fillOrgName(user);
    await user.click(screen.getByText("validate"));
    await waitFor(() => {
      expect(screen.getByTestId("contact-form")).toBeInTheDocument();
    });
  });

  it("shows a toast when the API returns an error status", async () => {
    const { toast } = await import("react-hot-toast");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({ error: "Bad document" }),
      }),
    );
    const user = userEvent.setup();
    render(<DocumentValidator />);
    uploadFiles([makeFile("unknown.pdf")]);
    await user.click(screen.getByText("set-type-test-uuid-1"));
    await fillOrgName(user);
    await user.click(screen.getByText("validate"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Bad document"),
        expect.anything(),
      );
    });
  });

  it("shows a toast when fetch rejects (network error)", async () => {
    const { toast } = await import("react-hot-toast");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network down")));
    const user = userEvent.setup();
    render(<DocumentValidator />);
    uploadFiles([makeFile("unknown.pdf")]);
    await user.click(screen.getByText("set-type-test-uuid-1"));
    await fillOrgName(user);
    await user.click(screen.getByText("validate"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Network down"),
        expect.anything(),
      );
    });
  });

  it("calls analytics.logValidation on a completed run", async () => {
    const user = userEvent.setup();
    render(<DocumentValidator />);
    uploadFiles([makeFile("unknown.pdf")]);
    await user.click(screen.getByText("set-type-test-uuid-1"));
    await fillOrgName(user);
    await user.click(screen.getByText("validate"));
    await waitFor(() => {
      expect(analyticsMock.startValidation).toHaveBeenCalled();
      expect(analyticsMock.logValidation).toHaveBeenCalled();
    });
  });
});

// ===========================================================================
// Theme
// ===========================================================================

describe("DocumentValidator — theme", () => {
  it("persists a theme toggle to localStorage", async () => {
    const user = userEvent.setup();
    render(<DocumentValidator />);
    // default resolves to light (matchMedia matches:false)
    await waitFor(() => expect(localStorage.getItem("theme")).toBe("light"));
    await user.click(screen.getByText("toggle-theme"));
    await waitFor(() => expect(localStorage.getItem("theme")).toBe("dark"));
  });
});

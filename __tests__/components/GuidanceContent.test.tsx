import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GuidanceContent from "../../components/GuidanceContent";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    ExternalLink: () => <svg data-testid="icon-external-link" />,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  isDarkMode: false,
  onViewSample: vi.fn(),
};

function renderGuidance(overrides = {}) {
  return render(<GuidanceContent {...defaultProps} {...overrides} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GuidanceContent", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Headings and intro text
  // -------------------------------------------------------------------------
  describe("headings and intro text", () => {
    it("renders the main heading", () => {
      renderGuidance();
      expect(screen.getByText("How to Select the Right Document?")).toBeInTheDocument();
    });

    it("renders the introductory paragraph", () => {
      renderGuidance();
      expect(screen.getByText(/Selecting the correct document type/i)).toBeInTheDocument();
    });

    it("renders the Entity Verification Forms table heading", () => {
      renderGuidance();
      const headings = screen.getAllByRole("heading", { level: 4 });
      const entityHeading = headings.find((h) =>
        h.textContent?.includes("Entity Verification Forms"),
      );
      expect(entityHeading).toBeInTheDocument();
    });

    it("renders the Additional Documents table heading", () => {
      renderGuidance();
      expect(screen.getByText("Additional Documents")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Guidance bullet points
  // -------------------------------------------------------------------------
  describe("guidance bullet points", () => {
    it("renders the Determine Requirements bullet", () => {
      renderGuidance();
      expect(screen.getByText(/Determine Requirements by Entity/i)).toBeInTheDocument();
    });

    it("renders the Required Documents bullet", () => {
      renderGuidance();
      // Target the <strong> label specifically to avoid matching the
      // "Required Verification Documents" column header or bullet prose.
      expect(screen.getByText("Required Documents:")).toBeInTheDocument();
    });

    it("renders the Verify Submissions bullet", () => {
      renderGuidance();
      expect(screen.getByText(/Verify Submissions/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Entity Verification Forms table — content
  // -------------------------------------------------------------------------
  describe("entity verification forms table", () => {
    it("renders the Entity Type column header", () => {
      renderGuidance();
      expect(screen.getByText("Entity Type")).toBeInTheDocument();
    });

    it("renders the Required Verification Documents column header", () => {
      renderGuidance();
      expect(screen.getByText("Required Verification Documents")).toBeInTheDocument();
    });

    it("renders the Sole Proprietor row", () => {
      renderGuidance();
      expect(screen.getByText("Sole Proprietor")).toBeInTheDocument();
    });

    it("renders the LLC & Partnerships row", () => {
      renderGuidance();
      expect(screen.getByText("LLC & Partnerships")).toBeInTheDocument();
    });

    it("renders the S & C Corporation row", () => {
      renderGuidance();
      expect(screen.getByText("S & C Corporation")).toBeInTheDocument();
    });

    it("renders the Not-for-profit row", () => {
      renderGuidance();
      expect(screen.getByText("Not-for-profit")).toBeInTheDocument();
    });

    it("renders Certificate of Trade Name in the Sole Proprietor row", () => {
      renderGuidance();
      expect(screen.getByText(/Certificate of Trade Name/i)).toBeInTheDocument();
    });

    it("renders Certificate of Formation in the LLC row", () => {
      renderGuidance();
      expect(screen.getAllByText(/Certificate of Formation/i).length).toBeGreaterThan(0);
    });

    it("renders Operating Agreement in the LLC row", () => {
      renderGuidance();
      expect(screen.getByText(/Operating Agreement/i)).toBeInTheDocument();
    });

    it("renders Certificate of Incorporation in the S & C Corporation row", () => {
      renderGuidance();
      expect(screen.getAllByText(/Certificate of Incorporation/i).length).toBeGreaterThan(0);
    });

    it("renders IRS Determination Letter in the Not-for-profit row", () => {
      renderGuidance();
      expect(screen.getByText(/IRS Determination Letter/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Additional Documents table — content
  // -------------------------------------------------------------------------
  describe("additional documents table", () => {
    it("renders the Document Category column header", () => {
      renderGuidance();
      expect(screen.getByText("Document Category")).toBeInTheDocument();
    });

    it("renders the Document Type column header", () => {
      renderGuidance();
      expect(screen.getByText("Document Type")).toBeInTheDocument();
    });

    it("renders the NJ Division of Taxation row", () => {
      renderGuidance();
      expect(screen.getByText("NJ Division of Taxation Verification")).toBeInTheDocument();
    });

    it("renders Tax Clearance Certificate (Online Generated)", () => {
      renderGuidance();
      expect(
        screen.getByText(/Tax Clearance Certificate \(Online Generated\)/i),
      ).toBeInTheDocument();
    });

    it("renders Tax Clearance Certificate (Manually Generated)", () => {
      renderGuidance();
      expect(
        screen.getByText(/Tax Clearance Certificate \(Manually Generated\)/i),
      ).toBeInTheDocument();
    });

    it("renders the NJ Division of Revenue and Enterprise Services row", () => {
      renderGuidance();
      expect(
        screen.getByText("NJ Division of Revenue and Enterprise Services"),
      ).toBeInTheDocument();
    });

    it("renders Certificate of Alternative Name", () => {
      renderGuidance();
      // The text appears in both the list item and the explanatory paragraph;
      // use getAllByText and confirm at least one match exists.
      expect(screen.getAllByText(/Certificate of Alternative Name/i).length).toBeGreaterThan(0);
    });

    it("renders Certificate of Authority V1", () => {
      renderGuidance();
      expect(screen.getByText(/Certificate of Authority V1/i)).toBeInTheDocument();
    });

    it("renders Certificate of Authority V2", () => {
      renderGuidance();
      expect(screen.getByText(/Certificate of Authority V2/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // View Sample buttons — rendering
  // -------------------------------------------------------------------------
  describe("View Sample buttons — rendering", () => {
    it("renders multiple View Sample buttons", () => {
      renderGuidance();
      const buttons = screen.getAllByRole("button", { name: /view sample/i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("renders an ExternalLink icon in each View Sample button", () => {
      renderGuidance();
      const icons = screen.getAllByTestId("icon-external-link");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // View Sample buttons — interactions
  // -------------------------------------------------------------------------
  describe("View Sample buttons — interactions", () => {
    it("calls onViewSample with cert-trade-name when clicking Certificate of Trade Name sample", async () => {
      const onViewSample = vi.fn();
      renderGuidance({ onViewSample });
      const buttons = screen.getAllByRole("button", { name: /view sample/i });
      // Certificate of Trade Name is the first View Sample button
      await userEvent.click(buttons[0]);
      expect(onViewSample).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "cert-trade-name",
          label: "Certificate of Trade Name",
          samplePath: "/sample-documents/cert-trade-name.pdf",
        }),
      );
    });

    it("calls onViewSample with the correct samplePath for each document type", async () => {
      const onViewSample = vi.fn();
      renderGuidance({ onViewSample });
      const buttons = screen.getAllByRole("button", { name: /view sample/i });
      // Click every View Sample button and verify onViewSample is always called
      // with a non-empty samplePath
      for (const button of buttons) {
        await userEvent.click(button);
      }
      for (const [arg] of onViewSample.mock.calls) {
        expect(arg.samplePath).toMatch(/^\/sample-documents\/.+\.pdf$/);
      }
    });

    it("calls onViewSample once per button click", async () => {
      const onViewSample = vi.fn();
      renderGuidance({ onViewSample });
      const buttons = screen.getAllByRole("button", { name: /view sample/i });
      await userEvent.click(buttons[0]);
      expect(onViewSample).toHaveBeenCalledTimes(1);
    });

    it("calls onViewSample with cert-formation when clicking Certificate of Formation sample", async () => {
      const onViewSample = vi.fn();
      renderGuidance({ onViewSample });
      const buttons = screen.getAllByRole("button", { name: /view sample/i });
      // cert-formation is the second View Sample button (after cert-trade-name)
      await userEvent.click(buttons[1]);
      expect(onViewSample).toHaveBeenCalledWith(
        expect.objectContaining({ type: "cert-formation" }),
      );
    });

    it("calls onViewSample with tax-clearance-online when clicking the online tax clearance sample", async () => {
      const onViewSample = vi.fn();
      renderGuidance({ onViewSample });
      const buttons = screen.getAllByRole("button", { name: /view sample/i });
      const onlineButton = buttons.find((btn) => {
        const li = btn.closest("li");
        return li?.textContent?.includes("Online Generated");
      });
      expect(onlineButton).toBeDefined();
      await userEvent.click(onlineButton as HTMLElement);
      expect(onViewSample).toHaveBeenCalledWith(
        expect.objectContaining({ type: "tax-clearance-online" }),
      );
    });

    it("calls onViewSample with tax-clearance-manual when clicking the manual tax clearance sample", async () => {
      const onViewSample = vi.fn();
      renderGuidance({ onViewSample });
      const buttons = screen.getAllByRole("button", { name: /view sample/i });
      const manualButton = buttons.find((btn) => {
        const li = btn.closest("li");
        return li?.textContent?.includes("Manually Generated");
      });
      expect(manualButton).toBeDefined();
      await userEvent.click(manualButton as HTMLElement);
      expect(onViewSample).toHaveBeenCalledWith(
        expect.objectContaining({ type: "tax-clearance-manual" }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Dark mode
  // -------------------------------------------------------------------------
  describe("dark mode", () => {
    it("applies dark text class to the main heading when isDarkMode is true", () => {
      renderGuidance({ isDarkMode: true });
      const heading = screen.getByText("How to Select the Right Document?");
      expect(heading).toHaveClass("text-gray-100");
    });

    it("applies light text class to the main heading when isDarkMode is false", () => {
      renderGuidance({ isDarkMode: false });
      const heading = screen.getByText("How to Select the Right Document?");
      expect(heading).toHaveClass("text-gray-900");
    });

    it("applies dark header background to the entity table when isDarkMode is true", () => {
      renderGuidance({ isDarkMode: true });
      const tableHeaders = document.querySelectorAll("thead");
      expect(tableHeaders[0]).toHaveClass("bg-gray-800");
    });

    it("applies light header background to the entity table when isDarkMode is false", () => {
      renderGuidance({ isDarkMode: false });
      const tableHeaders = document.querySelectorAll("thead");
      expect(tableHeaders[0]).toHaveClass("bg-gray-100");
    });
  });
});

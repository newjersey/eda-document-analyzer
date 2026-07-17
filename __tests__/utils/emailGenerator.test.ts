import { extractProjectNumber, generateEmailForAllDocuments } from "../../utils/emailGenerator";

// ---------------------------------------------------------------------------
// Mock convertToApplicantMessages so tests are isolated from messageMappings
// ---------------------------------------------------------------------------

const { mockConvertToApplicantMessages } = vi.hoisted(() => {
  const mockConvertToApplicantMessages = vi.fn();
  return { mockConvertToApplicantMessages };
});

vi.mock("../../utils/messageMappings", () => ({
  convertToApplicantMessages: mockConvertToApplicantMessages,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFailedDocument(overrides = {}) {
  return {
    type: "tax-clearance-online",
    result: {
      success: false,
      missingElements: ["Valid Tax Clearance Required"],
    },
    ...overrides,
  };
}

function makePassedDocument(overrides = {}) {
  return {
    type: "cert-formation",
    result: {
      success: true,
      missingElements: [],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("emailGenerator", () => {
  beforeEach(() => {
    // Default: return the missingElements unchanged as applicant messages
    mockConvertToApplicantMessages.mockImplementation(
      (missingElements: string[]) => missingElements,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // generateEmailForAllDocuments()
  // -------------------------------------------------------------------------
  describe("generateEmailForAllDocuments()", () => {
    // -----------------------------------------------------------------------
    // Null / empty cases
    // -----------------------------------------------------------------------
    describe("null and empty cases", () => {
      it("returns null when given an empty documents array", () => {
        expect(generateEmailForAllDocuments([])).toBeNull();
      });

      it("returns null when all documents passed", () => {
        const docs = [makePassedDocument()];
        expect(generateEmailForAllDocuments(docs)).toBeNull();
      });

      it("returns null when no document has missingElements", () => {
        const docs = [makeFailedDocument({ result: { success: false, missingElements: [] } })];
        expect(generateEmailForAllDocuments(docs)).toBeNull();
      });

      it("returns null when result is undefined", () => {
        const docs = [{ type: "tax-clearance-online", result: undefined }];
        expect(generateEmailForAllDocuments(docs)).toBeNull();
      });

      it("returns null when all applicant messages are filtered out (internal-only)", () => {
        mockConvertToApplicantMessages.mockReturnValue([]);
        const docs = [makeFailedDocument()];
        expect(generateEmailForAllDocuments(docs)).toBeNull();
      });
    });

    // -----------------------------------------------------------------------
    // Email structure
    // -----------------------------------------------------------------------
    describe("email structure", () => {
      it("returns a non-null string when there is at least one failed document", () => {
        const docs = [makeFailedDocument()];
        expect(generateEmailForAllDocuments(docs)).not.toBeNull();
        expect(typeof generateEmailForAllDocuments(docs)).toBe("string");
      });

      it("includes the email subject line", () => {
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("Email Subject Line:");
      });

      it("includes the salutation", () => {
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("Dear [Applicant]");
      });

      it("includes the closing sign-off", () => {
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("Thank you,");
      });

      it("does not contain the [DOCUMENT_ISSUES] placeholder in the output", () => {
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs);
        expect(email).not.toContain("[DOCUMENT_ISSUES]");
      });
    });

    // -----------------------------------------------------------------------
    // Document issues content
    // -----------------------------------------------------------------------
    describe("document issues content", () => {
      it("includes the friendly document type name in the output", () => {
        const docs = [makeFailedDocument({ type: "tax-clearance-online" })];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("Tax Clearance Certificate (Online Generated)");
      });

      it("includes the applicant-facing message in the output", () => {
        mockConvertToApplicantMessages.mockReturnValue(["Valid Tax Clearance Required"]);
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("Valid Tax Clearance Required");
      });

      it("formats each message with a bullet prefix", () => {
        mockConvertToApplicantMessages.mockReturnValue(["Valid Tax Clearance Required"]);
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("• Tax Clearance Certificate (Online Generated):");
      });

      it("formats each issue with a dash prefix", () => {
        mockConvertToApplicantMessages.mockReturnValue(["Valid Tax Clearance Required"]);
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("  - Valid Tax Clearance Required");
      });

      it("includes issues from multiple failed documents", () => {
        mockConvertToApplicantMessages
          .mockReturnValueOnce(["Valid Tax Clearance Required"])
          .mockReturnValueOnce(["Valid Certificate of Formation Required"]);

        const docs = [
          makeFailedDocument({ type: "tax-clearance-online" }),
          makeFailedDocument({
            type: "cert-formation",
            result: {
              success: false,
              missingElements: ["Valid Certificate of Formation Required"],
            },
          }),
        ];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("Tax Clearance Certificate (Online Generated)");
        expect(email).toContain("Certificate of Formation");
      });

      it("skips passed documents when mixed with failed ones", () => {
        mockConvertToApplicantMessages.mockReturnValue(["Valid Tax Clearance Required"]);
        const docs = [makePassedDocument(), makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("Tax Clearance Certificate (Online Generated)");
        expect(email).not.toContain("Certificate of Formation:");
      });

      it("uses the raw document type as fallback when type is not in DOCUMENT_TYPE_NAMES", () => {
        const docs = [makeFailedDocument({ type: "unknown-doc-type" })];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("unknown-doc-type");
      });

      it("calls convertToApplicantMessages with the correct document type", () => {
        const docs = [makeFailedDocument({ type: "bylaws" })];
        generateEmailForAllDocuments(docs);
        expect(mockConvertToApplicantMessages).toHaveBeenCalledWith(expect.any(Array), "bylaws");
      });
    });

    // -----------------------------------------------------------------------
    // Project number substitution
    // -----------------------------------------------------------------------
    describe("project number substitution", () => {
      it("replaces XXXXXX with the provided project number", () => {
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs, "00187261");
        expect(email).toContain("00187261");
      });

      it("does not include raw XXXXXX placeholder when project number is provided", () => {
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs, "00187261");
        expect(email).not.toContain("XXXXXX");
      });

      it("leaves XXXXXX placeholder intact when no project number is provided", () => {
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs);
        expect(email).toContain("XXXXXX");
      });

      it("leaves XXXXXX placeholder intact when project number is null", () => {
        const docs = [makeFailedDocument()];
        const email = generateEmailForAllDocuments(docs, null);
        expect(email).toContain("XXXXXX");
      });
    });
  });

  // -------------------------------------------------------------------------
  // extractProjectNumber()
  // -------------------------------------------------------------------------
  describe("extractProjectNumber()", () => {
    it("returns the project number from the first document that has one", () => {
      const docs = [
        { type: "cert-formation", projectNumber: "00187261" },
        { type: "bylaws", projectNumber: "99999999" },
      ];
      expect(extractProjectNumber(docs)).toBe("00187261");
    });

    it("skips documents without a projectNumber and returns the first match", () => {
      const docs = [{ type: "cert-formation" }, { type: "bylaws", projectNumber: "00187261" }];
      expect(extractProjectNumber(docs)).toBe("00187261");
    });

    it("returns null when no document has a projectNumber", () => {
      const docs = [{ type: "cert-formation" }, { type: "bylaws" }];
      expect(extractProjectNumber(docs)).toBeNull();
    });

    it("returns null for an empty array", () => {
      expect(extractProjectNumber([])).toBeNull();
    });

    it("returns the project number when only one document exists", () => {
      const docs = [{ type: "bylaws", projectNumber: "12345678" }];
      expect(extractProjectNumber(docs)).toBe("12345678");
    });
  });
});

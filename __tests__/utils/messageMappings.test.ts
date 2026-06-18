import {
  applicantFacingMessages,
  convertToApplicantMessages,
  getApplicantFacingMessage,
  shouldShowToApplicant,
} from "../../utils/messageMappings";

// ---------------------------------------------------------------------------
// getApplicantFacingMessage()
// ---------------------------------------------------------------------------
describe("getApplicantFacingMessage", () => {
  // -------------------------------------------------------------------------
  // Internal-only messages
  // -------------------------------------------------------------------------
  describe("internal-only messages", () => {
    it("returns null for 'Unknown document type'", () => {
      expect(getApplicantFacingMessage("Unknown document type", "tax-clearance-online")).toBeNull();
    });

    it("returns null for 'Processing timeout'", () => {
      expect(getApplicantFacingMessage("Processing timeout", "tax-clearance-online")).toBeNull();
    });

    it("returns null for 'No file provided'", () => {
      expect(getApplicantFacingMessage("No file provided", "cert-formation")).toBeNull();
    });

    it("returns null for 'Failed to validate document'", () => {
      expect(getApplicantFacingMessage("Failed to validate document", "bylaws")).toBeNull();
    });

    it("returns null for 'Server configuration error: Missing Document Intelligence credentials'", () => {
      expect(
        getApplicantFacingMessage(
          "Server configuration error: Missing Document Intelligence credentials",
          "irs-determination",
        ),
      ).toBeNull();
    });

    it("returns null for 'Invalid base64 file data'", () => {
      expect(
        getApplicantFacingMessage("Invalid base64 file data", "operating-agreement"),
      ).toBeNull();
    });

    it("returns null for 'Expected JSON request body'", () => {
      expect(getApplicantFacingMessage("Expected JSON request body", "cert-authority")).toBeNull();
    });

    it("returns null regardless of the document type passed", () => {
      expect(getApplicantFacingMessage("No file provided", "unknown-type")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Document-specific mappings
  // -------------------------------------------------------------------------
  describe("document-specific mappings", () => {
    it("maps a tax-clearance-online message to the applicant-facing version", () => {
      expect(
        getApplicantFacingMessage(
          "Required keyword: 'Clearance Certificate'",
          "tax-clearance-online",
        ),
      ).toBe("Valid Tax Clearance Required");
    });

    it("maps the FEIN mismatch message for tax-clearance-online", () => {
      expect(
        getApplicantFacingMessage(
          "FEIN last three digits don't match the Applicant ID on the certificate",
          "tax-clearance-online",
        ),
      ).toBe(
        "Tax clearance number and Federal Employer Identification Number (FEIN) number do not match.",
      );
    });

    it("maps the expiry message for tax-clearance-online", () => {
      expect(
        getApplicantFacingMessage(
          "Certificate must be dated within the past six months",
          "tax-clearance-online",
        ),
      ).toBe("Tax clearance certificate must be valid for 180 days");
    });

    it("maps a tax-clearance-manual message correctly", () => {
      expect(
        getApplicantFacingMessage("Required keyword: 'BATC - Manual'", "tax-clearance-manual"),
      ).toBe("Valid Tax Clearance Required");
    });

    it("maps a cert-alternative-name message correctly", () => {
      expect(
        getApplicantFacingMessage(
          "Required keyword: 'Certificate of Alternate Name'",
          "cert-alternative-name",
        ),
      ).toBe("Valid Certificate of Alternative Name Required");
    });

    it("maps a cert-formation message correctly", () => {
      expect(
        getApplicantFacingMessage(
          "Certificate is not issued by the NJ Department of the Treasury",
          "cert-formation",
        ),
      ).toBe("Valid Certificate of Formation Required");
    });

    it("maps a cert-formation-independent FEIN mismatch message", () => {
      expect(
        getApplicantFacingMessage(
          "FEIN (Federal Employer Identification Number) doesn't match the one on the certificate",
          "cert-formation-independent",
        ),
      ).toBe(
        "FEIN (Federal Employer Identification Number) doesn't match the one on the certificate.",
      );
    });

    it("maps an operating-agreement message correctly", () => {
      expect(
        getApplicantFacingMessage("Member signatures are missing", "operating-agreement"),
      ).toBe("Member signatures are missing.");
    });

    it("maps a cert-incorporation message correctly", () => {
      expect(
        getApplicantFacingMessage(
          "Required text: 'Certificate of Incorporation'",
          "cert-incorporation",
        ),
      ).toBe(
        "Valid Certificate of Incorporation Required: Required text: 'Certificate of Incorporation'",
      );
    });

    it("maps an irs-determination message correctly", () => {
      expect(getApplicantFacingMessage("IRS letterhead is missing", "irs-determination")).toBe(
        "Valid IRS Determination Letter Required",
      );
    });

    it("maps a bylaws message correctly", () => {
      expect(getApplicantFacingMessage("Required keyword: 'Bylaws'", "bylaws")).toBe(
        "Valid bylaws required: Required keyword: 'Bylaws' missing from document",
      );
    });

    it("maps a cert-authority message correctly", () => {
      expect(
        getApplicantFacingMessage("Required keyword: 'Certificate of Authority'", "cert-authority"),
      ).toBe("Valid Certficate of Authority Required");
    });
  });

  // -------------------------------------------------------------------------
  // Organisation name — shared across document types
  // -------------------------------------------------------------------------
  describe("organisation name mismatch message", () => {
    const orgMessage = "Organization name doesn't match the one on the certificate";
    const expectedResponse = "Organization name doesn't match the one on the certificate.";
    const docTypes = [
      "tax-clearance-online",
      "tax-clearance-manual",
      "cert-alternative-name",
      "cert-formation",
      "cert-formation-independent",
      "cert-authority",
    ];

    for (const docType of docTypes) {
      it(`maps organisation name mismatch correctly for ${docType}`, () => {
        expect(getApplicantFacingMessage(orgMessage, docType)).toBe(expectedResponse);
      });
    }
  });

  // -------------------------------------------------------------------------
  // Fallback behaviour
  // -------------------------------------------------------------------------
  describe("fallback behaviour", () => {
    it("returns the original message when no mapping exists for the document type", () => {
      const msg = "Some unmapped validation message";
      expect(getApplicantFacingMessage(msg, "tax-clearance-online")).toBe(msg);
    });

    it("returns the original message when the document type is unknown", () => {
      const msg = "Some validation message";
      expect(getApplicantFacingMessage(msg, "unknown-type")).toBe(msg);
    });

    it("returns the original message when document type is an empty string", () => {
      const msg = "Some validation message";
      expect(getApplicantFacingMessage(msg, "")).toBe(msg);
    });

    it("does not return a message from a different document type when the current type has no mapping", () => {
      // "Required keyword: 'Bylaws'" is only mapped for bylaws, not cert-formation
      expect(getApplicantFacingMessage("Required keyword: 'Bylaws'", "cert-formation")).toBe(
        "Required keyword: 'Bylaws'",
      );
    });
  });
});

// ---------------------------------------------------------------------------
// shouldShowToApplicant()
// ---------------------------------------------------------------------------

describe("shouldShowToApplicant", () => {
  it("returns false for every internal-only message", () => {
    for (const msg of Object.keys(applicantFacingMessages["internal-only"])) {
      expect(shouldShowToApplicant(msg)).toBe(false);
    }
  });

  it("returns true for a document-specific validation message", () => {
    expect(shouldShowToApplicant("Required keyword: 'Clearance Certificate'")).toBe(true);
  });

  it("returns true for an unknown message", () => {
    expect(shouldShowToApplicant("Some completely unknown message")).toBe(true);
  });

  it("returns true for an empty string", () => {
    expect(shouldShowToApplicant("")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// convertToApplicantMessages()
// ---------------------------------------------------------------------------

describe("convertToApplicantMessages", () => {
  // -------------------------------------------------------------------------
  // Filtering internal-only messages
  // -------------------------------------------------------------------------
  describe("filtering internal-only messages", () => {
    it("filters out internal-only messages", () => {
      const messages = ["Unknown document type", "Required keyword: 'Clearance Certificate'"];
      const result = convertToApplicantMessages(messages, "tax-clearance-online");
      expect(result).not.toContain(null);
      expect(result).toHaveLength(1);
    });

    it("returns an empty array when all messages are internal-only", () => {
      const messages = ["Unknown document type", "No file provided", "Processing timeout"];
      const result = convertToApplicantMessages(messages, "tax-clearance-online");
      expect(result).toEqual([]);
    });

    it("returns an empty array for an empty input", () => {
      expect(convertToApplicantMessages([], "tax-clearance-online")).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Message mapping
  // -------------------------------------------------------------------------
  describe("message mapping", () => {
    it("converts internal messages to applicant-facing versions", () => {
      const messages = ["Required keyword: 'Clearance Certificate'"];
      const result = convertToApplicantMessages(messages, "tax-clearance-online");
      expect(result).toEqual(["Valid Tax Clearance Required"]);
    });

    it("maps multiple messages for the same document type", () => {
      const messages = [
        "Required keyword: 'Clearance Certificate'",
        "Certificate must be dated within the past six months",
      ];
      const result = convertToApplicantMessages(messages, "tax-clearance-online");
      expect(result).toContain("Valid Tax Clearance Required");
      expect(result).toContain("Tax clearance certificate must be valid for 180 days");
    });

    it("falls back to the original message when no mapping exists", () => {
      const messages = ["An unmapped message"];
      const result = convertToApplicantMessages(messages, "tax-clearance-online");
      expect(result).toEqual(["An unmapped message"]);
    });
  });

  // -------------------------------------------------------------------------
  // Deduplication
  // -------------------------------------------------------------------------
  describe("deduplication", () => {
    it("deduplicates messages that map to the same applicant-facing string", () => {
      // Multiple internal messages map to "Valid Tax Clearance Required"
      const messages = [
        "Required keyword: 'Clearance Certificate'",
        "Required keyword: 'State of New Jersey'",
        "Required keyword: Department of the Treasury",
      ];
      const result = convertToApplicantMessages(messages, "tax-clearance-online");
      expect(result).toEqual(["Valid Tax Clearance Required"]);
      expect(result).toHaveLength(1);
    });

    it("preserves order after deduplication", () => {
      const messages = [
        "Required keyword: 'Clearance Certificate'", // → "Valid Tax Clearance Required"
        "Certificate must be dated within the past six months", // → different message
        "Required keyword: 'State of New Jersey'", // → "Valid Tax Clearance Required" (duplicate)
      ];
      const result = convertToApplicantMessages(messages, "tax-clearance-online");
      expect(result[0]).toBe("Valid Tax Clearance Required");
      expect(result[1]).toBe("Tax clearance certificate must be valid for 180 days");
      expect(result).toHaveLength(2);
    });

    it("does not deduplicate messages that are distinct", () => {
      const messages = [
        "Certificate must be dated within the past six months",
        "FEIN last three digits don't match the Applicant ID on the certificate",
      ];
      const result = convertToApplicantMessages(messages, "tax-clearance-online");
      expect(result).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Combined filtering, mapping and deduplication
  // -------------------------------------------------------------------------
  describe("combined behaviour", () => {
    it("filters, maps, and deduplicates in a single call", () => {
      const messages = [
        "Unknown document type", // internal-only → filtered
        "Required keyword: 'Clearance Certificate'", // → "Valid Tax Clearance Required"
        "Required keyword: 'State of New Jersey'", // → "Valid Tax Clearance Required" (dupe)
        "Certificate must be dated within the past six months", // → unique message
      ];
      const result = convertToApplicantMessages(messages, "tax-clearance-online");
      expect(result).toEqual([
        "Valid Tax Clearance Required",
        "Tax clearance certificate must be valid for 180 days",
      ]);
    });
  });
});

import { detectDocumentType, getAvailableDocumentTypes } from "../../utils/documentTypeDetector";

// ---------------------------------------------------------------------------
// detectDocumentType()
// ---------------------------------------------------------------------------

describe("detectDocumentType", () => {
  // -------------------------------------------------------------------------
  // Tax Clearance Certificate
  // -------------------------------------------------------------------------
  describe("tax clearance certificate detection", () => {
    it("detects 'tax clearance certificate' in the filename", () => {
      const result = detectDocumentType("Tax Clearance Certificate.pdf");
      expect(result.detectedCategory).toBe("tax-clearance");
    });

    it("returns high confidence for tax clearance", () => {
      const result = detectDocumentType("Tax Clearance Certificate.pdf");
      expect(result.confidence).toBe("high");
    });

    it("returns an empty autoSelectedType since the user must choose", () => {
      const result = detectDocumentType("Tax Clearance Certificate.pdf");
      expect(result.autoSelectedType).toBe("");
    });

    it("is case-insensitive", () => {
      const result = detectDocumentType("TAX CLEARANCE CERTIFICATE.pdf");
      expect(result.detectedCategory).toBe("tax-clearance");
    });

    it("matches when the keyword appears mid-filename", () => {
      const result = detectDocumentType("2024 Tax Clearance Certificate NJ.pdf");
      expect(result.detectedCategory).toBe("tax-clearance");
    });
  });

  // -------------------------------------------------------------------------
  // Formation Document — operating agreement
  // -------------------------------------------------------------------------
  describe("formation document — operating agreement", () => {
    it("detects operating agreement from formation document filename", () => {
      const result = detectDocumentType("Formation Document_Operating Agreement.pdf");
      expect(result.detectedCategory).toBe("formation");
      expect(result.autoSelectedType).toBe("operating-agreement");
    });

    it("returns high confidence for operating agreement", () => {
      const result = detectDocumentType("Formation Document_Operating Agreement.pdf");
      expect(result.confidence).toBe("high");
    });

    it("is case-insensitive for operating keyword", () => {
      const result = detectDocumentType("FORMATION DOCUMENT_OPERATING AGREEMENT.pdf");
      expect(result.autoSelectedType).toBe("operating-agreement");
    });
  });

  // -------------------------------------------------------------------------
  // Formation Document — certificate of authority
  // -------------------------------------------------------------------------
  describe("formation document — certificate of authority", () => {
    it("detects cert-authority from formation document filename", () => {
      const result = detectDocumentType("Formation Document_Certificate of Authority.pdf");
      expect(result.detectedCategory).toBe("formation");
      expect(result.autoSelectedType).toBe("cert-authority");
    });

    it("returns high confidence for certificate of authority", () => {
      const result = detectDocumentType("Formation Document_Certificate of Authority.pdf");
      expect(result.confidence).toBe("high");
    });

    it("is case-insensitive for authority keyword", () => {
      const result = detectDocumentType("formation document_certificate of authority.pdf");
      expect(result.autoSelectedType).toBe("cert-authority");
    });
  });

  // -------------------------------------------------------------------------
  // Formation Document — certificate of formation
  // -------------------------------------------------------------------------
  describe("formation document — certificate of formation", () => {
    it("detects cert-formation when 'formation' appears after the prefix", () => {
      const result = detectDocumentType("Formation Document_Certificate of Formation.pdf");
      expect(result.detectedCategory).toBe("formation");
      expect(result.autoSelectedType).toBe("cert-formation");
    });

    it("returns medium confidence for certificate of formation", () => {
      const result = detectDocumentType("Formation Document_Certificate of Formation.pdf");
      expect(result.confidence).toBe("medium");
    });

    it("does not match cert-formation on the 'formation' in the prefix itself", () => {
      // Only "Formation Document" prefix — no second "formation" after it
      const result = detectDocumentType("Formation Document.pdf");
      expect(result.autoSelectedType).toBe("");
    });
  });

  // -------------------------------------------------------------------------
  // Formation Document — no specific keyword
  // -------------------------------------------------------------------------
  describe("formation document — no specific keyword", () => {
    it("detects formation category when only the prefix is present", () => {
      const result = detectDocumentType("Formation Document.pdf");
      expect(result.detectedCategory).toBe("formation");
    });

    it("returns an empty autoSelectedType when no specific keyword is found", () => {
      const result = detectDocumentType("Formation Document.pdf");
      expect(result.autoSelectedType).toBe("");
    });

    it("returns medium confidence when only the prefix is present", () => {
      const result = detectDocumentType("Formation Document.pdf");
      expect(result.confidence).toBe("medium");
    });
  });

  // -------------------------------------------------------------------------
  // IRS Determination Letter
  // -------------------------------------------------------------------------
  describe("IRS determination letter detection", () => {
    it("detects IRS determination letter", () => {
      const result = detectDocumentType("IRS Determination Letter.pdf");
      expect(result.detectedCategory).toBe("irs-determination");
      expect(result.autoSelectedType).toBe("irs-determination");
    });

    it("returns high confidence for IRS determination letter", () => {
      const result = detectDocumentType("IRS Determination Letter.pdf");
      expect(result.confidence).toBe("high");
    });

    it("is case-insensitive", () => {
      const result = detectDocumentType("irs determination letter 2024.pdf");
      expect(result.detectedCategory).toBe("irs-determination");
    });
  });

  // -------------------------------------------------------------------------
  // Certificate of Alternate Name
  // -------------------------------------------------------------------------
  describe("certificate of alternate name detection", () => {
    it("detects certificate of alternate name", () => {
      const result = detectDocumentType("Certificate of Alternate Name.pdf");
      expect(result.detectedCategory).toBe("alternate-name");
      expect(result.autoSelectedType).toBe("cert-alternative-name");
    });

    it("returns high confidence for certificate of alternate name", () => {
      const result = detectDocumentType("Certificate of Alternate Name.pdf");
      expect(result.confidence).toBe("high");
    });

    it("is case-insensitive", () => {
      const result = detectDocumentType("CERTIFICATE OF ALTERNATE NAME.pdf");
      expect(result.detectedCategory).toBe("alternate-name");
    });
  });

  // -------------------------------------------------------------------------
  // No detection fallback
  // -------------------------------------------------------------------------
  describe("no detection fallback", () => {
    it("returns 'all' category for an unrecognised filename", () => {
      const result = detectDocumentType("unknown_document.pdf");
      expect(result.detectedCategory).toBe("all");
    });

    it("returns an empty autoSelectedType for an unrecognised filename", () => {
      const result = detectDocumentType("unknown_document.pdf");
      expect(result.autoSelectedType).toBe("");
    });

    it("returns 'none' confidence for an unrecognised filename", () => {
      const result = detectDocumentType("unknown_document.pdf");
      expect(result.confidence).toBe("none");
    });

    it("returns 'all' category for an empty string", () => {
      const result = detectDocumentType("");
      expect(result.detectedCategory).toBe("all");
    });
  });
});

// ---------------------------------------------------------------------------
// getAvailableDocumentTypes()
// ---------------------------------------------------------------------------

describe("getAvailableDocumentTypes", () => {
  // -------------------------------------------------------------------------
  // tax-clearance
  // -------------------------------------------------------------------------
  describe("tax-clearance category", () => {
    it("returns exactly 2 document types", () => {
      const types = getAvailableDocumentTypes("tax-clearance");
      expect(types).toHaveLength(2);
    });

    it("includes only the two tax clearance options", () => {
      const types = getAvailableDocumentTypes("tax-clearance");
      const values = types.map((t) => t.value);
      expect(values).toContain("tax-clearance-online");
      expect(values).toContain("tax-clearance-manual");
    });

    it("excludes all non-tax-clearance types", () => {
      const types = getAvailableDocumentTypes("tax-clearance");
      const values = types.map((t) => t.value);
      expect(values).not.toContain("cert-formation");
      expect(values).not.toContain("operating-agreement");
      expect(values).not.toContain("irs-determination");
    });
  });

  // -------------------------------------------------------------------------
  // formation
  // -------------------------------------------------------------------------
  describe("formation category", () => {
    it("returns 9 document types", () => {
      const types = getAvailableDocumentTypes("formation");
      expect(types).toHaveLength(9);
    });

    it("excludes the tax clearance options", () => {
      const types = getAvailableDocumentTypes("formation");
      const values = types.map((t) => t.value);
      expect(values).not.toContain("tax-clearance-online");
      expect(values).not.toContain("tax-clearance-manual");
    });

    it("includes formation-related types", () => {
      const types = getAvailableDocumentTypes("formation");
      const values = types.map((t) => t.value);
      expect(values).toContain("cert-formation");
      expect(values).toContain("operating-agreement");
      expect(values).toContain("cert-authority");
    });
  });

  // -------------------------------------------------------------------------
  // full list categories
  // -------------------------------------------------------------------------
  describe("full list categories", () => {
    it("returns all 11 types for 'irs-determination'", () => {
      expect(getAvailableDocumentTypes("irs-determination")).toHaveLength(11);
    });

    it("returns all 11 types for 'alternate-name'", () => {
      expect(getAvailableDocumentTypes("alternate-name")).toHaveLength(11);
    });

    it("returns all 11 types for 'all'", () => {
      expect(getAvailableDocumentTypes("all")).toHaveLength(11);
    });

    it("returns all 11 types for an unknown category (default case)", () => {
      expect(getAvailableDocumentTypes("unknown-category")).toHaveLength(11);
    });

    it("every returned type has a non-empty value and label", () => {
      const types = getAvailableDocumentTypes("all");
      for (const docType of types) {
        expect(docType.value).toBeTruthy();
        expect(docType.label).toBeTruthy();
      }
    });
  });
});

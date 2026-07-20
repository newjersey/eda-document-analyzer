/**
 * Document Type Detection Utility
 * Analyzes filenames to auto-detect document types based on IT naming conventions
 */

interface DetectionResult {
  detectedCategory: string;
  autoSelectedType: string;
  confidence: "high" | "medium" | "none";
}

/**
 * Detects document type category and auto-selects type when possible
 * @param {string} filename - The name of the file to analyze
 * @returns {Object} Detection result with category and auto-selected type
 */
export function detectDocumentType(filename: string): DetectionResult {
  // Normalize filename to lowercase for case-insensitive matching
  const normalizedFilename = filename.toLowerCase();

  // Tax Clearance Certificate - detected but user must choose manual/online
  if (normalizedFilename.includes("tax clearance certificate")) {
    return {
      detectedCategory: "tax-clearance",
      autoSelectedType: "", // User must choose between manual/online
      confidence: "high"
    };
  }

  // Formation Document - check for keywords to auto-select specific type
  if (normalizedFilename.includes("formation document")) {
    // Get the part of the filename AFTER the "formation document" prefix
    // This prevents matching "formation" in the prefix itself
    const prefixIndex = normalizedFilename.indexOf("formation document");
    const afterPrefix = normalizedFilename.substring(prefixIndex + "formation document".length);

    // Check for specific keywords only in the part after the prefix
    if (afterPrefix.includes("operating")) {
      return {
        detectedCategory: "formation",
        autoSelectedType: "operating-agreement",
        confidence: "high"
      };
    }

    if (afterPrefix.includes("authority")) {
      return {
        detectedCategory: "formation",
        autoSelectedType: "cert-authority",
        confidence: "high"
      };
    }

    // Check for "formation" keyword only after the prefix
    // Example: "Formation Document_Certificate of Formation.pdf" should match
    if (afterPrefix.includes("formation")) {
      return {
        detectedCategory: "formation",
        autoSelectedType: "cert-formation",
        confidence: "medium"
      };
    }

    // Formation Document prefix found, but no specific keyword in the rest of filename
    return {
      detectedCategory: "formation",
      autoSelectedType: "", // User must choose from formation options
      confidence: "medium"
    };
  }

  // IRS Determination Letter - auto-select
  if (normalizedFilename.includes("irs determination letter")) {
    return {
      detectedCategory: "irs-determination",
      autoSelectedType: "irs-determination",
      confidence: "high"
    };
  }

  // Certificate of Alternate Name - auto-select
  if (normalizedFilename.includes("certificate of alternate name")) {
    return {
      detectedCategory: "alternate-name",
      autoSelectedType: "cert-alternative-name",
      confidence: "high"
    };
  }

  // No detection - show all options
  return {
    detectedCategory: "all",
    autoSelectedType: "",
    confidence: "none"
  };
}

export interface DocumentType {
  value: string;
  label: string;
}

const ALL_DOCUMENT_TYPES: DocumentType[] = [
  { value: "tax-clearance-online", label: "Tax Clearance Certificate (Online Generated)" },
  { value: "tax-clearance-manual", label: "Tax Clearance Certificate (Manually Generated)" },
  { value: "cert-alternative-name", label: "Certificate of Alternative Name" },
  { value: "cert-trade-name", label: "Certificate of Trade Name" },
  { value: "cert-formation", label: "Certificate of Formation" },
  { value: "cert-formation-independent", label: "Certificate of Formation (Independent)" },
  { value: "operating-agreement", label: "Operating Agreement" },
  { value: "cert-incorporation", label: "Certificate of Incorporation" },
  { value: "irs-determination", label: "IRS Determination Letter" },
  { value: "bylaws", label: "Bylaws" },
  { value: "cert-authority", label: "Certificate of Authority" }
];


/**
 * Gets the filtered list of document types to show in dropdown based on detection
 * @param {string} detectedCategory - The category detected by detectDocumentType
 * @returns {Array} Array of document type options to show in dropdown
 */
export function getAvailableDocumentTypes(detectedCategory: string): DocumentType[] {
  // Full list of all document types

  switch (detectedCategory) {
    case "tax-clearance":
      // Show only 2 tax clearance options
      return ALL_DOCUMENT_TYPES.filter(type =>
        type.value === "tax-clearance-online" ||
        type.value === "tax-clearance-manual"
      );

    case "formation":
      // Show all non-tax-clearance options (9 formation document types)
      return ALL_DOCUMENT_TYPES.filter(type =>
        type.value !== "tax-clearance-online" &&
        type.value !== "tax-clearance-manual"
      );

    case "irs-determination":
    case "alternate-name":
    case "all":
    default:
      // Show all 11 options
      return ALL_DOCUMENT_TYPES;
  }
}

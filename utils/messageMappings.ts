// Message mappings for document validation - REFACTORED ARCHITECTURE
// Maps internal validation messages to user-friendly applicant-facing messages for emails
// Organized by document type to prevent conflicts and improve maintainability

/**
 * Applicant-facing messages organized by document type
 * Structure: { documentType: { internalMessage: applicantMessage } }
 * 
 * Special keys:
 * - "shared": Messages that apply to ALL document types (generic fallback)
 * - "internal-only": Messages that should NEVER be shown to applicants
 */
export const applicantFacingMessages = {
  // ========================================
  // INTERNAL-ONLY ERRORS (Never show to applicants)
  // ========================================
  "internal-only": {
    "Unknown document type": true,
    "Processing timeout": true,
    "No file provided": true,
    "Failed to validate document": true,
    "Server configuration error: Missing Document Intelligence credentials": true,
    "Invalid base64 file data": true,
    "Expected JSON request body": true,
  },

  // ========================================
  // SHARED/GENERIC MESSAGES (Apply to all document types)
  // ========================================
  "shared": {
    // Currently no shared messages - all messages are document-specific
  },

  // ========================================
  // TAX CLEARANCE CERTIFICATE (ONLINE GENERATED)
  // ========================================
  "tax-clearance-online": {
    "Organization name doesn't match the one on the certificate": "Organization name doesn't match the one on the certificate.",
    "Required keyword: 'Clearance Certificate'": "Valid Tax Clearance Required",
    "Serial Number is missing": "Valid Tax Clearance Required",
    "Required keyword: 'State of New Jersey'": "Valid Tax Clearance Required",
    "Required keyword: Department of the Treasury": "Valid Tax Clearance Required",
    "Required keyword: Division of Taxation": "Valid Tax Clearance Required",
    "Signature is missing": "Valid Tax Clearance Required",
    "FEIN last three digits don't match the Applicant ID on the certificate": "Tax clearance number and Federal Employer Identification Number (FEIN) number do not match.",
    "Tax Clearance Certificate is issued by the Department of Environmental Protection": "Tax Clearance cannot be issued to Department of Enviromental Protection",
    "Certificate must be dated within the past six months": "Tax clearance certificate must be valid for 180 days",
  },

  // ========================================
  // TAX CLEARANCE CERTIFICATE (MANUALLY GENERATED)
  // ========================================
  "tax-clearance-manual": {
    "Organization name doesn't match the one on the certificate": "Organization name doesn't match the one on the certificate.",
    "Required keyword: 'BATC - Manual'": "Valid Tax Clearance Required",
    "FEIN last three digits don't match the Applicant ID on the certificate": "Tax clearance number and Federal Employer Identification Number (FEIN) number do not match.",
    "Certificate must be dated within the past six months": "Tax clearance certificate must be valid for 180 days",
  },

  // ========================================
  // CERTIFICATE OF ALTERNATIVE NAME
  // ========================================
  "cert-alternative-name": {
    "Organization name doesn't match the one on the certificate": "Organization name doesn't match the one on the certificate.",
    "Required keyword: 'Certificate of Alternate Name'": "Valid Certificate of Alternative Name Required",
    "Required keyword: 'Division of Revenue'": "Valid Certificate of Alternative Name Required",
    "Required keyword: 'Department of Treasury'": "Valid Certificate of Alternative Name Required",
  },

  // ========================================
  // CERTIFICATE OF TRADE NAME
  // ========================================
  "cert-trade-name": {
    "Required keyword: 'Certificate of Trade Name'": "Valid Certificate of Trade Name Required",
  },

  // ========================================
  // CERTIFICATE OF FORMATION
  // ========================================
  "cert-formation": {
    "Organization name doesn't match the one on the certificate": "Organization name doesn't match the one on the certificate.",
    "Required keyword: 'Certificate of Formation'": "Valid Certificate of Formation Required",
    "Certificate is not issued by the NJ Department of the Treasury": "Valid Certificate of Formation Required",
    "Signature of authorized state official is missing": "Valid Certificate of Formation Required",
    "Document must contain a date": "Valid Certificate of Formation Required",
    "Certificate verification information is missing": "Valid Certificate of Formation Required",
  },

  // ========================================
  // CERTIFICATE OF FORMATION (INDEPENDENT)
  // ========================================
  "cert-formation-independent": {
    "Organization name doesn't match the one on the certificate": "Organization name doesn't match the one on the certificate.",
    "FEIN (Federal Employer Identification Number) doesn't match the one on the certificate": "FEIN (Federal Employer Identification Number) doesn't match the one on the certificate.",
    "Required keyword: 'Filed'": "Valid Certificate of Formation Required",
    "Required keyword: 'Certificate of Formation'": "Valid Certificate of Formation Required",
  },

  // ========================================
  // OPERATING AGREEMENT
  // ========================================
  "operating-agreement": {
    "Required keyword: 'Operating Agreement'": "Required keyword: 'Operating Agreement'",
    "Member signatures are missing": "Member signatures are missing.",
    "Date is missing": "Adoption date is missing",
    "New Jersey state reference is missing": "New Jersey state reference is missing.",
  },

  // ========================================
  // CERTIFICATE OF INCORPORATION
  // ========================================
  "cert-incorporation": {
    "Required text: 'Certificate of Incorporation'": "Valid Certificate of Incorporation Required: Required text: 'Certificate of Incorporation'",
    "Board of Directors section is missing": "Valid Certificate of Incorporation Required: Board of Directors section is missing.",
  },

  // ========================================
  // IRS DETERMINATION LETTER
  // ========================================
  "irs-determination": {
    "IRS letterhead is missing": "Valid IRS Determination Letter Required",
  },

  // ========================================
  // BYLAWS
  // ========================================
  "bylaws": {
    "Required keyword: 'Bylaws'": "Valid bylaws required: Required keyword: 'Bylaws' missing from document",
    "Document must contain a date": "Valid bylaws required: Document must contain adoption date.",
  },

  // ========================================
  // CERTIFICATE OF AUTHORITY
  // ========================================
  "cert-authority": {
    "Organization name doesn't match the one on the certificate": "Organization name doesn't match the one on the certificate.",
    "Required keyword: 'Certificate of Authority'": "Valid Certficate of Authority Required",
    "Required keyword: 'State of New Jersey'": "Valid Certficate of Authority Required",
    "Certificate of Authority must reference State of New Jersey": "Valid Certficate of Authority Required",
    "Required keyword: 'Division of Taxation' or 'Department of the Treasury'": "Valid Certficate of Authority Required",
  },
};

/**
 * Gets the applicant-facing version of an issue message for a specific document type.
 * 
 * Lookup order:
 * 1. Check if message is internal-only (return null)
 * 2. Check document-specific mapping
 * 3. Check shared/generic mapping
 * 4. Return original message as fallback
 * 
 * @param {string} originalMessage - The internal validation message
 * @param {string} documentType - The document type (e.g., "tax-clearance-online")
 * @returns {string|null} The applicant-facing message, or null if internal-only
 */
export function getApplicantFacingMessage(originalMessage: string, documentType: string): string | null {
  // Step 1: Check if this is an internal-only message
  if (applicantFacingMessages["internal-only"]?.[originalMessage]) {
    return null; // Don"t show to applicant
  }

  // Step 2: Check document-specific mapping
  if (documentType && applicantFacingMessages[documentType]?.[originalMessage]) {
    return applicantFacingMessages[documentType][originalMessage];
  }

  // Step 3: Check shared/generic mapping
  if (applicantFacingMessages["shared"]?.[originalMessage]) {
    return applicantFacingMessages["shared"][originalMessage];
  }

  // Step 4: Return original message as fallback
  return originalMessage;
}

/**
 * Checks if a validation message should be shown to applicants in the email.
 * Returns false for internal-only error messages.
 * 
 * @param {string} originalMessage - The internal validation message
 * @returns {boolean} True if message should be shown to applicant, false otherwise
 */
export function shouldShowToApplicant(originalMessage: string): boolean {
  return !applicantFacingMessages["internal-only"]?.[originalMessage];
}

/**
 * Converts an array of internal validation messages to applicant-facing messages.
 * Filters out internal-only messages and deduplicates automatically.
 * 
 * @param {string[]} missingElements - Array of internal validation messages
 * @param {string} documentType - The document type (e.g., "tax-clearance-online")
 * @returns {string[]} Array of applicant-facing messages (filtered and deduplicated)
 */
export function convertToApplicantMessages(missingElements: string[], documentType: string): string[] {
  const messages = missingElements
    .filter(msg => shouldShowToApplicant(msg))
    .map(msg => getApplicantFacingMessage(msg, documentType))
    .filter(msg => msg !== null);

  // Deduplicate while preserving order
  return [...new Set(messages)];
}

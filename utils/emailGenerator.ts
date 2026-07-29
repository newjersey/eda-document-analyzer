// Email generator utility for creating applicant-facing email templates
// Converts validation results into formatted email text using the NJEDA template

import { ValidatedDocument } from "./analyticsService";
import { convertToApplicantMessages } from "./messageMappings";

/**
 * The official NJEDA email template with placeholders
 */
const EMAIL_TEMPLATE = `Email Subject Line: [XXX Program] Application Documentation Required: PROD – [XXXXXX]

Dear [Applicant],

Thank you for applying to [XXX] Program. My name is [your name], and I am a [your title] for the [XXX Program]. I have reviewed your application PROD – [XXXXXXXX]. Based on the review of your submitted application the following required document(s) were not submitted and/or incorrect:

[DOCUMENT_ISSUES]

In an effort to process your application quickly and efficiently, we ask that you do not respond to this email until you have all the requested documentation available. Please provide all the documentation below within [XX] business days or by [_/_/_].

If we do not receive a reply, or if you fail to provide all the required documentation by the date listed above, your application will be [rejected as incomplete].

Questions & Confirmation

• Please note that due to the high volume of applications received, individual acknowledgements of receipt will not be provided.
• For questions about the required documentation or the program, please review our Frequently Asked Questions (link if exists) or contact Customer Care at (844) 965-1125.

Thank you,

Your Name`;

/**
 * Document type display names for better readability in emails
 */
const DOCUMENT_TYPE_NAMES = {
  "tax-clearance-online": "Tax Clearance Certificate (Online Generated)",
  "tax-clearance-manual": "Tax Clearance Certificate (Manually Generated)",
  "cert-alternative-name": "Certificate of Alternative Name",
  "cert-trade-name": "Certificate of Trade Name",
  "cert-formation": "Certificate of Formation",
  "cert-formation-independent": "Certificate of Formation (Independent)",
  "operating-agreement": "Operating Agreement",
  "cert-incorporation": "Certificate of Incorporation",
  "irs-determination": "IRS Determination Letter",
  "bylaws": "Bylaws",
  "cert-authority": "Certificate of Authority"
};

interface Detection {
  autoSelectedType: string;
  detectedCategory: string;
}

interface Result {
  organizationNameMatches: boolean;
  error: string;
  success: boolean;
  message: string;
  missingElements: string[];
  documentInfo
}

/**
 * Gets a friendly display name for a document type
 * @param {string} documentType - The internal document type identifier
 * @returns {string} The user-friendly display name
 */
function getDocumentTypeName(documentType: ValidatedDocument["type"]): string {
  return DOCUMENT_TYPE_NAMES[documentType] || documentType;
}

/**
 * Formats the issues for a single document
 * @param {Object} document - Document object with validation results
 * @returns {string} Formatted issues text for this document
 */
function formatDocumentIssues(document: ValidatedDocument): string {
  if (!document.result || document.result.success === true || !document.result.missingElements) {
    return null; // No issues to report
  }

  // Get applicant-facing messages for all missing elements
  // Pass document type for context-aware mapping
  const applicantMessages = convertToApplicantMessages(document.result.missingElements, document.type);

  if (applicantMessages.length === 0) {
    return null; // All messages were internal-only
  }

  // Note: Deduplication now happens inside convertToApplicantMessages

  // Format the document section
  const documentName = getDocumentTypeName(document.type);
  let output = `• ${documentName}:\n`;

  applicantMessages.forEach(message => {
    output += `  - ${message}\n`;
  });

  return output;
}

/**
 * Generates email content for multiple failed documents
 * @param {Array} documents - Array of document objects with validation results
 * @param {string} projectNumber - Optional project number (e.g., "00187261")
 * @returns {string} Complete email text with all failed documents
 */
export function generateEmailForAllDocuments(documents: ValidatedDocument[], projectNumber: string = null): string {
  // Filter to only failed documents
  const failedDocuments = documents.filter(doc =>
    doc.result &&
    doc.result.success === false &&
    doc.result.missingElements &&
    doc.result.missingElements.length > 0
  );

  if (failedDocuments.length === 0) {
    return null; // No failed documents to report
  }

  // Format issues for all failed documents
  const documentIssuesText = failedDocuments
    .map(doc => formatDocumentIssues(doc))
    .filter(text => text !== null)
    .join("\n");

  if (!documentIssuesText.trim()) {
    return null; // All issues were internal-only
  }

  // Replace placeholders in template
  let email = EMAIL_TEMPLATE;

  // Replace project number if available
  if (projectNumber) {
    email = email.replace("XXXXXX", projectNumber);
    email = email.replace("XXXXXXXX", projectNumber);
  }

  // Replace document issues
  email = email.replace("[DOCUMENT_ISSUES]", documentIssuesText);

  return email;
}

/**
 * Extracts project number from documents (uses first available)
 * @param {Array} documents - Array of document objects
 * @returns {string|null} Project number if found, null otherwise
 */
export function extractProjectNumber(documents: ValidatedDocument[]): (ValidatedDocument["projectNumber"] | null) {
  for (const doc of documents) {
    if (doc.projectNumber) {
      return doc.projectNumber;
    }
  }
  return null;
}

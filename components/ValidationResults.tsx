"use client";
/**
 * ValidationResults.jsx
 * ---------------------
 * This component now acts as a container for the validation results,
 * displaying a summary and a list of collapsible result cards.
 */

import { FileText, Download, Mail } from "lucide-react";
import jsPDF from "jspdf";
import { generateEmailForAllDocuments, extractProjectNumber } from "../utils/emailGenerator";
import { toast } from "react-hot-toast";
import SingleResultCard from "./SingleResultCard";
import SummaryCard from "./SummaryCard";
import AnalyticsService, { ValidatedDocument } from "../utils/analyticsService";

interface ValidationResultsProps {
  documents: ValidatedDocument[];
  isDarkMode: boolean;
  userId: string;
  feedbackApiKey: string;
  onOpenEmailModal: (generatedEmailText: string) => void;
  onOpenPreviewModal: (document: ValidatedDocument) => void;
  analytics: AnalyticsService;
}

export default function ValidationResults({
  documents,
  isDarkMode,
  userId,
  feedbackApiKey,
  onOpenEmailModal,
  onOpenPreviewModal,
  analytics
}: ValidationResultsProps) {

  const documentsWithResults = documents.filter(doc => doc.result);

  if (documentsWithResults.length === 0) {
// --- END: New feature change for summary and accordion ---
    return (
      <div className={`p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center h-full ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-800/50 to-slate-800/50 border-gray-600"
          : "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300"
      }`}>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 mb-6 shadow-xl">
          <FileText className="h-16 w-16 text-white" />
        </div>
        <h3 className={`text-base md:text-2xl font-bold mb-3 text-center ${
          isDarkMode ? "text-gray-200" : "text-gray-800"
        }`}>No Validation Results</h3>
        <p className={`text-center max-w-xs mb-6 text-sm md:text-base leading-relaxed ${
          isDarkMode ? "text-gray-400" : "text-gray-600"
        }`}>
          Your validation results will appear here after you upload and validate your document(s).
        </p>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
      </div>
    );
  }

  // --- START: Added for PDF Download ---
  const handleDownloadPdf = () => {
    // === ANALYTICS: Track PDF download ===
    analytics?.logEvent("pdf_download_clicked", {
      documentCount: documentsWithResults.length
    });

    const doc = new jsPDF();
    let y = 20;
    const leftMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - leftMargin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerHeight = 20;

    const checkAndAddPage = (spaceNeeded: number) => {
        if (y + spaceNeeded > pageHeight - footerHeight) {
            doc.addPage();
            y = 20;
        }
    };

    const drawSectionTitle = (title: string) => {
        checkAndAddPage(15);
        y += 5;
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text(title, leftMargin, y);
        y += 7;
    };

    const drawBulletList = (items: string[]) => {
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        items.forEach(item => {
            const lines = doc.splitTextToSize(`• ${item}`, usableWidth - 2);
            checkAndAddPage(lines.length * 5 + 2);
            doc.text(lines, leftMargin + 2, y);
            y += (lines.length * 5) + 2;
        });
    };

    // Fix for text overlap
    const drawDetailRow = (label: string, value: string | number, valueColor: string = "#000000") => {
        checkAndAddPage(10);
        const valueColumnX = leftMargin + 60; // A fixed X position for the second column
        const valueUsableWidth = pageWidth - valueColumnX - leftMargin;

        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.text(label, leftMargin + 2, y); // Draw label in the first column

        doc.setFont(undefined, "normal");
        doc.setTextColor(valueColor);

        const valueLines = doc.splitTextToSize(String(value), valueUsableWidth);
        doc.text(valueLines, valueColumnX, y); // Draw value aligned in the second column

        doc.setTextColor("#000000");
        // The total height of the row is determined by how many lines the value text wraps into
        y += (valueLines.length * 5) + 2;
    };


    // --- 1. Report Header ---
    doc.setFontSize(22);
    doc.setFont(undefined, "bold");
    doc.text("Validation Report", pageWidth / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 15;

    // --- 2. Overall Summary ---
    const passCount = documentsWithResults.filter(d => d.result.success).length;
    const failCount = documentsWithResults.length - passCount;

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Summary", leftMargin, y);
    y += 7;

    drawDetailRow("Total Documents Processed:", documentsWithResults.length);
    drawDetailRow("Passed:", passCount, "#22c55e");
    drawDetailRow("Failed:", failCount, "#ef4444");

    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, y, pageWidth - leftMargin, y);
    y += 10;

    // --- 3. Loop through each document ---
    documentsWithResults.forEach((document, index) => {
        checkAndAddPage(60);
        const { file, result } = document;

        // Document File Name Header
        doc.setFontSize(16);
        doc.setFont(undefined, "bold");
        doc.text(file.name, leftMargin, y);
        y += 8;

        // Status
        const statusText = result.success ? "Success" : "Failed";
        const statusColor = result.success ? "#22c55e" : "#ef4444";
        drawDetailRow("Status:", statusText, statusColor);

        // Org Name Match
        let orgMatchText = result.organizationNameMatches ? "Yes" : "No";
        if (!result.organizationNameMatches && result.documentInfo.detectedOrganizationName) {
            orgMatchText += ` (Detected: "${result.documentInfo.detectedOrganizationName}")`;
        }
        drawDetailRow("Org Name Match:", orgMatchText, result.organizationNameMatches ? "#000000" : "#ef4444");
        y += 2;

        // Document Details Section
        drawSectionTitle("Document Details");
        drawDetailRow("Document Type:", result.documentInfo.documentType || "N/A");
        drawDetailRow("Page Count:", result.documentInfo.pageCount);
        drawDetailRow("Word Count:", result.documentInfo.wordCount);
        drawDetailRow("Contains Handwriting:", result.documentInfo.containsHandwriting ? "Yes" : "No");

        // Validation Checks Passed (show for all documents that have passedChecks)
        if (result.passedChecks && result.passedChecks.length > 0) {
            drawSectionTitle("Validation Checks Passed:");
            drawBulletList(result.passedChecks);
        }

        // If validation failed, list issues and actions
        if (!result.success) {
            if (result.missingElements && result.missingElements.length > 0) {
                drawSectionTitle("Issues Found:");
                drawBulletList(result.missingElements);
            }

            if (result.suggestedActions && result.suggestedActions.length > 0) {
                drawSectionTitle("Suggested Actions:");
                drawBulletList(result.suggestedActions);
            }
        }

        if (index < documentsWithResults.length - 1) {
            y += 5;
            checkAndAddPage(10);
            doc.setDrawColor(200, 200, 200);
            doc.line(leftMargin, y, pageWidth - leftMargin, y);
            y += 10;
        }
    });

    // --- 4. Save the PDF ---
    doc.save("validation-report.pdf");
  };

  const handlePreviewEmailForAll = () => {
    // === ANALYTICS: Track email template click ===
    analytics?.logEvent("email_template_opened", {
      documentCount: documentsWithResults.length,
      source: "validation_results"
    });

    const projectNumber = extractProjectNumber(documentsWithResults);
    const generatedEmail = generateEmailForAllDocuments(documentsWithResults, projectNumber);

    if (!generatedEmail) {
      toast.error("Cannot generate email: No failed documents or all issues are internal-only");
      return;
    }

    // Call the parent handler to open the modal at the top level
    onOpenEmailModal(generatedEmail);
  };

  // Check if there are any failed documents
  const hasFailedDocuments = documentsWithResults.some(doc =>
    doc.result &&
    !doc.result.error &&
    doc.result.missingElements &&
    doc.result.missingElements.length > 0
  );

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-2xl font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
            Validation Report
        </h2>
        <div className="flex gap-2">
          {hasFailedDocuments && (
            <button
              onClick={handlePreviewEmailForAll}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode
                  ? "text-white bg-indigo-600 hover:bg-indigo-700"
                  : "text-white bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <Mail className="w-4 h-4 mr-2" />
              See Email Template
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isDarkMode
                ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                : "text-gray-600 bg-gray-200 hover:bg-gray-300"
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </button>
        </div>
      </div>
      <SummaryCard documentsWithResults={documentsWithResults} isDarkMode={isDarkMode} />

      <div>
        {documentsWithResults.map((doc) => (
            <SingleResultCard
                key={doc.id}
                document={doc}
                isDarkMode={isDarkMode}
                userId={userId}
                feedbackApiKey={feedbackApiKey}
                onOpenPreviewModal={onOpenPreviewModal}
                analytics={analytics}
            />
        ))}
      </div>
    </div>
  );
}

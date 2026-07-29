"use client";
/**
 * DocumentViewer.jsx
 * ------------------
 * Reusable component for rendering document previews of various file types.
 * Supports: PDF (via PDF.js canvas rendering), images, text files, and DOCX/DOC (via mammoth.js).
 *
 * Usage:
 * <DocumentViewer file={fileObject} isDarkMode={boolean} zoomLevel={number} />
 *
 * Props:
 * - zoomLevel: Optional zoom scale (0.5 to 3.0), defaults to 1.0 (100%)
 *
 * UPDATED: Uses PDF.js with canvas rendering for consistent high-quality zoom across all browsers
 */

import { useState, useEffect } from "react";
import { FileText, AlertCircle } from "lucide-react";
import mammoth from "mammoth";
import dynamic from "next/dynamic";

// Dynamically import PDFViewer component (client-side only)
const PDFViewer = dynamic(() => import("./PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function DocumentViewer({ file, isDarkMode, zoomLevel = 1.0 }) {
  const [previewContent, setPreviewContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file) {
      setError("No file provided");
      setIsLoading(false);
      return;
    }

    generatePreview();
  }, [file]);

  /**
   * Main function to generate preview based on file type
   */
  const generatePreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      // PDF Preview
      if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        setPreviewContent({
          type: "pdf",
          data: arrayBuffer
        });
        setIsLoading(false);
      }
      // Image Preview
      else if (
        fileType.startsWith("image/") ||
        fileName.endsWith(".png") ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg")
      ) {
        const blobUrl = URL.createObjectURL(file);
        setPreviewContent({
          type: "image",
          url: blobUrl
        });
        setIsLoading(false);
      }
      // Text File Preview
      else if (fileType === "text/plain" || fileName.endsWith(".txt")) {
        const text = await file.text();
        setPreviewContent({
          type: "text",
          content: text
        });
        setIsLoading(false);
      }
      // DOCX/DOC Preview (using mammoth.js)
      else if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileType === "application/msword" ||
        fileName.endsWith(".docx") ||
        fileName.endsWith(".doc")
      ) {
        await generateWordPreview(file);
      }
      else {
        setError("Preview not available for this file type");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error generating preview:", err);
      setError("Failed to load document preview");
      setIsLoading(false);
    }
  };

  /**
   * Generate preview for Word documents using mammoth.js
   * Converts DOCX/DOC to HTML for display
   */
  const generateWordPreview = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (result.value) {
        setPreviewContent({
          type: "word",
          html: result.value
        });

        // Log any conversion messages/warnings
        if (result.messages && result.messages.length > 0) {
          console.warn("Word conversion messages:", result.messages);
        }
      } else {
        throw new Error("No content returned from Word conversion");
      }
    } catch (err) {
      console.error("Error converting Word document:", err);
      setError("Failed to convert Word document. File may be corrupted or in an unsupported format.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cleanup blob URLs when component unmounts or file changes
   */
  useEffect(() => {
    return () => {
      if (previewContent?.url) {
        URL.revokeObjectURL(previewContent.url);
      }
    };
  }, [previewContent]);

  // Loading State
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 ${
        isDarkMode ? "bg-gray-800" : "bg-gray-50"
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          Loading document preview...
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 ${
        isDarkMode ? "bg-gray-800" : "bg-gray-50"
      }`}>
        <div className={`rounded-full p-4 mb-4 ${
          isDarkMode ? "bg-red-900/50" : "bg-red-100"
        }`}>
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <p className={`text-sm font-medium mb-2 ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}>
          {error}
        </p>
        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          File: {file?.name}
        </p>
      </div>
    );
  }

  // No Preview Content
  if (!previewContent) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 ${
        isDarkMode ? "bg-gray-800" : "bg-gray-50"
      }`}>
        <FileText className={`h-12 w-12 mb-4 ${
          isDarkMode ? "text-gray-500" : "text-gray-400"
        }`} />
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          No preview available
        </p>
      </div>
    );
  }

  // Render Preview Based on Type
  return (
    <div className="h-full w-full overflow-auto document-viewer-container">
      {/* PDF Preview - Using dynamic PDFViewer component */}
      {previewContent.type === "pdf" && (
        <PDFViewer
          pdfData={previewContent.data}
          isDarkMode={isDarkMode}
          zoomLevel={zoomLevel}
        />
      )}

      {/* Image Preview */}
      {previewContent.type === "image" && (
        <div className={`h-full w-full flex items-start justify-center p-4 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-100"
        }`}>
          <img
            src={previewContent.url}
            alt="Document preview"
            className="max-w-full h-auto object-contain"
            style={{
              width: `${100 * zoomLevel}%`,
              imageRendering: zoomLevel > 1 ? "smooth" : "auto"
            }}
          />
        </div>
      )}

      {/* Text Preview */}
      {previewContent.type === "text" && (
        <div className={`h-full w-full p-6 overflow-auto ${
          isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"
        }`}>
          <div style={{ fontSize: `${zoomLevel}rem` }}>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {previewContent.content}
            </pre>
          </div>
        </div>
      )}

      {/* Word Document Preview */}
      {previewContent.type === "word" && (
        <div className={`h-full w-full p-6 overflow-auto ${
          isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"
        }`}>
          <div
            className="prose max-w-none"
            style={{ fontSize: `${zoomLevel}rem` }}
            dangerouslySetInnerHTML={{ __html: previewContent.html }}
          />
        </div>
      )}
    </div>
  );
}

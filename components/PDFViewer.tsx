"use client";
/**
 * PDFViewer.jsx
 * -------------
 * PDF viewer using PDF.js with canvas rendering for high-quality zoom.
 * Renders PDFs to canvas elements for consistent quality across all browsers.
 *
 * Props:
 * - pdfData: ArrayBuffer of the PDF file
 * - isDarkMode: boolean
 * - zoomLevel: number (0.5 to 3.0)
 */

import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  pdfData: string;
  isDarkMode: boolean;
  zoomLevel: number;
}

export default function PDFViewer({ pdfData, isDarkMode, zoomLevel }: PDFViewerProps) {
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);

  // Load PDF document
  useEffect(() => {
    if (!pdfData) return;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setError(null);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load PDF document");
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [pdfData]);

  // Render PDF pages to canvas
  useEffect(() => {
    if (!pdf || !containerRef.current) return;

    const renderPages = async () => {
      const container = containerRef.current;
      // Clear existing canvases
      container.innerHTML = "";

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);

          // Calculate scale for high-quality rendering
          const viewport = page.getViewport({ scale: 1.5 * zoomLevel });

          // Create canvas
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.className = "mb-4 shadow-lg mx-auto";

          // Render PDF page to canvas
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          await page.render(renderContext).promise;
          container.appendChild(canvas);
        } catch (err) {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
      }
    };

    renderPages();
  }, [pdf, numPages, zoomLevel]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full p-8 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      }`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full p-8 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      }`}>
        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center py-4 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    />
  );
}

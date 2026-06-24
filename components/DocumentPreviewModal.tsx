"use client";

import { useEffect, useState, useRef } from "react";
/**
 * DocumentPreviewModal.jsx
 * -------------------------
 * Modal component for previewing documents with two display modes:
 * 1. Document only (before validation)
 * 2. Document + validation result side-by-side (after validation)
 *
 * Follows the same architectural pattern as EmailPreviewModal and SharePointSearchModal
 * with state managed at DocumentValidator parent level.
 *
 * UPDATED: Added trackpad/wheel zoom support with smooth transitions
 */

import { X, FileText, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import DocumentViewer from "./DocumentViewer";
import SingleResultCard from "./SingleResultCard";
import AnalyticsService, { ValidatedDocument } from "../utils/analyticsService";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ValidatedDocument;
  isDarkMode: boolean;
  userId: string;
  feedbackApiKey: string;
  analytics: AnalyticsService;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  isDarkMode,
  userId,
  feedbackApiKey,
  analytics
}: DocumentPreviewModalProps) {
  // Zoom state - 1.0 = 100%, 0.5 = 50%, 2.0 = 200%
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const modalRef = useRef(null);

  // Track modal opened
  useEffect(() => {
    if (isOpen && document) {
      analytics?.logEvent("document_preview_opened", {
        documentId: document.id,
        fileName: document.file?.name,
        hasValidationResult: document.result !== null
      });
    }
  }, [isOpen, document]);

  // Reset zoom when modal opens or document changes
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1.0);
    }
  }, [isOpen, document?.id]);

  /**
   * Handle wheel events for trackpad/mouse zoom
   * Ctrl + Wheel = Zoom in/out
   * Smooth zoom increments (10% per scroll)
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleWheel = (event: WheelEvent) => {
      // Only zoom if Ctrl key is pressed
      if (event.ctrlKey) {
        event.preventDefault();

        // Determine zoom direction and amount
        // Negative deltaY = scroll up = zoom in
        // Positive deltaY = scroll down = zoom out
        const delta = event.deltaY > 0 ? -0.1 : 0.1;

        setZoomLevel(prev => {
          const newZoom = prev + delta;
          // Clamp between 0.5 (50%) and 3.0 (300%)
          return Math.min(Math.max(newZoom, 0.5), 3.0);
        });

        analytics?.logEvent("document_preview_wheel_zoom", {
          documentId: document?.id,
          zoomDirection: delta > 0 ? "in" : "out"
        });
      }
    };

    const modalElement = modalRef.current;
    if (modalElement) {
      modalElement.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        modalElement.removeEventListener("wheel", handleWheel);
      };
    }
  }, [isOpen, document, analytics]);

  if (!isOpen || !document) return null;

  // Determine if validation has been completed for this document
  const hasValidationResult = document.result !== null;

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      analytics?.logEvent("document_preview_closed", {
        documentId: document?.id,
        fileName: document?.file?.name,
        method: "backdrop_click"
      });
      onClose();
    }
  };

  /**
   * Handle ESC key to close modal
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      analytics?.logEvent("document_preview_closed", {
        documentId: document?.id,
        fileName: document?.file?.name,
        method: "escape_key"
      });
      onClose();
    }
  };

  /**
   * Zoom in by 25%
   */
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3.0));
    analytics?.logEvent("document_preview_zoom_in", {
      documentId: document?.id,
      newZoomLevel: Math.min(zoomLevel + 0.25, 3.0)
    });
  };

  /**
   * Zoom out by 25%
   */
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    analytics?.logEvent("document_preview_zoom_out", {
      documentId: document?.id,
      newZoomLevel: Math.max(zoomLevel - 0.25, 0.5)
    });
  };

  /**
   * Reset zoom to 100%
   */
  const handleZoomReset = () => {
    setZoomLevel(1.0);
    analytics?.logEvent("document_preview_zoom_reset", {
      documentId: document?.id
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div
        ref={modalRef}
        className={`relative w-full h-[90vh] max-w-7xl rounded-2xl shadow-2xl overflow-hidden ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDarkMode ? "border-gray-700 bg-gray-800/95" : "border-gray-200 bg-white/95"
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? "bg-blue-900/50" : "bg-blue-100"
            }`}>
              <FileText className={`h-5 w-5 ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`} />
            </div>
            <div>
              <h2
                id="preview-modal-title"
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Document Preview
              </h2>
              <p className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                {document.file.name}
              </p>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-3 py-2 rounded-lg border ${
              isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-100 border-gray-300"
            }`}>
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className={`p-1.5 rounded transition-colors ${
                  zoomLevel <= 0.5
                    ? "opacity-50 cursor-not-allowed"
                    : isDarkMode
                      ? "hover:bg-gray-600 text-gray-300"
                      : "hover:bg-gray-200 text-gray-700"
                }`}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <button
                onClick={handleZoomReset}
                className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                  isDarkMode
                    ? "hover:bg-gray-600 text-gray-300"
                    : "hover:bg-gray-200 text-gray-700"
                }`}
                aria-label="Reset zoom"
                title="Reset to 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3.0}
                className={`p-1.5 rounded transition-colors ${
                  zoomLevel >= 3.0
                    ? "opacity-50 cursor-not-allowed"
                    : isDarkMode
                      ? "hover:bg-gray-600 text-gray-300"
                      : "hover:bg-gray-200 text-gray-700"
                }`}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => {
                analytics?.logEvent("document_preview_closed", {
                  documentId: document?.id,
                  fileName: document?.file?.name,
                  method: "close_button"
                });
                onClose();
              }}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              }`}
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Two Layout Modes */}
        <div className={`h-[calc(90vh-5rem)] overflow-hidden ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}>
          {hasValidationResult ? (
            // Mode 2: Side-by-side layout (Document + Validation Result)
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full p-4">
              {/* Left: Document Preview */}
              <div className={`rounded-lg overflow-hidden border ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}>
                <div className={`px-4 py-2 border-b font-medium text-sm ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800/50 text-gray-300"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                }`}>
                  Document
                </div>
                <div className="h-[calc(100%-2.5rem)]">
                  <DocumentViewer
                    file={document.file}
                    isDarkMode={isDarkMode}
                    zoomLevel={zoomLevel}
                  />
                </div>
              </div>

              {/* Right: Validation Result */}
              <div className={`rounded-lg overflow-auto border ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}>
                <div className={`px-4 py-2 border-b font-medium text-sm sticky top-0 z-10 ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800/95 text-gray-300"
                    : "border-gray-200 bg-gray-50/95 text-gray-700"
                }`}>
                  Validation Result
                </div>
                <div className="p-4">
                  <SingleResultCard
                    document={document}
                    isDarkMode={isDarkMode}
                    userId={userId}
                    feedbackApiKey={feedbackApiKey}
                    isInPreviewModal={true}
                    analytics={analytics}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Mode 1: Full-width document preview (No validation yet)
            <div className="h-full w-full">
              <DocumentViewer
                file={document.file}
                isDarkMode={isDarkMode}
                zoomLevel={zoomLevel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

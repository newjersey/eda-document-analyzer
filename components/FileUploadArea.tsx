"use client";

import { CheckCircle, ChevronDown, FileText, PlusCircle, Upload, X } from "lucide-react";
import { useState } from "react";

// Document type auto-detection
import { getAvailableDocumentTypes } from "../utils/documentTypeDetector";
import GuidanceContent from "./GuidanceContent";
import AnalyticsService from "../utils/analyticsService";
import { Document } from "../utils/emailGenerator";
import toast from "react-hot-toast";

interface FileUploadAreaProps {
    documents: Document[];
    handleDocumentTypeChange: (documentId: string, newType: string) => void;
    removeDocument: (id: string) => void;
    isDragOver: boolean;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
    handleDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
    handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
    isDarkMode: boolean;
    handleDocumentPreview: (document: Document) => void;
    analytics :AnalyticsService;
}

export default function FileUploadArea({
  documents,
  handleDocumentTypeChange,
  removeDocument,
  isDragOver,
  handleFileChange,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  isDarkMode,
  handleDocumentPreview,
  analytics
}: FileUploadAreaProps) {
  // State for guidance accordion - starts collapsed
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);

  const triggerFileInput = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    analytics?.logEvent("file_upload_local", {
      method: "browse_button"
    });

    document.getElementById("file-upload").click();
  };

  // Wrap handleFileChange to track file upload
  const handleFileChangeWithTracking = (
    event: React.ChangeEvent<HTMLInputElement>
    ) => {
    const fileCount = event.target.files?.length || 0;
    if (fileCount > 0) {
      analytics?.logEvent("file_upload_local", {
        method: "file_input",
        fileCount: fileCount
      });
    }
    handleFileChange(event);
  };

  // Wrap handleDrop to track drag-and-drop upload
  const handleDropWithTracking = (event: React.DragEvent<HTMLDivElement>) => {
    const fileCount = event.dataTransfer?.files?.length || 0;
    if (fileCount > 0) {
      analytics?.logEvent("file_upload_local", {
        method: "drag_and_drop",
        fileCount: fileCount
      });
    }
    handleDrop(event);
  };

  // Wrap handleDocumentTypeChange to track type changes
  const handleDocumentTypeChangeWithTracking = (docId, newType) => {
      // Find the document to check if it had a type before
      const doc = documents.find(d => d.id === docId);
      const previousType = doc?.type;

      // Track first-time selection vs changing existing type
      if (!previousType || previousType === "") {
          analytics?.logEvent("document_type_manually_selected", {
              documentId: docId,
              selectedType: newType
          });
      } else {
          analytics?.logEvent("document_type_changed", {
              documentId: docId,
              previousType: previousType,
              newType: newType
          });
      }

      handleDocumentTypeChange(docId, newType);
  };

  // Wrap removeDocument to track file removal
  const removeDocumentWithTracking = (docId) => {
    analytics?.logEvent("file_removed", {
      documentId: docId
    });
    removeDocument(docId);
  };


  /**
   * Handles viewing a sample document
   * Creates a placeholder document object and shows message
   * When real sample images are configured, this will display them
   */
  const handleViewSampleDocument = (sampleInfo) => {
    // Track sample view analytics
    analytics?.logEvent("guidance_sample_viewed", {
      documentType: sampleInfo.type,
      documentLabel: sampleInfo.label
    });

    // For now, show a toast message since actual sample images aren"t configured
    // When real images are available, create a proper document object and call handleDocumentPreview
    //alert(`Sample preview for "${sampleInfo.label}" will be available once sample images are configured.\n\nPlaceholder path: ${sampleInfo.samplePath}`);


    // Fetch the sample image and convert to File object
    fetch(sampleInfo.samplePath)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `Sample - ${sampleInfo.label}.pdf`, { type: "application/pdf" });
        const sampleDoc = {
          file: file,
          id: `sample-${sampleInfo.type}`,
          result: null,
          type: sampleInfo.type,
          detectedCategory: null,
          projectNumber: null
        };
        handleDocumentPreview(sampleDoc);
      })
      .catch(err => {
        console.error("Error loading sample document:", err);
        toast.error("Failed to load sample document");
      });
  };
  // A reusable component for the action buttons to avoid repetition
  const ActionButtons = () => (
    <div className="flex items-center space-x-4 mt-4">
      <button
        onClick={triggerFileInput}
        className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${isDarkMode ? "text-blue-300 bg-blue-900/50 hover:bg-blue-800/50" : "text-blue-700 bg-blue-100 hover:bg-blue-200"}`}
      >
        <PlusCircle className="h-5 w-5 mr-2" />
        {documents.length > 0 ? "Add Another File" : "Browse Files"}
      </button>
    </div>
  );

  return (
    <div className="mb-8">
      <div
        className={`relative w-full min-h-[14.5rem] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group p-4 ${
          isDragOver
            ? isDarkMode
              ? "border-blue-400 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 scale-[1.02]"
              : "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 scale-[1.02]"
            : documents.length > 0
              ? isDarkMode
                ? "border-emerald-400 bg-gradient-to-br from-emerald-900/30 to-green-900/30"
                : "border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50"
              : isDarkMode
                ? "border-gray-600 bg-gradient-to-br from-gray-800/50 to-slate-800/50 hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-900/30 hover:to-indigo-900/30 hover:scale-[1.01]"
                : "border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:scale-[1.01]"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDropWithTracking}
      >
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileChangeWithTracking}
          multiple
        />

        {isDragOver ? (
          <>
            <div className="bg-blue-500 rounded-full p-4 mb-4 shadow-lg animate-bounce">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <p className="text-base md:text-lg font-semibold text-blue-700">Drop your files here!</p>
            <p className="text-sm md:text-base text-blue-600 mt-1">Release to upload</p>
          </>
        ) : documents.length > 0 ? (
          <>
            <div className="bg-emerald-500 rounded-full p-4 mb-4 shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <p className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              {documents.length} file(s) ready for validation
            </p>
            <div className={`w-full max-h-[50rem] overflow-y-auto rounded-lg p-2 space-y-2 ${isDarkMode ? "bg-gray-900/50" : "bg-gray-100/50"}`}>
              <ul className="text-left space-y-1">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs p-2 rounded-md ${isDarkMode ? "bg-gray-700/50" : "bg-white/50"}`}
                  >
                    <div className="flex items-center truncate mb-2 sm:mb-0 sm:mr-2 w-full sm:w-auto">
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDocumentPreview(doc);
                        }}
                        className={`truncate pr-2 text-left transition-colors cursor-pointer ${
                          isDarkMode
                            ? "text-gray-300 hover:text-blue-400 hover:underline"
                            : "text-gray-600 hover:text-blue-600 hover:underline"
                        }`}
                        title={doc.file.name}
                      >
                        {doc.file.name}
                      </button>
                    </div>
                    <div className="flex items-center w-full sm:w-auto">
                      <select
                        value={doc.type}
                        onChange={(e) => handleDocumentTypeChangeWithTracking(doc.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-48 text-xs rounded border-none p-1 mr-2 ${
                          isDarkMode ? "bg-gray-600 text-white" : "bg-gray-200 text-black"
                        } ${!doc.type ? (isDarkMode ? "text-gray-400" : "text-gray-500") : ""}`}
                      >
                        <option value="" disabled>Select from dropdown</option>
                        {getAvailableDocumentTypes(doc.detectedCategory).map(typeOption => (
                          <option key={typeOption.value} value={typeOption.value}>
                            {typeOption.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDocumentWithTracking(doc.id);
                        }}
                        className={`p-1 rounded-full transition-colors ${isDarkMode ? "text-gray-400 hover:bg-red-800/50 hover:text-white" : "text-gray-500 hover:bg-red-100 hover:text-red-600"}`}
                        aria-label="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <ActionButtons />
          </>
        ) : (
          <>
            <div className={`rounded-full p-4 mb-4 transition-all duration-300 ${
              isDarkMode
                ? "bg-gradient-to-r from-gray-700 to-slate-700 group-hover:from-blue-700 group-hover:to-indigo-700"
                : "bg-gradient-to-r from-gray-200 to-slate-200 group-hover:from-blue-200 group-hover:to-indigo-200"
            }`}>
              <Upload className={`h-8 w-8 transition-colors duration-300 ${
                isDarkMode
                  ? "text-gray-400 group-hover:text-blue-400"
                  : "text-gray-500 group-hover:text-blue-600"
              }`} />
            </div>
            <p className={`text-sm md:text-base font-semibold mb-1 ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            }`}>Drag & drop or add your files</p>

            <ActionButtons />

            <div className={`backdrop-blur-sm px-4 py-2 rounded-full border mt-4 ${
              isDarkMode
                ? "bg-gray-700/80 border-gray-600"
                : "bg-white/80 border-gray-200"
            }`}>
              <p className={`text-xs md:text-sm font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}>
                PDF, JPG, PNG (Max 23MB per file)
              </p>
            </div>
          </>
        )}
      </div>
      {/* Guidance Section - Collapsible Accordion */}
      <div className={`mt-6 border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
        isDarkMode
          ? "bg-gray-800/60 border-gray-700/50"
          : "bg-white/60 border-gray-200/50"
      }`}>
        {/* Accordion Header */}
        <button
          onClick={() => {
            const newState = !isGuidanceOpen;
            setIsGuidanceOpen(newState);
            analytics?.logEvent(newState ? "guidance_opened" : "guidance_closed", {});
          }}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-500/5 transition-colors"
        >
          <div className="flex items-center">
            <span className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
              How to Select the Right Document?
            </span>
          </div>
          <ChevronDown className={`h-6 w-6 flex-shrink-0 transition-transform duration-300 ${
            isGuidanceOpen ? "rotate-180" : ""
          } ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} />
        </button>

        {/* Collapsible Body */}
        {isGuidanceOpen && (
          <div className={`px-4 pb-4 border-t ${isDarkMode ? "border-gray-700/50" : "border-gray-200/50"}`}>
            <GuidanceContent
              isDarkMode={isDarkMode}
              onViewSample={handleViewSampleDocument}
            />
          </div>
        )}
      </div>
    </div>
  );
}
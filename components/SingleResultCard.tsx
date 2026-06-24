'use client';
/**
 * SingleResultCard.tsx
 * --------------------
 * This component is responsible for rendering the detailed validation
 * outcome for a single document. It includes success/failure states,
 * document info, and the Feedback component.
 * It is now a stateful component that manages its own open/closed state.
 */

import { useState } from 'react';
import { CheckCircle, AlertCircle, ChevronDown, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Feedback from './Feedback';
import AnalyticsService, { ValidatedDocument } from '../utils/analyticsService';

interface SingleResultCardProps {
    document: ValidatedDocument;
    isDarkMode: boolean;
    userId: string;
    feedbackApiKey: string;
    onOpenPreviewModal?: (document: ValidatedDocument) => void;
    isInPreviewModal?: boolean;
    analytics: AnalyticsService;
}

export default function SingleResultCard({
  document,
  isDarkMode,
  userId,
  feedbackApiKey,
  // --- START: Document preview feature ---
  onOpenPreviewModal,
  isInPreviewModal = false, // Add prop to detect if rendered inside preview modal
  // --- END: Document preview feature ---
  analytics // === ANALYTICS: Added analytics prop ===
} : SingleResultCardProps) {
  // Auto-expand when in preview modal, otherwise start collapsed
  const [isOpen, setIsOpen] = useState(isInPreviewModal);
  const { file, id: documentId, result: validationResult } = document;

  if (!validationResult) {
    return null;
  }

  const hasFailed = validationResult.error || (validationResult.missingElements && validationResult.missingElements.length > 0);

  // --- START: New Upload Function for Negative Feedback ---
  const handleUploadForReview = async (feedbackId: string): Promise<void> => {
    if (!file || !feedbackId) {
      console.error("File or feedbackId is missing, cannot upload for review.");
      return;
    }

    const formData = new FormData();
    formData.append('document', file as unknown as Blob); // forcing type to match FormData type schema
    formData.append('feedbackId', feedbackId);

    const uploadPromise = fetch('/api/upload-document-for-review', {
      method: 'POST',
      body: formData,
    });

    toast.promise(uploadPromise, {
        loading: `Uploading ${file.name} for review...`,
        success: `Successfully uploaded ${file.name} for review.`,
        error: `Failed to upload ${file.name}.`
    });

    try {
        const response = await uploadPromise;
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
            throw new Error(errorData.message);
        }
        const result = await response.json();
        console.log("Upload successful:", result);
    } catch (error) {
        console.error("Error uploading document for review:", error);
    }
  };
  // --- END: New Upload Function for Negative Feedback ---


  // --- START: Document preview feature ---
  /**
   * Handles opening the document preview modal for this specific document
   * Shows document side-by-side with validation result
   * Note: Modal tracks its own opening, no need to track here
   */
  const handlePreviewDocument = () => {
    onOpenPreviewModal(document);
  };
  // --- END: Document preview feature ---

  return (
    <div className={`mb-4 border-2 rounded-2xl shadow-lg backdrop-blur-sm overflow-hidden transition-all duration-300 ${
        isDarkMode
            ? 'bg-gray-800/60 border-gray-700/50'
            : 'bg-white/60 border-gray-200/50'
    }`}>
      {/* --- Accordion Header (hide when in preview modal) --- */}
      {!isInPreviewModal && (
        <button
          onClick={() => {
            const newState = !isOpen;
            setIsOpen(newState);
            // === ANALYTICS: Track accordion expand/collapse ===
            analytics?.logEvent(newState ? 'result_card_expanded' : 'result_card_collapsed', {
              documentId: document.id,
              fileName: file.name,
              hasFailed: hasFailed
            });
          }}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center truncate">
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-4 flex-shrink-0 ${
                  hasFailed
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
              }`}>
                  {hasFailed ? <AlertCircle className="h-5 w-5 text-white" /> : <CheckCircle className="h-5 w-5 text-white" />}
              </div>
              <span className={`font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {file.name}
              </span>
          </div>
          <ChevronDown className={`h-6 w-6 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        </button>
      )}

      {/* --- Collapsible Body (always show when in preview modal) --- */}
      {(isOpen || isInPreviewModal) && (
        <div className={`px-4 pb-4 md:px-6 md:pb-6 ${!isInPreviewModal ? 'border-t border-dashed border-gray-500/30' : ''}`}>
          {validationResult.error ? (
            <div className={`flex items-center p-4 rounded-xl mt-4 ${
                isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
            }`}>
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <p className="text-sm">Validation could not be completed. Error: {validationResult.message}</p>
            </div>
          ) : (
            <>
              {/* --- START: Validation success section --- */}
              {/* Display passed checks when available */}
              {validationResult.passedChecks && validationResult.passedChecks.length > 0 && (
                <div className={`mt-4 p-4 border rounded-xl ${
                    isDarkMode
                        ? 'bg-green-900/40 border-green-700/50'
                        : 'bg-green-50 border-green-200/50'
                }`}>
                  <p className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>Validation Checks Passed</p>
                  <ul className="space-y-2">
                    {validationResult.passedChecks.map((check, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 mr-3 flex-shrink-0"></div>
                        <p className={`${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>{check}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* --- END: Validation success section --- */}

              {/* Detailed result sections */}
              {validationResult.missingElements && validationResult.missingElements.length > 0 && (
                <div className={`mt-4 p-4 border rounded-xl ${
                    isDarkMode
                        ? 'bg-red-900/40 border-red-700/50'
                        : 'bg-red-50 border-red-200/50'
                }`}>
                  <p className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>Issues Found</p>
                  <ul className="space-y-2">
                    {validationResult.missingElements.map((item, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 mr-3 flex-shrink-0"></div>
                        <p className={`${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(!validationResult.missingElements || validationResult.missingElements.length === 0) && validationResult.documentInfo && (
                <div className={`mt-4 p-4 border rounded-xl ${
                    isDarkMode
                        ? 'bg-emerald-900/40 border-emerald-700/50'
                        : 'bg-emerald-50 border-emerald-200/50'
                }`}>
                  <p className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Document Information</p>
                  <div className="grid grid-cols-1 gap-1">
                    {validationResult.documentInfo.pageCount && (
                      <div className={`flex items-center text-sm ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3 shadow-sm"></div>
                        <span className="font-medium">Pages: <span className="font-bold">{validationResult.documentInfo.pageCount}</span></span>
                      </div>
                    )}
                    {validationResult.documentInfo.wordCount && (
                      <div className={`flex items-center text-sm ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3 shadow-sm"></div>
                        <span className="font-medium">Words: <span className="font-bold">{validationResult.documentInfo.wordCount}</span></span>
                      </div>
                    )}
                    {validationResult.documentInfo.containsHandwriting !== undefined && (
                      <div className={`flex items-center text-sm ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3 shadow-sm"></div>
                        <span className="font-medium">Contains handwriting: <span className="font-bold">{validationResult.documentInfo.containsHandwriting ? 'Yes' : 'No'}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {validationResult.suggestedActions && validationResult.suggestedActions.length > 0 && (
                <div className={`mt-4 p-4 border rounded-xl ${
                    isDarkMode
                        ? 'bg-blue-900/40 border-blue-700/50'
                        : 'bg-blue-50 border-blue-200/50'
                }`}>
                  <p className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Suggested Actions</p>
                  <ul className="space-y-2">
                    {validationResult.suggestedActions.map((action: string, index: number) => (
                      <li key={index} className="flex items-start text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-3 flex-shrink-0"></div>
                        <p className={`${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{action}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* --- START: Document preview feature - Action buttons section --- */}
              {/* Show "View with Document" button for all validated documents (not in preview modal) */}
              {!validationResult.error && !isInPreviewModal && (
                <div className="mt-4">
                  <button
                    onClick={handlePreviewDocument}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    View with Document
                  </button>
                </div>
              )}
              {/* --- END: Document preview feature - Action buttons section --- */}

              <div className="mt-6">
                <Feedback
                  documentId={document.id}
                  isDarkMode={isDarkMode}
                  userId={userId}
                  fileName={document.file.name}
                  apiKey={feedbackApiKey}
                  onNegativeFeedbackSubmit={handleUploadForReview}
                  analytics={analytics}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
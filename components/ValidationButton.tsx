"use client";
/**
 * ValidationButton.jsx
 * --------------------
 * Simple presentational component that renders the primary CTA
 * used to trigger the document-validation workflow.
 *
 * Props
 * -----
 * • isUploading: boolean  – true while the API request is pending;
 *   renders a disabled button with a spinner.
 * • validateDocument: () => void – callback that initiates validation.
 * • isDarkMode: boolean – drives Tailwind class selection for theming.
 *
 * There is no internal state; the component is intentionally kept
 * stateless to aid reusability and testability.
 */

import { CheckCircle } from "lucide-react";

interface ValidationButtonProps {
  isUploading: boolean;
  validateDocument: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isDarkMode: boolean;
}

export default function ValidationButton({ 
  isUploading, 
  validateDocument, 
  isDarkMode 
}: ValidationButtonProps) {
  return (
    <div className="flex justify-center">
      <button
        className={`relative px-8 py-4 rounded-2xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 ${
          isUploading
            ? isDarkMode
              ? "bg-gray-600 cursor-not-allowed text-gray-300"
              : "bg-gray-400 cursor-not-allowed text-white"
            : isDarkMode
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-xl focus:ring-blue-500/50"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500/50"
        }`}
        onClick={validateDocument}
        disabled={isUploading}
      >
        {isUploading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Validating...
          </div>
        ) : (
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Validate Document
          </div>
        )}
      </button>
    </div>
  );
}


"use client";
/**
 * SummaryCard.jsx
 * ---------------
 * Displays a high-level summary of the validation results, including
 * the total number of documents processed, passed, and failed.
 * NOTE: Errors are now shown as toast notifications instead of in the summary.
 */
import { Check, X } from "lucide-react";
import { Document } from "../utils/emailGenerator";

interface SummaryCardProps {
    documentsWithResults: Document[];
    isDarkMode: boolean;
}

export default function SummaryCard({
    documentsWithResults,
    isDarkMode
}: SummaryCardProps) {
  if (!documentsWithResults || documentsWithResults.length === 0) {
    return null;
  }

  const passedCount = documentsWithResults.filter(
    doc => !doc.result.error && (!doc.result.missingElements || doc.result.missingElements.length === 0)
  ).length;

  const failedCount = documentsWithResults.filter(
    doc => !doc.result.error && (doc.result.missingElements && doc.result.missingElements.length > 0)
  ).length;

  return (
    <div className={`mb-8 p-6 border rounded-2xl shadow-lg backdrop-blur-sm ${
      isDarkMode
        ? "bg-gradient-to-br from-gray-800/80 to-slate-900/80 border-gray-700/50"
        : "bg-gradient-to-br from-white/80 to-slate-50/80 border-gray-200/50"
    }`}>
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
        Validation Summary
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
        <div className={`p-4 rounded-lg ${isDarkMode ? "bg-emerald-900/50" : "bg-emerald-100/70"}`}>
          <div className="flex items-center justify-center text-emerald-500">
            <Check className="h-6 w-6 mr-2" />
            <span className={`text-2xl font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>{passedCount}</span>
          </div>
          <p className={`text-sm font-medium mt-1 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>Passed</p>
        </div>
        <div className={`p-4 rounded-lg ${isDarkMode ? "bg-red-900/50" : "bg-red-100/70"}`}>
           <div className="flex items-center justify-center text-red-500">
            <X className="h-6 w-6 mr-2" />
            <span className={`text-2xl font-bold ${isDarkMode ? "text-red-300" : "text-red-700"}`}>{failedCount}</span>
          </div>
          <p className={`text-sm font-medium mt-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>Failed</p>
        </div>
      </div>
    </div>
  );
}

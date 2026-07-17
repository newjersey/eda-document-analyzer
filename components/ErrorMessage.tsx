"use client";
/**
 * ErrorMessage.jsx
 * ----------------
 * Lightweight helper component that standardises how errors are shown
 * across the UI.  It remains invisible until an `error` string is passed
 * in via props, allowing parent components to simply render it at any
 * point in the view hierarchy without extra conditional logic.
 *
 * Props
 * -----
 * • error: string|null – when non-null the component shows the message.
 * • isDarkMode: boolean – picks the appropriate colour palette.
 */

import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  error: string | null;
  isDarkMode: boolean;
}

export default function ErrorMessage({ error, isDarkMode }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className={`mt-6 p-4 border-l-4 border-red-500 rounded-xl shadow-sm ${
      isDarkMode
        ? "bg-gradient-to-r from-red-900/30 to-pink-900/30"
        : "bg-gradient-to-r from-red-50 to-pink-50"
    }`}>
      <div className="flex items-center">
        <div className="bg-red-500 rounded-full p-1 mr-3">
          <AlertCircle className="h-4 w-4 text-white" />
        </div>
        <p className={`text-sm md:text-base font-medium ${
          isDarkMode ? "text-red-300" : "text-red-700"
        }`}>{error}</p>
      </div>
    </div>
  );
} 

"use client";

import { useState } from "react";
import { X, Copy, Check, AlertCircle, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import AnalyticsService from "../utils/analyticsService";

/**
 * EmailPreviewModal - Shows email template preview with copy functionality
 *
 * Features:
 * - Displays formatted email text in a scrollable preview
 * - Copy to clipboard button
 * - Visual feedback when copied
 * - Dark mode support
 * - Optimized width for better readability and less scrolling
 * - Internal notes for staff guidance
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} emailText - The formatted email text to display
 * @param {boolean} isDarkMode - Current theme state for styling
 * @param {object} analytics - Analytics service for tracking user interactions
 */

interface EmailPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    emailText: string;
    isDarkMode: boolean;
    analytics: AnalyticsService;
}

export default function EmailPreviewModal({
    isOpen,
    onClose,
    emailText,
    isDarkMode,
    analytics
}: EmailPreviewModalProps) {
    const [isCopied, setIsCopied] = useState(false);

    /**
     * Copies email text to clipboard and shows success feedback
     */
    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(emailText);
            setIsCopied(true);
            toast.success("Email template copied to clipboard!");
            analytics?.logEvent("email_template_copied", {
                emailLength: emailText?.length || 0
            });

            // Reset copied state after 2 seconds
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
            toast.error("Failed to copy. Please try selecting and copying manually.");
        }
    };

    /**
     * Resets state and closes modal
     */
    const handleClose = () => {
        analytics?.logEvent("email_template_closed", {
            wasCopied: isCopied
        });
        setIsCopied(false);
        onClose();
    };

    // Don"t render if modal is not open or no email text provided
    if (!isOpen || !emailText) return null;

    return (
        // Modal overlay - closes on click outside
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
        >
            {/* Modal content - prevent close on click inside */}
            <div
                className={`relative w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${
                    isDarkMode
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}>
                    <div>
                        <h2 className={`text-xl font-semibold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                        }`}>
                            Email Template Preview
                        </h2>
                        <p className={`text-sm mt-1 ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}>
                            Review the email before copying
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                                ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        }`}
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Email Preview Area */}
                <div className={`flex-1 overflow-auto p-6 ${
                    isDarkMode ? "bg-gray-900" : "bg-gray-50"
                }`}>
                    {/* Internal Note 1: Template Instructions */}
                    <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
                        isDarkMode
                            ? "bg-amber-900/20 border border-amber-800/30"
                            : "bg-amber-50 border border-amber-200"
                    }`}>
                        <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                            isDarkMode ? "text-amber-400" : "text-amber-600"
                        }`} />
                        <div className={`text-sm ${
                            isDarkMode ? "text-amber-200" : "text-amber-900"
                        }`}>
                            <strong className="block mb-1">Internal Note: Template Instructions</strong>
                            <p className="mb-2">This document serves only as a template. Please modify the template based on the following two requirements:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                                <li><strong>Product Specifications:</strong> Accurately update all placeholder fields that are enclosed in the "[ ]" to reflect your specific product specifications.</li>
                                <li><strong>Documentation Scope:</strong> The template currently only lists documents collected through the common application. You must add any product-specific documentation in need of cures.</li>
                            </ol>
                        </div>
                    </div>

                    {/* Email Template Preview */}
                    <div className={`p-6 rounded-lg font-mono text-sm whitespace-pre-wrap ${
                        isDarkMode
                            ? "bg-gray-800 text-gray-200 border border-gray-700"
                            : "bg-white text-gray-800 border border-gray-200"
                    }`}>
                        {emailText}
                    </div>

                    {/* Internal Note 2: Rejection Outcome Guidance */}
                    <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                        isDarkMode
                            ? "bg-purple-900/20 border border-purple-800/30"
                            : "bg-purple-50 border border-purple-200"
                    }`}>
                        <Info className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                            isDarkMode ? "text-purple-400" : "text-purple-600"
                        }`} />
                        <div className={`text-sm ${
                            isDarkMode ? "text-purple-200" : "text-purple-900"
                        }`}>
                            <strong className="block mb-1">Internal Note: Rejection Outcome</strong>
                            <p>"Rejected as incomplete" is the default outcome for missing required documentation. If your product specifications include another decision outcome (ex. decline or withdrawn), you should replace "rejected as incomplete" with that decision outcome. If you have any questions regarding how to select a decision outcome, please reach out to Legal Affairs for more guidance.</p>
                        </div>
                    </div>

                    {/* Reminder about placeholders */}
                    <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                        isDarkMode
                            ? "bg-blue-900/20 border border-blue-800/30"
                            : "bg-blue-50 border border-blue-200"
                    }`}>
                        <div className={`text-sm ${
                            isDarkMode ? "text-blue-300" : "text-blue-800"
                        }`}>
                            <strong>Remember to fill in:</strong> XXX Program, your name, your title, PROD â€" XXXXXXXX (if placeholder), (XX) business days, _/_/_ date, and Your Name before sending to the applicant.
                        </div>
                    </div>
                </div>

                {/* Footer with Copy Button */}
                <div className={`p-6 border-t ${
                    isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                }`}>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleClose}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                isDarkMode
                                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                            }`}
                        >
                            Close
                        </button>

                        <button
                            onClick={handleCopyToClipboard}
                            disabled={isCopied}
                            className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                isCopied
                                    ? isDarkMode
                                        ? "bg-green-600 text-white"
                                        : "bg-green-500 text-white"
                                    : isDarkMode
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                        >
                            {isCopied ? (
                                <>
                                    <Check className="h-5 w-5" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-5 w-5" />
                                    Copy Email Template
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
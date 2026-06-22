// components/Feedback.jsx
"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import toast from "react-hot-toast";
import AnalyticsService from "../utils/analyticsService";

interface FeedbackProps {
  isDarkMode: boolean;
  documentId: string;
  userId: string;
  fileName: string;
  apiKey: string;
  onNegativeFeedbackSubmit: (feedbackId: string) => Promise<void>;
  analytics: AnalyticsService;
}

export default function Feedback({ isDarkMode, documentId, userId, fileName, apiKey, onNegativeFeedbackSubmit, analytics }: FeedbackProps) {
  const [isHelpful, setIsHelpful] = useState(null); // true, false, or null
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle thumbs up click with analytics tracking
  const handleThumbsUp = (): void => {
    setIsHelpful(true);
    analytics?.logEvent("feedback_thumbs_up", {
      documentId: documentId,
      fileName: fileName
    });
  };

  // Handle thumbs down click with analytics tracking
  const handleThumbsDown = (): void => {
    setIsHelpful(false);
    analytics?.logEvent("feedback_thumbs_down", {
      documentId: documentId,
      fileName: fileName
    });
  };

  // Handle notes change with analytics tracking
  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newValue = event.target.value;
    setNotes(newValue);

    if (newValue.length > 0 && notes.length === 0) {
      analytics?.logEvent("feedback_notes_entered", {
        documentId: documentId,
        fileName: fileName
      });
    }
  };

  // Handle form submission with analytics tracking
  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (isHelpful === null) {
      toast.error("Please select thumbs up or down before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/save-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-functions-key": apiKey,
        },
        body: JSON.stringify({
          isHelpful: isHelpful,
          notes: notes,
          documentId: documentId,
          userId: userId,
          fileName: fileName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      const responseData = await response.json();
      toast.success("Feedback saved successfully!");

      analytics?.logEvent("feedback_submitted", {
        documentId: documentId,
        fileName: fileName,
        isHelpful: isHelpful,
        hasNotes: notes.length > 0,
        notesLength: notes.length
      });

      // Upload document for ALL feedback (both positive and negative)
      if (onNegativeFeedbackSubmit) {
          await onNegativeFeedbackSubmit(responseData.feedbackId);
      }
      setIsSubmitted(true);

    } catch (error) {
      console.error(error);
      toast.error("There was an error saving your feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonBaseClasses = "p-3 rounded-xl border-2 transition-transform duration-150 ease-in-out hover:scale-110";
  const buttonSelectedClasses = isDarkMode ? "bg-blue-500 border-blue-400" : "bg-blue-500 border-blue-400";
  const buttonUnselectedClasses = isDarkMode ? "bg-gray-700/50 border-gray-600 hover:border-blue-500" : "bg-gray-200/50 border-gray-300 hover:border-blue-500";

  // Show a "Thank You" message after successful submission
  if (isSubmitted) {
    return (
      <div className={`mt-8 p-6 border-t ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
        <p className={`text-center font-medium ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
          Thank you for your feedback!
        </p>
      </div>
    );
  }

  return (
    <div className={`mt-8 p-6 border rounded-2xl shadow-lg backdrop-blur-sm ${
      isDarkMode
        ? "bg-gradient-to-br from-gray-800/50 to-slate-800/50 border-gray-600"
        : "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300"
    }`}>
      <form onSubmit={handleSubmit}>
        <p className={`text-sm md:text-base font-bold mb-4 ${
          isDarkMode ? "text-gray-200" : "text-gray-800"
        }`}>Was this helpful?</p>

        <div className="flex items-center space-x-4 mb-4">
          <button
            type="button"
            onClick={handleThumbsUp}
            className={`${buttonBaseClasses} ${isHelpful === true ? buttonSelectedClasses : buttonUnselectedClasses}`}
            aria-pressed={isHelpful === true}
            disabled={isSubmitting}
          >
            <ThumbsUp className={`h-5 w-5 ${isHelpful === true ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-600"}`} />
          </button>
          <button
            type="button"
            onClick={handleThumbsDown}
            className={`${buttonBaseClasses} ${isHelpful === false ? buttonSelectedClasses : buttonUnselectedClasses}`}
            aria-pressed={isHelpful === false}
            disabled={isSubmitting}
          >
            <ThumbsDown className={`h-5 w-5 ${isHelpful === false ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-600"}`} />
          </button>
        </div>

        <div className="mt-4">
          <label htmlFor={`notes-${documentId}`} className={`block text-sm md:text-base font-bold mb-2 ${
            isDarkMode ? "text-gray-200" : "text-gray-800"
          }`}>
            Reviewer Notes
          </label>
          <textarea
            id={`notes-${documentId}`}
            value={notes}
            onChange={handleNotesChange}
            rows={4}
            placeholder="Add any additional context or comments here..."
            className={`w-full p-3 border-2 rounded-xl text-sm md:text-base shadow-inner transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              isDarkMode
                ? "bg-gray-900/50 border-gray-600 text-gray-200 placeholder-gray-500"
                : "bg-white/50 border-gray-300 text-gray-800 placeholder-gray-400"
            }`}
            disabled={isSubmitting}
          ></textarea>
        </div>

        <div className="mt-6 text-right">
          <button
            type="submit"
            className={`px-6 py-3 text-sm md:text-base font-bold rounded-xl shadow-lg transition-transform duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isDarkMode
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
            } ${isHelpful === null || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isHelpful === null || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </form>
    </div>
  );
}

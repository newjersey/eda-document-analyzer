"use client";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import AnalyticsService from "../utils/analyticsService";

interface ContactFormProps {
  userId: string;
  sessionId: string;
  analytics: AnalyticsService;
}

// Revised Logic: Accept sessionId as a prop
export const ContactForm = ({ userId, sessionId, analytics }: ContactFormProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Revised Logic: Check for sessionId before submitting
    if (!email || !userId || !sessionId) {
      toast.error("Could not submit contact info. Please try refreshing the page.");
      return;
    }

    try {
      analytics?.logEvent("contact_email_submitted", {
        hasEmail: !!email
      });

      const response = await fetch("/api/save-contact-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Revised Logic: Include sessionId in the payload
        body: JSON.stringify({ userId, sessionId, email }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit contact info.");
      }

      toast.success("Thank you! Your contact info has been saved.");
      setIsSubmitted(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-4 border rounded-lg bg-green-50 border-green-200">
        <p className="text-green-800 font-medium">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-slate-50">
      <p className="text-sm font-medium text-gray-700 mb-3">
        Share your email for follow-up (optional)
      </p>

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            const newValue = e.target.value;
            setEmail(newValue);
            if (newValue.length > 0 && email.length === 0) {
              analytics?.logEvent("contact_email_entered", {});
            }
          }}
          placeholder="your.email@njeda.com"
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
        />
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

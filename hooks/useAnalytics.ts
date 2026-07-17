/**
 * useAnalytics Hook
 * Custom React hook that provides easy access to analytics tracking
 * Automatically initializes and cleans up the analytics service
 */

import { useState, useEffect } from "react";
import AnalyticsService from "../utils/analyticsService";

/**
 * Hook to access analytics service
 * Initializes analytics on mount and cleans up on unmount
 * 
 * @param {string} userId - Anonymous user ID from localStorage
 * @returns {Object} Analytics service instance
 * 
 * Usage:
 * const analytics = useAnalytics(userId);
 * analytics.logEvent(EVENTS.FILE_UPLOAD_LOCAL, { fileName: "test.pdf" });
 */
export function useAnalytics(userId) {
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        if (!userId) {
            return;
        }

        // Create analytics instance
        const analyticsService = new AnalyticsService(userId);
        
        // Initialize analytics (creates session, sets up listeners)
        analyticsService.initialize();
        
        // Set analytics state (triggers re-render with analytics available)
        setAnalytics(analyticsService);

        // Cleanup on unmount
        return () => {
            if (analyticsService) {
                analyticsService.endSession("component_unmount");
            }
        };
    }, [userId]);

    return analytics;
}

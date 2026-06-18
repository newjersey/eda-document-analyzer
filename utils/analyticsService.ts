/**
 * Analytics Service
 * Centralized service for tracking all user interactions and events
 * Manages session lifecycle, tab visibility, and event logging
 */

import { v4 as uuidv4 } from "uuid";
import { AnalyticsEvent, EVENTS } from "./analyticsEvents";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const ANALYTICS_API_KEY = process.env.NEXT_PUBLIC_ANALYTICS_API_KEY;

// Session timeout: 30 minutes of inactivity
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

interface TabHiddenEventMetaData {
    switchNumber: number;
    timeOnPageBeforeSwitch: number;
}

interface TabVisibleEventMetaData {
    returnNumber: number;
    durationAwaySeconds: number;
}

interface StartValidationEventMetaData {
    validationId: string;
    validationNumber: number;
}

interface ValidationCompletedEventMetaData {
    validationId: string;
    documentCount: number;
    passCount: number;
    failCount: number;
    errorCount: number;
}

interface SessionEndEventMetaData {
    endReason: string;
    totalTimeSeconds: number;
    activeTimeSeconds: number;
}

interface ContactEmailSubmittedMetaData {
    hasEmail: boolean;
}

type EventMetaData = TabHiddenEventMetaData
| TabVisibleEventMetaData
| StartValidationEventMetaData
| ValidationCompletedEventMetaData
| SessionEndEventMetaData
| ContactEmailSubmittedMetaData
| {};

// ---------------------------------------------------------------------------
// Validation types
// ---------------------------------------------------------------------------

interface DocumentResult {
  error?: string;
  success?: boolean;
  passedChecks?: string[];
  missingElements?: string[];
}

interface ValidatedDocument {
  file: File;
  type: string;
  detectedCategory?: string;
  result?: DocumentResult;
}

interface FormFields {
  organizationName?: string;
  fein?: string;
}

interface DocumentDetail {
  fileName: string;
  documentType: string;
  detectedCategory: string | null;
  wasAutoDetected: boolean;
  userChangedType: boolean;
  success: boolean;
  passedChecksCount: number;
  failedChecksCount: number;
  hasError: boolean;
}

// ---------------------------------------------------------------------------
// Session types
// ---------------------------------------------------------------------------

interface SessionEndData {
  userId: string;
  sessionId: string;
  sessionEnd: string;
  lastActivity: string;
  totalTimeSeconds: number;
  activeTimeSeconds: number;
  validationCount: number;
  tabSwitchCount: number;
  tabReturnCount: number;
  totalTimeAwaySeconds: number;
  averageTimeAwaySeconds: number;
  longestTimeAwaySeconds: number;
  shortestTimeAwaySeconds: number;
  bounced: boolean;
  switchedAwayWithoutReturn: boolean;
  endReason: string;
}

interface ValidationData {
  userId: string;
  sessionId: string;
  validationId: string;
  timestamp: string;
  documentCount: number;
  documentTypes: string[];
  passCount: number;
  failCount: number;
  errorCount: number;
  organizationName: string | null;
  fein: string | null;
  documents: DocumentDetail[];
}


/**
 * AnalyticsService Class
 * Handles all analytics tracking including sessions, events, validations, and tab visibility
 */
class AnalyticsService {
    private userId: string;
    private sessionId: string | null;
    private sessionStartTime: number | null;
    private lastActivityTime: number | null;
    private currentValidationId: string | null;
    private validationCounter: number;

    // Tab visibility tracking
    private isTabVisible: boolean;
    private lastTabHiddenTime: number | null;
    private activeTimeInSeconds: number;
    private lastActiveTimestamp: number;
    private tabSwitchCount: number;
    private tabReturnCount: number;
    private timesAwayList: number[];

    // Session timeout timer
    private sessionTimeoutTimer: ReturnType<typeof setTimeout> | null;

    constructor(userId: string) {
        this.userId = userId;
        this.sessionId = null;
        this.sessionStartTime = null;
        this.lastActivityTime = null;
        this.currentValidationId = null;
        this.validationCounter = 0;

        // Tab visibility tracking
        this.isTabVisible = true;
        this.lastTabHiddenTime = null;
        this.activeTimeInSeconds = 0;
        this.lastActiveTimestamp = Date.now();
        this.tabSwitchCount = 0;
        this.tabReturnCount = 0;
        this.timesAwayList = []; // Track each period away

        // Session timeout timer
        this.sessionTimeoutTimer = null;

        // Bind methods to maintain context
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
        this.resetActivityTimer = this.resetActivityTimer.bind(this);
    }

    /**
     * Initialize the analytics service
     * Creates a new session and sets up event listeners
     */
    async initialize() {
        if (!this.userId) {
            console.error("Analytics: userId is required for initialization");
            return;
        }

        // Generate session ID
        this.sessionId = uuidv4();
        this.sessionStartTime = Date.now();
        this.lastActivityTime = Date.now();
        this.lastActiveTimestamp = Date.now();

        // Create session in backend
        await this.createSession();

        // Set up tab visibility listener
        document.addEventListener("visibilitychange", this.handleVisibilityChange);

        // Set up beforeunload listener to end session gracefully
        window.addEventListener("beforeunload", this.handleBeforeUnload);

        // Set up activity timer
        this.startActivityTimer();

        // Track page load event
        await this.trackEvent(EVENTS.PAGE_LOAD);

        console.log("Analytics initialized:", { userId: this.userId, sessionId: this.sessionId });
    }

    /**
     * Create a new session record in the backend
     */
    async createSession() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/create-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-functions-key": ANALYTICS_API_KEY
                },
                body: JSON.stringify({
                    userId: this.userId,
                    sessionId: this.sessionId,
                    sessionStart: new Date(this.sessionStartTime).toISOString()
                })
            });

            if (!response.ok) {
                console.error("Failed to create session:", response.statusText);
            }
        } catch (error) {
            console.error("Error creating session:", error);
        }
    }

    /**
     * Handle tab visibility changes
     * Tracks when user switches away and returns
     */
    handleVisibilityChange() {
        const now = Date.now();

        if (document.hidden) {
            // User switched away from tab
            this.isTabVisible = false;
            this.lastTabHiddenTime = now;

            // Update active time before switching
            this.activeTimeInSeconds += (now - this.lastActiveTimestamp) / 1000;

            this.tabSwitchCount++;

            // Track tab hidden event
            this.trackEvent(EVENTS.TAB_HIDDEN, {
                switchNumber: this.tabSwitchCount,
                timeOnPageBeforeSwitch: Math.round((now - this.sessionStartTime) / 1000)
            } as TabHiddenEventMetaData);

        } else {
            // User returned to tab
            this.isTabVisible = true;
            const durationAway = this.lastTabHiddenTime ? (now - this.lastTabHiddenTime) / 1000 : 0;

            if (this.lastTabHiddenTime) {
                this.tabReturnCount++;
                this.timesAwayList.push(durationAway);
            }

            // Resume active time counting
            this.lastActiveTimestamp = now;

            // Track tab visible event
            this.trackEvent(EVENTS.TAB_VISIBLE, {
                returnNumber: this.tabReturnCount,
                durationAwaySeconds: Math.round(durationAway)
            } as TabVisibleEventMetaData);

            // Reset activity timer
            this.resetActivityTimer();
        }
    }

    /**
     * Handle page unload (tab close or navigation away)
     * Ends the session gracefully
     */
    handleBeforeUnload() {
        // Send synchronous request to end session
        // Using sendBeacon for guaranteed delivery even as page unloads
        const endData = {
            userId: this.userId,
            sessionId: this.sessionId,
            endReason: "tab_closed"
        };

        const blob = new Blob([JSON.stringify(endData)], { type: "application/json" });
        navigator.sendBeacon(`${API_BASE_URL}/api/end-session`, blob);
    }

    /**
     * Start or reset the inactivity timer
     * If user is inactive for 30 minutes, session ends automatically
     */
    startActivityTimer() {
        this.resetActivityTimer();
    }

    resetActivityTimer() {
        // Clear existing timer
        if (this.sessionTimeoutTimer) {
            clearTimeout(this.sessionTimeoutTimer);
        }

        // Set new timer
        this.sessionTimeoutTimer = setTimeout(() => {
            this.endSession("inactivity_timeout");
        }, SESSION_TIMEOUT_MS);
    }

    /**
     * Track a generic event
     * @param {AnalyticsEvent} event - Event object from EVENTS registry
     * @param {Object} metadata - Additional event-specific data
     */
    async trackEvent(event: AnalyticsEvent, metadata?: EventMetaData) {
        if (!this.sessionId) {
            console.warn("Analytics: Cannot track event, session not initialized");
            return;
        }
        console.log(`Analytics Event: ${event.name}`, metadata);

        // Update last activity time
        this.lastActivityTime = Date.now();
        this.resetActivityTimer();

        // If tab is visible, update active time
        if (this.isTabVisible) {
            const now = Date.now();
            this.activeTimeInSeconds += (now - this.lastActiveTimestamp) / 1000;
            this.lastActiveTimestamp = now;
        }

        const eventData = {
            userId: this.userId,
            sessionId: this.sessionId,
            eventType: event.name,
            category: event.category,
            timestamp: new Date().toISOString(),
            metadata: {
                ...metadata,
                validationId: this.currentValidationId // Auto-attach current validation if exists
            }
        };

        try {
            // Send to custom events table
            const response = await fetch(`${API_BASE_URL}/api/log-event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-functions-key": ANALYTICS_API_KEY
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                console.error("Failed to log event:", event.name, response.statusText);
            }

            // TODO: Also send to Application Insights if needed (future enhancement)
            // if (shouldTrackInAppInsights(event)) {
            //     appInsights.trackEvent({ name: event.name, properties: metadata });
            // }

        } catch (error) {
            console.error("Error tracking event:", event.name, error);
        }
    }
    /**
     * Alias for trackEvent to maintain compatibility
     * Accepts event name as string instead of event object
     * @param {string} eventName - Name of the event
     * @param {Object} eventData - Event metadata
     */
    async logEvent(eventName: string, eventData?: EventMetaData) {
        // Find event definition from EVENTS registry
        const event = Object.values(EVENTS).find(e => e.name === eventName);

        if (!event) {
            console.warn(`Analytics: Unknown event "${eventName}"`);
            // Create a temporary event object
            return this.trackEvent({
                name: eventName,
                category: "custom",
                description: ""
            }, eventData);
        }

        return this.trackEvent(event, eventData);
    }
    /**
     * Start a new validation attempt
     * Generates a unique validation ID and tracks the start event
     */
    startValidation() {
        this.validationCounter++;
        this.currentValidationId = `val-${String(this.validationCounter).padStart(3, "0")}`;

        this.trackEvent(EVENTS.VALIDATION_STARTED, {
            validationId: this.currentValidationId,
            validationNumber: this.validationCounter
        } as StartValidationEventMetaData);

        return this.currentValidationId;
    }

    /**
     * Log validation completion with detailed results
     * @param {Array} documents - Array of validated documents with results
     * @param {FormFields} formFields - Organization name and FEIN from form
     */
    async logValidation(documents: ValidatedDocument[], formFields: FormFields) {
        if (!this.currentValidationId) {
            console.error("Analytics: No active validation to log");
            return;
        }

        // Calculate validation statistics
        const passCount = documents.filter(d => !d.result?.error && d.result?.success).length;
        const failCount = documents.filter(d => !d.result?.error && !d.result?.success).length;
        const errorCount = documents.filter(d => d.result?.error).length;

        // Build document details array
        const documentDetails: DocumentDetail[] = documents.map(doc => ({
            fileName: doc.file.name,
            documentType: doc.type,
            detectedCategory: doc.detectedCategory || null,
            wasAutoDetected: !!doc.detectedCategory,
            userChangedType: false, // TODO: Track if user manually changed type
            success: !doc.result?.error && doc.result?.success,
            passedChecksCount: doc.result?.passedChecks?.length || 0,
            failedChecksCount: doc.result?.missingElements?.length || 0,
            hasError: !!doc.result?.error
        }));

        // Extract document types
        const documentTypes = documents.map(doc => doc.type);

        const validationData: ValidationData = {
            userId: this.userId,
            sessionId: this.sessionId,
            validationId: this.currentValidationId,
            timestamp: new Date().toISOString(),
            documentCount: documents.length,
            documentTypes: documentTypes,
            passCount: passCount,
            failCount: failCount,
            errorCount: errorCount,
            organizationName: formFields.organizationName || null,
            fein: formFields.fein || null,
            documents: documentDetails
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/log-validation`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-functions-key": ANALYTICS_API_KEY
                },
                body: JSON.stringify(validationData)
            });

            if (!response.ok) {
                console.error("Failed to log validation:", response.statusText);
            }

            // Track validation completed event
            await this.trackEvent(EVENTS.VALIDATION_COMPLETED, {
                validationId: this.currentValidationId,
                documentCount: documents.length,
                passCount: passCount,
                failCount: failCount,
                errorCount: errorCount
            } as ValidationCompletedEventMetaData);

        } catch (error) {
            console.error("Error logging validation:", error);
        }
    }

    /**
     * End the current session
     * Updates session with final statistics and aggregates
     * @param {string} endReason - Reason for session ending ("tab_closed", "inactivity_timeout", etc.)
     */
    async endSession(endReason: string = "unknown") {
        if (!this.sessionId) {
            return;
        }

        // Calculate final active time
        if (this.isTabVisible) {
            const now = Date.now();
            this.activeTimeInSeconds += (now - this.lastActiveTimestamp) / 1000;
        }

        // Calculate total time
        const totalTimeSeconds = Math.round((Date.now() - this.sessionStartTime) / 1000);

        // Calculate time away statistics
        const totalTimeAwaySeconds = this.timesAwayList.reduce((sum, time) => sum + time, 0);
        const averageTimeAwaySeconds = this.timesAwayList.length > 0
            ? totalTimeAwaySeconds / this.timesAwayList.length
            : 0;
        const longestTimeAwaySeconds = this.timesAwayList.length > 0
            ? Math.max(...this.timesAwayList)
            : 0;
        const shortestTimeAwaySeconds = this.timesAwayList.length > 0
            ? Math.min(...this.timesAwayList)
            : 0;

        // Check for bounce conditions
        const bounced = totalTimeSeconds < 10;
        const switchedAwayWithoutReturn = this.tabSwitchCount > this.tabReturnCount;

        const sessionEndData: SessionEndData = {
            userId: this.userId,
            sessionId: this.sessionId,
            sessionEnd: new Date().toISOString(),
            lastActivity: new Date(this.lastActivityTime).toISOString(),
            totalTimeSeconds: totalTimeSeconds,
            activeTimeSeconds: Math.round(this.activeTimeInSeconds),
            validationCount: this.validationCounter,
            tabSwitchCount: this.tabSwitchCount,
            tabReturnCount: this.tabReturnCount,
            totalTimeAwaySeconds: Math.round(totalTimeAwaySeconds),
            averageTimeAwaySeconds: Math.round(averageTimeAwaySeconds),
            longestTimeAwaySeconds: Math.round(longestTimeAwaySeconds),
            shortestTimeAwaySeconds: Math.round(shortestTimeAwaySeconds),
            bounced: bounced,
            switchedAwayWithoutReturn: switchedAwayWithoutReturn,
            endReason: endReason
        };

        try {
            // Track session end event
            await this.trackEvent(EVENTS.SESSION_END, {
                endReason: endReason,
                totalTimeSeconds: totalTimeSeconds,
                activeTimeSeconds: Math.round(this.activeTimeInSeconds)
            } as SessionEndEventMetaData);

            // Update session record with final data
            const response = await fetch(`${API_BASE_URL}/api/update-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-functions-key": ANALYTICS_API_KEY
                },
                body: JSON.stringify(sessionEndData)
            });

            if (!response.ok) {
                console.error("Failed to end session:", response.statusText);
            }

        } catch (error) {
            console.error("Error ending session:", error);
        }

        // Clean up event listeners
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        window.removeEventListener("beforeunload", this.handleBeforeUnload);

        if (this.sessionTimeoutTimer) {
            clearTimeout(this.sessionTimeoutTimer);
        }

        console.log("Session ended:", { sessionId: this.sessionId, reason: endReason });
    }

    /**
     * Update session with email when user provides it
     * @param {string} email - User"s email address
     */
    async updateSessionEmail(email: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/update-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-functions-key": ANALYTICS_API_KEY
                },
                body: JSON.stringify({
                    userId: this.userId,
                    sessionId: this.sessionId,
                    email: email
                })
            });

            if (!response.ok) {
                console.error("Failed to update session with email:", response.statusText);
            }
        } catch (error) {
            console.error("Error updating session email:", error);
        }
    }
}

export default AnalyticsService;

/**
 * Analytics Events Registry
 * Complete catalog of all trackable user actions and system events
 * Organized by category for maintainability and extensibility
 */

/**
 * Event categories for grouping related events
 * Makes it easy to filter and analyze events by type
 */
export const EVENT_CATEGORIES = {
    SESSION: "session",
    FILE_MANAGEMENT: "file_management",
    DOCUMENT_TYPE: "document_type",
    VALIDATION: "validation",
    RESULTS: "results",
    PREVIEW: "preview",
    PDF: "pdf",
    EMAIL: "email",
    FEEDBACK: "feedback",
    CONTACT: "contact",
    SHAREPOINT: "sharepoint",
    GUIDANCE: "guidance",
    CUSTOM: "custom"
} as const;

/**
 * Complete registry of all events that can be tracked
 * Each event has a category and name for consistent tracking
 *
 * Usage: analytics.trackEvent(EVENTS.FILE_UPLOAD_LOCAL, { fileName: "test.pdf" })
 */

export interface AnalyticsEvent {
  category: typeof EVENT_CATEGORIES[keyof typeof EVENT_CATEGORIES];
  name: string;
  description: string;
}

type EventType =
| "PAGE_LOAD"
| "TAB_HIDDEN"
| "TAB_VISIBLE"
| "SESSION_END"
| "FILE_UPLOAD_LOCAL"
| "FILE_UPLOAD_SHAREPOINT"
| "FILE_REMOVED"
| "DOCUMENT_TYPE_AUTO_DETECTED"
| "DOCUMENT_TYPE_MANUALLY_SELECTED"
| "DOCUMENT_TYPE_CHANGED"
| "SHAREPOINT_MODAL_OPENED"
| "SHAREPOINT_SEARCH_PERFORMED"
| "SHAREPOINT_SEARCH_RESULTS"
| "SHAREPOINT_FOLDER_OPENED"
| "SHAREPOINT_BACK_CLICKED"
| "SHAREPOINT_FILE_SELECTED"
| "SHAREPOINT_ADD_FILES_CLICKED"
| "SHAREPOINT_FILES_ADDED"
| "SHAREPOINT_MODAL_CLOSED"
| "VALIDATION_STARTED"
| "VALIDATION_COMPLETED"
| "RESULT_CARD_EXPANDED"
| "RESULT_CARD_COLLAPSED"
| "DOCUMENT_PREVIEW_OPENED"
| "DOCUMENT_PREVIEW_CLOSED"
| "PDF_DOWNLOAD_CLICKED"
| "EMAIL_TEMPLATE_OPENED"
| "EMAIL_TEMPLATE_COPIED"
| "EMAIL_TEMPLATE_CLOSED"
| "FEEDBACK_THUMBS_UP"
| "FEEDBACK_THUMBS_DOWN"
| "FEEDBACK_NOTES_ENTERED"
| "FEEDBACK_SUBMITTED"
| "CONTACT_EMAIL_ENTERED"
| "CONTACT_EMAIL_SUBMITTED"
| "GUIDANCE_OPENED"
| "GUIDANCE_CLOSED"
| "GUIDANCE_SAMPLE_VIEWED";

export const EVENTS: Record<EventType, AnalyticsEvent> = {
    // Session lifecycle events
    PAGE_LOAD: {
        category: EVENT_CATEGORIES.SESSION,
        name: "page_load",
        description: "User loads the document validator page"
    },
    TAB_HIDDEN: {
        category: EVENT_CATEGORIES.SESSION,
        name: "tab_hidden",
        description: "User switches away from the tool to another tab/window"
    },
    TAB_VISIBLE: {
        category: EVENT_CATEGORIES.SESSION,
        name: "tab_visible",
        description: "User returns to the tool after switching away"
    },
    SESSION_END: {
        category: EVENT_CATEGORIES.SESSION,
        name: "session_end",
        description: "Session ends due to tab close or inactivity timeout"
    },

    // File management events
    FILE_UPLOAD_LOCAL: {
        category: EVENT_CATEGORIES.FILE_MANAGEMENT,
        name: "file_upload_local",
        description: "User uploads file from local computer (browse or drag-drop)"
    },
    FILE_UPLOAD_SHAREPOINT: {
        category: EVENT_CATEGORIES.FILE_MANAGEMENT,
        name: "file_upload_sharepoint",
        description: "User adds file from SharePoint"
    },
    FILE_REMOVED: {
        category: EVENT_CATEGORIES.FILE_MANAGEMENT,
        name: "file_removed",
        description: "User removes a file from the upload list"
    },

    // Document type selection events
    DOCUMENT_TYPE_AUTO_DETECTED: {
        category: EVENT_CATEGORIES.DOCUMENT_TYPE,
        name: "document_type_auto_detected",
        description: "System auto-detects document type from filename"
    },
    DOCUMENT_TYPE_MANUALLY_SELECTED: {
        category: EVENT_CATEGORIES.DOCUMENT_TYPE,
        name: "document_type_manually_selected",
        description: "User manually selects document type from dropdown"
    },
    DOCUMENT_TYPE_CHANGED: {
        category: EVENT_CATEGORIES.DOCUMENT_TYPE,
        name: "document_type_changed",
        description: "User changes document type (overrides auto-detection or previous selection)"
    },

    // SharePoint interaction events
    SHAREPOINT_MODAL_OPENED: {
        category: EVENT_CATEGORIES.SHAREPOINT,
        name: "sharepoint_modal_opened",
        description: "User clicks 'Add from SharePoint' button"
    },
    SHAREPOINT_SEARCH_PERFORMED: {
        category: EVENT_CATEGORIES.SHAREPOINT,
        name: "sharepoint_search_performed",
        description: "User searches for project in SharePoint"
    },
    SHAREPOINT_SEARCH_RESULTS: {
        category: EVENT_CATEGORIES.SHAREPOINT,
        name: "sharepoint_search_results",
        description: "Search returns results (tracks result count and composition)"
    },
    SHAREPOINT_FOLDER_OPENED: {
        category: EVENT_CATEGORIES.SHAREPOINT,
        name: "sharepoint_folder_opened",
        description: "User clicks on a folder to navigate into it"
    },
    SHAREPOINT_BACK_CLICKED: {
        category: EVENT_CATEGORIES.SHAREPOINT,
        name: "sharepoint_back_clicked",
        description: "User clicks back button to return to previous view"
    },
    SHAREPOINT_FILE_SELECTED: {
        category: EVENT_CATEGORIES.SHAREPOINT,
        name: "sharepoint_file_selected",
        description: "User checks a file to add it"
    },
    SHAREPOINT_ADD_FILES_CLICKED: {
        category: EVENT_CATEGORIES.SHAREPOINT,
        name: "sharepoint_add_files_clicked",
        description: "User clicks 'Add Files' button to start download process"
    },
    SHAREPOINT_FILES_ADDED: {
        category: EVENT_CATEGORIES.SHAREPOINT,
        name: "sharepoint_files_added",
        description: "User clicks 'Add Files' to confirm selection"
    },
    SHAREPOINT_MODAL_CLOSED: {
        category: EVENT_CATEGORIES.SHAREPOINT,
        name: "sharepoint_modal_closed",
        description: "User closes SharePoint modal (with or without adding files)"
    },

    // Validation events
    VALIDATION_STARTED: {
        category: EVENT_CATEGORIES.VALIDATION,
        name: "validation_started",
        description: "User clicks 'Validate Document' button"
    },
    VALIDATION_COMPLETED: {
        category: EVENT_CATEGORIES.VALIDATION,
        name: "validation_completed",
        description: "Validation process finishes and results are displayed"
    },

    // Results interaction events
    RESULT_CARD_EXPANDED: {
        category: EVENT_CATEGORIES.RESULTS,
        name: "result_card_expanded",
        description: "User expands a document result card to see details"
    },
    RESULT_CARD_COLLAPSED: {
        category: EVENT_CATEGORIES.RESULTS,
        name: "result_card_collapsed",
        description: "User collapses a document result card"
    },

    // Document preview events
    DOCUMENT_PREVIEW_OPENED: {
        category: EVENT_CATEGORIES.PREVIEW,
        name: "document_preview_opened",
        description: "User clicks to preview a document"
    },
    DOCUMENT_PREVIEW_CLOSED: {
        category: EVENT_CATEGORIES.PREVIEW,
        name: "document_preview_closed",
        description: "User closes the document preview modal"
    },

    // PDF report events
    PDF_DOWNLOAD_CLICKED: {
        category: EVENT_CATEGORIES.PDF,
        name: "pdf_download_clicked",
        description: "User clicks to download PDF report of validation results"
    },

    // Email template events
    EMAIL_TEMPLATE_OPENED: {
        category: EVENT_CATEGORIES.EMAIL,
        name: "email_template_opened",
        description: "User clicks to view email template"
    },
    EMAIL_TEMPLATE_COPIED: {
        category: EVENT_CATEGORIES.EMAIL,
        name: "email_template_copied",
        description: "User copies email template to clipboard"
    },
    EMAIL_TEMPLATE_CLOSED: {
        category: EVENT_CATEGORIES.EMAIL,
        name: "email_template_closed",
        description: "User closes email template modal"
    },

    // Feedback events
    FEEDBACK_THUMBS_UP: {
        category: EVENT_CATEGORIES.FEEDBACK,
        name: "feedback_thumbs_up",
        description: "User clicks thumbs up on a validation result"
    },
    FEEDBACK_THUMBS_DOWN: {
        category: EVENT_CATEGORIES.FEEDBACK,
        name: "feedback_thumbs_down",
        description: "User clicks thumbs down on a validation result"
    },
    FEEDBACK_NOTES_ENTERED: {
        category: EVENT_CATEGORIES.FEEDBACK,
        name: "feedback_notes_entered",
        description: "User types notes in feedback form"
    },
    FEEDBACK_SUBMITTED: {
        category: EVENT_CATEGORIES.FEEDBACK,
        name: "feedback_submitted",
        description: "User submits feedback (thumbs up/down + optional notes)"
    },

    // Contact form events
    CONTACT_EMAIL_ENTERED: {
        category: EVENT_CATEGORIES.CONTACT,
        name: "contact_email_entered",
        description: "User enters email address in contact form"
    },
    CONTACT_EMAIL_SUBMITTED: {
        category: EVENT_CATEGORIES.CONTACT,
        name: "contact_email_submitted",
        description: "User submits email address"
    },
    // Guidance section events
    GUIDANCE_OPENED: {
        category: EVENT_CATEGORIES.GUIDANCE,
        name: "guidance_opened",
        description: "User expands the document selection guidance section"
    },
    GUIDANCE_CLOSED: {
        category: EVENT_CATEGORIES.GUIDANCE,
        name: "guidance_closed",
        description: "User collapses the document selection guidance section"
    },
    GUIDANCE_SAMPLE_VIEWED: {
        category: EVENT_CATEGORIES.GUIDANCE,
        name: "guidance_sample_viewed",
        description: "User clicks View Sample link for a document type"
    }
};

/**
 * Helper function to get all events in a specific category
 * Useful for filtering or analyzing events by type
 *
 * @param {string} category - Category name from EVENT_CATEGORIES
 * @returns {Array} Array of event objects in that category
 */
export function getEventsByCategory(category: string): AnalyticsEvent[] {
    return Object.values(EVENTS).filter(event => event.category === category);
}

/**
 * Helper function to check if an event should be tracked in Application Insights
 * Only high-level events are sent to App Insights to reduce costs
 * All events are always sent to custom tables
 *
 * @param {AnalyticsEvent} event - Event object from EVENTS
 * @returns {boolean} True if event should be tracked in App Insights
 */
export function shouldTrackInAppInsights(event: AnalyticsEvent): boolean {
    const majorEvents = [
        "page_load",
        "validation_started",
        "validation_completed",
        "session_end"
    ];
    return majorEvents.includes(event.name);
}

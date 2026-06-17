import {
  type AnalyticsEvent,
  EVENT_CATEGORIES,
  EVENTS,
  getEventsByCategory,
  shouldTrackInAppInsights,
} from "../../utils/analyticsEvents";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const allEvents = Object.values(EVENTS);
const allEventKeys = Object.keys(EVENTS);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("analyticsEvents", () => {
  // -------------------------------------------------------------------------
  // EVENT_CATEGORIES
  // -------------------------------------------------------------------------
  describe("EVENT_CATEGORIES", () => {
    it("contains all expected category keys", () => {
      const expectedKeys = [
        "SESSION",
        "FILE_MANAGEMENT",
        "DOCUMENT_TYPE",
        "VALIDATION",
        "RESULTS",
        "PREVIEW",
        "PDF",
        "EMAIL",
        "FEEDBACK",
        "CONTACT",
        "SHAREPOINT",
        "GUIDANCE",
        "CUSTOM",
      ];
      expect(Object.keys(EVENT_CATEGORIES)).toEqual(expect.arrayContaining(expectedKeys));
    });

    it("has lowercase string values", () => {
      for (const value of Object.values(EVENT_CATEGORIES)) {
        expect(value).toBe(value.toLowerCase());
      }
    });

    it("has no duplicate values", () => {
      const values = Object.values(EVENT_CATEGORIES);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });

  // -------------------------------------------------------------------------
  // EVENTS registry — structural integrity
  // -------------------------------------------------------------------------
  describe("EVENTS registry", () => {
    it("contains at least one event", () => {
      expect(allEvents.length).toBeGreaterThan(0);
    });

    it("every event has a non-empty name", () => {
      for (const event of allEvents) {
        expect(event.name).toBeTruthy();
        expect(typeof event.name).toBe("string");
      }
    });

    it("every event has a non-empty description", () => {
      for (const event of allEvents) {
        expect(event.description).toBeTruthy();
        expect(typeof event.description).toBe("string");
      }
    });

    it("every event has a category that exists in EVENT_CATEGORIES", () => {
      const validCategories = Object.values(EVENT_CATEGORIES) as string[];
      for (const event of allEvents) {
        expect(validCategories).toContain(event.category);
      }
    });

    it("event names are lowercase with underscores only", () => {
      for (const event of allEvents) {
        expect(event.name).toMatch(/^[a-z_]+$/);
      }
    });

    it("has no duplicate event names", () => {
      const names = allEvents.map((e) => e.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });

    it("has no duplicate event keys", () => {
      const unique = new Set(allEventKeys);
      expect(unique.size).toBe(allEventKeys.length);
    });
  });

  // -------------------------------------------------------------------------
  // EVENTS registry — specific event spot-checks
  // -------------------------------------------------------------------------
  describe("EVENTS spot-checks", () => {
    it("PAGE_LOAD is in the session category", () => {
      expect(EVENTS.PAGE_LOAD.category).toBe(EVENT_CATEGORIES.SESSION);
      expect(EVENTS.PAGE_LOAD.name).toBe("page_load");
    });

    it("VALIDATION_STARTED is in the validation category", () => {
      expect(EVENTS.VALIDATION_STARTED.category).toBe(EVENT_CATEGORIES.VALIDATION);
      expect(EVENTS.VALIDATION_STARTED.name).toBe("validation_started");
    });

    it("VALIDATION_COMPLETED is in the validation category", () => {
      expect(EVENTS.VALIDATION_COMPLETED.category).toBe(EVENT_CATEGORIES.VALIDATION);
      expect(EVENTS.VALIDATION_COMPLETED.name).toBe("validation_completed");
    });

    it("SESSION_END is in the session category", () => {
      expect(EVENTS.SESSION_END.category).toBe(EVENT_CATEGORIES.SESSION);
      expect(EVENTS.SESSION_END.name).toBe("session_end");
    });

    it("TAB_HIDDEN is in the session category", () => {
      expect(EVENTS.TAB_HIDDEN.category).toBe(EVENT_CATEGORIES.SESSION);
      expect(EVENTS.TAB_HIDDEN.name).toBe("tab_hidden");
    });

    it("TAB_VISIBLE is in the session category", () => {
      expect(EVENTS.TAB_VISIBLE.category).toBe(EVENT_CATEGORIES.SESSION);
      expect(EVENTS.TAB_VISIBLE.name).toBe("tab_visible");
    });

    it("CONTACT_EMAIL_SUBMITTED is in the contact category", () => {
      expect(EVENTS.CONTACT_EMAIL_SUBMITTED.category).toBe(EVENT_CATEGORIES.CONTACT);
      expect(EVENTS.CONTACT_EMAIL_SUBMITTED.name).toBe("contact_email_submitted");
    });

    it("CONTACT_EMAIL_ENTERED is in the contact category", () => {
      expect(EVENTS.CONTACT_EMAIL_ENTERED.category).toBe(EVENT_CATEGORIES.CONTACT);
      expect(EVENTS.CONTACT_EMAIL_ENTERED.name).toBe("contact_email_entered");
    });

    it("FEEDBACK_SUBMITTED is in the feedback category", () => {
      expect(EVENTS.FEEDBACK_SUBMITTED.category).toBe(EVENT_CATEGORIES.FEEDBACK);
      expect(EVENTS.FEEDBACK_SUBMITTED.name).toBe("feedback_submitted");
    });

    it("PDF_DOWNLOAD_CLICKED is in the pdf category", () => {
      expect(EVENTS.PDF_DOWNLOAD_CLICKED.category).toBe(EVENT_CATEGORIES.PDF);
      expect(EVENTS.PDF_DOWNLOAD_CLICKED.name).toBe("pdf_download_clicked");
    });
  });

  // -------------------------------------------------------------------------
  // getEventsByCategory()
  // -------------------------------------------------------------------------
  describe("getEventsByCategory()", () => {
    it("returns only events matching the given category", () => {
      const results = getEventsByCategory(EVENT_CATEGORIES.SESSION);
      for (const event of results) {
        expect(event.category).toBe(EVENT_CATEGORIES.SESSION);
      }
    });

    it("returns all session events", () => {
      const results = getEventsByCategory(EVENT_CATEGORIES.SESSION);
      const names = results.map((e) => e.name);
      expect(names).toContain("page_load");
      expect(names).toContain("session_end");
      expect(names).toContain("tab_hidden");
      expect(names).toContain("tab_visible");
    });

    it("returns all validation events", () => {
      const results = getEventsByCategory(EVENT_CATEGORIES.VALIDATION);
      const names = results.map((e) => e.name);
      expect(names).toContain("validation_started");
      expect(names).toContain("validation_completed");
    });

    it("returns all contact events", () => {
      const results = getEventsByCategory(EVENT_CATEGORIES.CONTACT);
      const names = results.map((e) => e.name);
      expect(names).toContain("contact_email_entered");
      expect(names).toContain("contact_email_submitted");
    });

    it("returns an empty array for an unknown category", () => {
      expect(getEventsByCategory("nonexistent_category")).toEqual([]);
    });

    it("returns an empty array for the CUSTOM category since no events use it", () => {
      expect(getEventsByCategory(EVENT_CATEGORIES.CUSTOM)).toEqual([]);
    });

    it("the sum of all category results equals the total number of events", () => {
      const categoryCounts = Object.values(EVENT_CATEGORIES).reduce(
        (total, category) => total + getEventsByCategory(category).length,
        0,
      );
      expect(categoryCounts).toBe(allEvents.length);
    });
  });

  // -------------------------------------------------------------------------
  // shouldTrackInAppInsights()
  // -------------------------------------------------------------------------
  describe("shouldTrackInAppInsights()", () => {
    it("returns true for page_load", () => {
      expect(shouldTrackInAppInsights(EVENTS.PAGE_LOAD)).toBe(true);
    });

    it("returns true for validation_started", () => {
      expect(shouldTrackInAppInsights(EVENTS.VALIDATION_STARTED)).toBe(true);
    });

    it("returns true for validation_completed", () => {
      expect(shouldTrackInAppInsights(EVENTS.VALIDATION_COMPLETED)).toBe(true);
    });

    it("returns true for session_end", () => {
      expect(shouldTrackInAppInsights(EVENTS.SESSION_END)).toBe(true);
    });

    it("returns false for tab_hidden", () => {
      expect(shouldTrackInAppInsights(EVENTS.TAB_HIDDEN)).toBe(false);
    });

    it("returns false for tab_visible", () => {
      expect(shouldTrackInAppInsights(EVENTS.TAB_VISIBLE)).toBe(false);
    });

    it("returns false for file_upload_local", () => {
      expect(shouldTrackInAppInsights(EVENTS.FILE_UPLOAD_LOCAL)).toBe(false);
    });

    it("returns false for contact_email_submitted", () => {
      expect(shouldTrackInAppInsights(EVENTS.CONTACT_EMAIL_SUBMITTED)).toBe(false);
    });

    it("returns false for feedback_submitted", () => {
      expect(shouldTrackInAppInsights(EVENTS.FEEDBACK_SUBMITTED)).toBe(false);
    });

    it("returns false for a custom event not in the major events list", () => {
      const customEvent: AnalyticsEvent = {
        name: "some_custom_event",
        category: EVENT_CATEGORIES.CUSTOM,
        description: "A one-off event",
      };
      expect(shouldTrackInAppInsights(customEvent)).toBe(false);
    });

    it("exactly four events return true across the entire registry", () => {
      const trackedCount = allEvents.filter(shouldTrackInAppInsights).length;
      expect(trackedCount).toBe(4);
    });
  });
});

import AnalyticsService from "../../utils/analyticsService";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("uuid", () => ({ v4: vi.fn(() => "mock-session-uuid") }));

vi.mock("../../utils/analyticsEvents", () => ({
  EVENTS: {
    PAGE_LOAD: { name: "page_load", category: "navigation", description: "" },
    TAB_HIDDEN: { name: "tab_hidden", category: "engagement", description: "" },
    TAB_VISIBLE: { name: "tab_visible", category: "engagement", description: "" },
    VALIDATION_STARTED: { name: "validation_started", category: "validation", description: "" },
    VALIDATION_COMPLETED: { name: "validation_completed", category: "validation", description: "" },
    SESSION_END: { name: "session_end", category: "session", description: "" },
  },
}));

// ---------------------------------------------------------------------------
// Global stubs
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockSendBeacon = vi.fn();
vi.stubGlobal("navigator", { sendBeacon: mockSendBeacon });

// Capture event listeners added to document/window so we can fire them manually
type ListenerMap = Record<string, EventListenerOrEventListenerObject>;
const documentListeners: ListenerMap = {};
const windowListeners: ListenerMap = {};

vi.spyOn(document, "addEventListener").mockImplementation((type, listener) => {
  documentListeners[type] = listener as EventListenerOrEventListenerObject;
});
vi.spyOn(document, "removeEventListener").mockImplementation((type) => {
  delete documentListeners[type];
});
vi.spyOn(window, "addEventListener").mockImplementation((type, listener) => {
  windowListeners[type] = listener as EventListenerOrEventListenerObject;
});
vi.spyOn(window, "removeEventListener").mockImplementation((type) => {
  delete windowListeners[type];
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeErrorResponse(): Promise<Response> {
  return Promise.resolve({ ok: false, statusText: "Internal Server Error" } as Response);
}

function createService(userId = "user-123") {
  return new AnalyticsService(userId);
}

async function createInitializedService(userId = "user-123") {
  mockFetch.mockResolvedValue({ ok: true } as Response);
  const service = createService(userId);
  await service.initialize();
  mockFetch.mockReset();
  return service;
}

// Simulate document.hidden toggling and fire the visibilitychange listener
function simulateTabHidden() {
  Object.defineProperty(document, "hidden", { value: true, configurable: true });
  (documentListeners.visibilitychange as EventListener)?.(new Event("visibilitychange"));
}

function simulateTabVisible() {
  Object.defineProperty(document, "hidden", { value: false, configurable: true });
  (documentListeners.visibilitychange as EventListener)?.(new Event("visibilitychange"));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AnalyticsService", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------
  describe("constructor", () => {
    it("initialises with the provided userId", () => {
      const service = createService("abc-123");
      // sessionId is null until initialize() is called — use startValidation
      // as a proxy to confirm the instance was created without errors
      expect(() => service.startValidation()).not.toThrow();
    });

    it("does not call fetch on construction", () => {
      createService();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // initialize()
  // -------------------------------------------------------------------------
  describe("initialize()", () => {
    it("calls the create-session endpoint", async () => {
      const service = createService();
      await service.initialize();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/create-session"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("sends userId and sessionId in the create-session body", async () => {
      const service = createService("user-abc");
      await service.initialize();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.userId).toBe("user-abc");
      expect(body.sessionId).toBe("mock-session-uuid");
    });

    it("tracks a PAGE_LOAD event after session creation", async () => {
      const service = createService();
      await service.initialize();
      const logEventCalls = mockFetch.mock.calls.filter(([url]) =>
        (url as string).includes("/api/log-event"),
      );
      expect(logEventCalls.length).toBeGreaterThanOrEqual(1);
      const body = JSON.parse(logEventCalls[0][1].body);
      expect(body.eventType).toBe("page_load");
    });

    it("registers a visibilitychange listener on document", async () => {
      const service = createService();
      await service.initialize();
      expect(document.addEventListener).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
    });

    it("registers a beforeunload listener on window", async () => {
      const service = createService();
      await service.initialize();
      expect(window.addEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    });

    it("does nothing when userId is empty", async () => {
      const service = createService("");
      await service.initialize();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // createSession()
  // -------------------------------------------------------------------------
  describe("createSession()", () => {
    it("logs an error but does not throw when the API returns a non-ok response", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse());
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const service = createService();
      await expect(service.createSession()).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });

    it("logs an error but does not throw on a network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const service = createService();
      await expect(service.createSession()).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // trackEvent()
  // -------------------------------------------------------------------------
  describe("trackEvent()", () => {
    it("does not call fetch when session is not initialised", async () => {
      const service = createService();
      const { EVENTS } = await import("../../utils/analyticsEvents");
      await service.trackEvent(EVENTS.PAGE_LOAD);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("calls the log-event endpoint after initialisation", async () => {
      const service = await createInitializedService();
      const { EVENTS } = await import("../../utils/analyticsEvents");
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.trackEvent(EVENTS.PAGE_LOAD);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/log-event"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("includes eventType and category in the request body", async () => {
      const service = await createInitializedService();
      const { EVENTS } = await import("../../utils/analyticsEvents");
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.trackEvent(EVENTS.VALIDATION_STARTED, {
        validationId: "val-001",
        validationNumber: 1,
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.eventType).toBe("validation_started");
      expect(body.category).toBe("validation");
    });

    it("attaches the current validationId to event metadata", async () => {
      const service = await createInitializedService();
      const validationId = service.startValidation();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const { EVENTS } = await import("../../utils/analyticsEvents");
      await service.trackEvent(EVENTS.PAGE_LOAD);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.metadata.validationId).toBe(validationId);
    });
  });

  // -------------------------------------------------------------------------
  // logEvent()
  // -------------------------------------------------------------------------
  describe("logEvent()", () => {
    it("resolves to the result of trackEvent for a known event name", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await expect(service.logEvent("page_load")).resolves.not.toThrow();
    });

    it("falls back to a custom category for an unknown event name", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.logEvent("unknown_custom_event");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.category).toBe("custom");
    });
  });

  // -------------------------------------------------------------------------
  // startValidation()
  // -------------------------------------------------------------------------
  describe("startValidation()", () => {
    it("returns a validation ID in the expected format", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const id = service.startValidation();
      expect(id).toMatch(/^val-\d{3}$/);
    });

    it("increments the validation counter on each call", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const first = service.startValidation();
      const second = service.startValidation();
      expect(first).toBe("val-001");
      expect(second).toBe("val-002");
    });

    it("tracks a VALIDATION_STARTED event", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      service.startValidation();
      await Promise.resolve();
      const logCall = mockFetch.mock.calls.find(([url]) =>
        (url as string).includes("/api/log-event"),
      );
      expect(logCall).toBeDefined();
      const body = JSON.parse(logCall?.[1].body);
      expect(body.eventType).toBe("validation_started");
    });
  });

  // -------------------------------------------------------------------------
  // logValidation()
  // -------------------------------------------------------------------------
  describe("logValidation()", () => {
    const mockDocuments = [
      {
        file: { name: "invoice.pdf" } as File,
        type: "invoice",
        result: { success: true, passedChecks: ["has_date", "has_total"], missingElements: [] },
      },
      {
        file: { name: "contract.pdf" } as File,
        type: "contract",
        result: { success: false, passedChecks: [], missingElements: ["missing_signature"] },
      },
      {
        file: { name: "broken.pdf" } as File,
        type: "receipt",
        result: { error: "Parse error" },
      },
    ];

    it("calls the log-validation endpoint", async () => {
      const service = await createInitializedService();
      service.startValidation();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.logValidation(mockDocuments, { organizationName: "Acme", fein: "12-3456789" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/log-validation"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("calculates pass, fail, and error counts correctly", async () => {
      const service = await createInitializedService();
      service.startValidation();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.logValidation(mockDocuments, {});
      const body = JSON.parse(
        mockFetch.mock.calls.find(([url]) => (url as string).includes("/api/log-validation"))?.[1]
          .body,
      );
      expect(body.passCount).toBe(1);
      expect(body.failCount).toBe(1);
      expect(body.errorCount).toBe(1);
    });

    it("includes organizationName and fein in the payload", async () => {
      const service = await createInitializedService();
      service.startValidation();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.logValidation(mockDocuments, { organizationName: "Acme", fein: "12-3456789" });
      const body = JSON.parse(
        mockFetch.mock.calls.find(([url]) => (url as string).includes("/api/log-validation"))?.[1]
          .body,
      );
      expect(body.organizationName).toBe("Acme");
      expect(body.fein).toBe("12-3456789");
    });

    it("logs an error and returns early when no active validation exists", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      // Do NOT call startValidation() — currentValidationId remains null
      await service.logValidation(mockDocuments, {});
      expect(mockFetch).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // handleVisibilityChange()
  // -------------------------------------------------------------------------
  describe("handleVisibilityChange()", () => {
    it("tracks a TAB_HIDDEN event when the tab is hidden", async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      simulateTabHidden();
      await Promise.resolve();
      const logCall = mockFetch.mock.calls.find(([url]) =>
        (url as string).includes("/api/log-event"),
      );
      expect(logCall).toBeDefined();
      const body = JSON.parse(logCall?.[1].body);
      expect(body.eventType).toBe("tab_hidden");
    });

    it("tracks a TAB_VISIBLE event when the tab becomes visible again", async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      simulateTabHidden();
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      simulateTabVisible();
      await Promise.resolve();
      const logCall = mockFetch.mock.calls.find(([url]) =>
        (url as string).includes("/api/log-event"),
      );
      expect(logCall).toBeDefined();
      const body = JSON.parse(logCall?.[1].body);
      expect(body.eventType).toBe("tab_visible");
    });
  });

  // -------------------------------------------------------------------------
  // handleBeforeUnload()
  // -------------------------------------------------------------------------
  describe("handleBeforeUnload()", () => {
    it("calls navigator.sendBeacon with the end-session URL", async () => {
      const service = await createInitializedService();
      service.handleBeforeUnload();
      expect(mockSendBeacon).toHaveBeenCalledWith(
        expect.stringContaining("/api/end-session"),
        expect.any(Blob),
      );
    });

    it("includes endReason 'tab_closed' in the beacon payload", async () => {
      const service = await createInitializedService();
      service.handleBeforeUnload();
      const blob: Blob = mockSendBeacon.mock.calls[0][1];
      const text = await blob.text();
      const payload = JSON.parse(text);
      expect(payload.endReason).toBe("tab_closed");
    });
  });

  // -------------------------------------------------------------------------
  // endSession()
  // -------------------------------------------------------------------------
  describe("endSession()", () => {
    it("calls the update-session endpoint", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.endSession("inactivity_timeout");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/update-session"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("includes the endReason in the session end payload", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.endSession("inactivity_timeout");
      const updateCall = mockFetch.mock.calls.find(([url]) =>
        (url as string).includes("/api/update-session"),
      );
      const body = JSON.parse(updateCall?.[1].body);
      expect(body.endReason).toBe("inactivity_timeout");
    });

    it("removes the visibilitychange listener on end", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.endSession();
      expect(document.removeEventListener).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
    });

    it("removes the beforeunload listener on end", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.endSession();
      expect(window.removeEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    });

    it("returns early without calling fetch when session is not initialised", async () => {
      const service = createService();
      await service.endSession();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("flags bounced as true when total session time is under 10 seconds", async () => {
      vi.useFakeTimers();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const service = createService();
      await service.initialize();
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      // End immediately — well under 10 seconds
      await service.endSession("unknown");
      const updateCall = mockFetch.mock.calls.find(([url]) =>
        (url as string).includes("/api/update-session"),
      );
      const body = JSON.parse(updateCall?.[1].body);
      expect(body.bounced).toBe(true);
      vi.useRealTimers();
    });
  });

  // -------------------------------------------------------------------------
  // updateSessionEmail()
  // -------------------------------------------------------------------------
  describe("updateSessionEmail()", () => {
    it("calls the update-session endpoint with the provided email", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await service.updateSessionEmail("user@example.com");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/update-session"),
        expect.objectContaining({ method: "POST" }),
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.email).toBe("user@example.com");
    });

    it("does not throw when the API returns a non-ok response", async () => {
      const service = await createInitializedService();
      mockFetch.mockResolvedValue(makeErrorResponse());
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await expect(service.updateSessionEmail("user@example.com")).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });

    it("does not throw on a network failure", async () => {
      const service = await createInitializedService();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await expect(service.updateSessionEmail("user@example.com")).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // resetActivityTimer()
  // -------------------------------------------------------------------------
  describe("resetActivityTimer()", () => {
    it("calls endSession with 'inactivity_timeout' after SESSION_TIMEOUT_MS", async () => {
      vi.useFakeTimers();
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const service = createService();
      await service.initialize();
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({ ok: true } as Response);

      // Advance past the 30-minute timeout
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000 + 1);

      const updateCall = mockFetch.mock.calls.find(([url]) =>
        (url as string).includes("/api/update-session"),
      );
      expect(updateCall).toBeDefined();
      const body = JSON.parse(updateCall?.[1].body);
      expect(body.endReason).toBe("inactivity_timeout");
      vi.useRealTimers();
    });
  });
});

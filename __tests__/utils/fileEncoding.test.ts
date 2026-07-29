import { fileToBase64 } from "../../utils/fileEncoding";

// A controllable FileReader fake. readAsDataURL resolves onload (or onerror)
// on the next microtask so the promise in fileToBase64 settles.
class MockFileReader {
  result: string | null = null;
  error: unknown = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  // Configured per-test to decide success vs failure.
  static mode: "success" | "error" = "success";
  static dataUrl = "data:application/pdf;base64,SGVsbG8=";
  static errorValue: unknown = new Error("read failed");

  readAsDataURL(_file: File) {
    queueMicrotask(() => {
      if (MockFileReader.mode === "success") {
        this.result = MockFileReader.dataUrl;
        this.onload?.();
      } else {
        this.error = MockFileReader.errorValue;
        this.onerror?.();
      }
    });
  }
}

beforeEach(() => {
  MockFileReader.mode = "success";
  MockFileReader.dataUrl = "data:application/pdf;base64,SGVsbG8=";
  MockFileReader.errorValue = new Error("read failed");
  vi.stubGlobal("FileReader", MockFileReader);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fileToBase64", () => {
  it("resolves with the base64 payload, stripping the data-URL prefix", async () => {
    const result = await fileToBase64(new File(["hello"], "f.pdf"));
    expect(result).toBe("SGVsbG8="); // "Hello" base64, prefix removed
  });

  it("returns only the part after the comma", async () => {
    MockFileReader.dataUrl = "data:image/png;base64,QUJD";
    const result = await fileToBase64(new File(["x"], "f.png"));
    expect(result).toBe("QUJD");
    expect(result).not.toContain("data:");
    expect(result).not.toContain(",");
  });

  it("rejects with the reader error when reading fails", async () => {
    MockFileReader.mode = "error";
    MockFileReader.errorValue = new Error("boom");
    await expect(fileToBase64(new File(["x"], "f.pdf"))).rejects.toThrow("boom");
  });

  it("rejects even when the reader error is null", async () => {
    MockFileReader.mode = "error";
    MockFileReader.errorValue = null;
    // reader.error is null → promise rejects with null; assert it rejects at all.
    await expect(fileToBase64(new File(["x"], "f.pdf"))).rejects.toBeNull();
  });
});

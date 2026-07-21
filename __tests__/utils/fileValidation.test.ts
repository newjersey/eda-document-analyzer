import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  validateFile,
} from "../../utils/fileValidation";

function makeFile(name: string, { type = "", size = 1024 } = {}): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateFile", () => {
  describe("valid files", () => {
    it.each(ALLOWED_MIME_TYPES)("accepts files with allowed MIME type %s", (mime) => {
      expect(validateFile(makeFile("doc.bin", { type: mime }))).toBeNull();
    });

    it.each(ALLOWED_EXTENSIONS)("accepts files with allowed extension %s", (ext) => {
      // No MIME type — validity must come from the extension alone.
      expect(validateFile(makeFile(`doc${ext}`, { type: "" }))).toBeNull();
    });

    it("accepts when extension is valid even if MIME is unrecognized", () => {
      expect(validateFile(makeFile("doc.pdf", { type: "application/octet-stream" }))).toBeNull();
    });

    it("is case-insensitive about extensions", () => {
      expect(validateFile(makeFile("DOC.PDF", { type: "" }))).toBeNull();
      expect(validateFile(makeFile("image.JPG", { type: "" }))).toBeNull();
    });

    it("accepts a file exactly at the size limit", () => {
      expect(validateFile(makeFile("doc.pdf", { size: MAX_FILE_SIZE }))).toBeNull();
    });
  });

  describe("invalid type", () => {
    it("rejects a disallowed type + extension", () => {
      const result = validateFile(makeFile("malware.exe", { type: "application/octet-stream" }));
      expect(result).toMatch(/valid file types/i);
    });

    it("rejects a file with no extension and no valid MIME", () => {
      expect(validateFile(makeFile("README", { type: "" }))).toMatch(/valid file types/i);
    });

    it("prefers the type error when a file is both wrong-type and oversized", () => {
      const result = validateFile(
        makeFile("malware.exe", { type: "application/octet-stream", size: MAX_FILE_SIZE + 1 }),
      );
      expect(result).toMatch(/valid file types/i);
    });
  });

  describe("size limit", () => {
    it("rejects a file one byte over the limit", () => {
      const result = validateFile(makeFile("doc.pdf", { size: MAX_FILE_SIZE + 1 }));
      expect(result).toMatch(/23 MB/i);
    });

    it("includes the file name in the size error", () => {
      const result = validateFile(makeFile("big-report.pdf", { size: MAX_FILE_SIZE + 1 }));
      expect(result).toContain("big-report.pdf");
    });
  });
});

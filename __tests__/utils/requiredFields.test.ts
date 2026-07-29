import type { ValidatedDocument } from "../../utils/analyticsService";
import { computeRequiredFields } from "../../utils/requiredFields";

// Minimal factory — only `type` matters to computeRequiredFields, the rest
// satisfies the ValidatedDocument shape.
function doc(type: string): ValidatedDocument {
  return {
    file: new File(["x"], "f.pdf"),
    id: `id-${type}`,
    result: null,
    type,
    detectedCategory: undefined,
    projectNumber: null,
  } as ValidatedDocument;
}

describe("computeRequiredFields", () => {
  it("requires nothing for an empty document list", () => {
    expect(computeRequiredFields([])).toEqual({
      organizationName: false,
      fein: false,
    });
  });

  it("requires nothing for a type that has no requirements", () => {
    expect(computeRequiredFields([doc("bylaws")])).toEqual({
      organizationName: false,
      fein: false,
    });
    expect(computeRequiredFields([doc("irs-determination")])).toEqual({
      organizationName: false,
      fein: false,
    });
  });

  it.each(["tax-clearance-online", "tax-clearance-manual"])(
    "requires both org name and FEIN for %s",
    (type) => {
      expect(computeRequiredFields([doc(type)])).toEqual({
        organizationName: true,
        fein: true,
      });
    },
  );

  it.each([
    "operating-agreement",
    "cert-formation",
    "cert-formation-independent",
    "cert-incorporation",
    "cert-authority",
    "cert-alternative-name",
  ])("requires only org name for %s", (type) => {
    expect(computeRequiredFields([doc(type)])).toEqual({
      organizationName: true,
      fein: false,
    });
  });

  it("ORs requirements across multiple documents", () => {
    // cert-formation → org name only; tax-clearance → adds FEIN.
    const result = computeRequiredFields([doc("cert-formation"), doc("tax-clearance-online")]);
    expect(result).toEqual({ organizationName: true, fein: true });
  });

  it("does not let a later no-requirement doc clear an earlier requirement", () => {
    const result = computeRequiredFields([doc("tax-clearance-online"), doc("bylaws")]);
    expect(result).toEqual({ organizationName: true, fein: true });
  });

  it("handles an unrecognized type as having no requirements", () => {
    expect(computeRequiredFields([doc("")])).toEqual({
      organizationName: false,
      fein: false,
    });
    expect(computeRequiredFields([doc("some-unknown-type")])).toEqual({
      organizationName: false,
      fein: false,
    });
  });
});

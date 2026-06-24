"use client";

/**
 * GuidanceContent.jsx
 * --------------------
 * Displays document selection guidance with entity verification requirements
 * and additional documents information. Includes "View Sample" links for each
 * document type to help users verify correct submissions.
 *
 * This component is designed to be reusable - can be displayed inline or in a modal
 * with minimal code changes.
 */

import { ExternalLink } from "lucide-react";

interface SampleInfo {
    type: string;
    label: string;
    samplePath: string;
}

interface GuidanceContentProps {
    isDarkMode: boolean;
    onViewSample: (sampleInfo: SampleInfo) => void;
}

export default function GuidanceContent({
    isDarkMode,
    onViewSample
}: GuidanceContentProps) {

  /**
   * Sample document mapping
   * Maps document types to their placeholder image paths
   * When real SharePoint URLs are available, update these paths
   */
const SAMPLE_DOCUMENTS = {
    "cert-trade-name": "/sample-documents/cert-trade-name.pdf",
    "tax-clearance-online": "/sample-documents/tax-clearance-online.pdf",
    "tax-clearance-manual": "/sample-documents/tax-clearance-manual.pdf",
    "cert-formation": "/sample-documents/cert-formation.pdf",
    "cert-formation-independent": "/sample-documents/cert-formation-independent.pdf",
    "operating-agreement": "/sample-documents/operating-agreement.pdf",
    "cert-incorporation": "/sample-documents/cert-incorporation.pdf",
    "irs-determination": "/sample-documents/irs-determination.pdf",
    "bylaws": "/sample-documents/bylaws.pdf",
    "cert-authority": "/sample-documents/cert-authority.pdf",
    "cert-authority-foreign": "/sample-documents/cert-authority-foreign.pdf",
    "cert-alternative-name": "/sample-documents/cert-alternative-name.pdf"
  };

  /**
   * Handles clicking "View Sample" link
   * Creates a sample document object and passes to parent handler
   */
  const handleViewSample = (
    documentType: SampleInfo['type'], documentLabel: SampleInfo['label']
    ) => {
    // For now, show placeholder since actual images aren't configured yet
    // When real images are added, this will fetch and display them
    onViewSample({
      type: documentType,
      label: documentLabel,
      samplePath: SAMPLE_DOCUMENTS[documentType]
    });
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
      {/* Main heading */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
          How to Select the Right Document?
        </h3>
        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Selecting the correct document type and category is critical for a successful application review.
          Use the tables below to ensure your selection is accurate.
        </p>
      </div>

      {/* Three explanatory bullet points */}
      <ul className={`space-y-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        <li className="flex items-start">
          <span className="mr-2">•</span>
          <span>
            <strong>Determine Requirements by Entity:</strong> Not sure which formation document is required
            based on your applicant"s entity type? Refer to the "Entity Verification Forms" table below to
            find required documents based on entity type.
          </span>
        </li>
        <li className="flex items-start">
          <span className="mr-2">•</span>
          <span>
            <strong>Required Documents:</strong> If you are unsure about which Common App documents are
            required more broadly, please use the guidance provided in the "Additional Documents" table.
          </span>
        </li>
        <li className="flex items-start">
          <span className="mr-2">•</span>
          <span>
            <strong>Verify Submissions:</strong> To confirm if an applicant has submitted the correct paperwork
            or if you"re unsure which document to select (e.g., distinguishing between online and manually
            generated Tax Clearances) use the preview links to compare their upload against a sample version.
          </span>
        </li>
      </ul>

      {/* Table 1: Entity Verification Forms */}
      <div>
        <h4 className={`text-base font-semibold mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
          Entity Verification Forms (aka "Formation Documents")
        </h4>
        <div className={`overflow-x-auto rounded-lg border ${
          isDarkMode ? "border-gray-700" : "border-gray-300"
        }`}>
          <table className="min-w-full divide-y divide-gray-500">
            <thead className={isDarkMode ? "bg-gray-800" : "bg-gray-100"}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Entity Type
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Required Verification Documents
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {/* Sole Proprietor */}
              <tr className={isDarkMode ? "bg-gray-800/50" : "bg-white"}>
                <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  Sole Proprietor
                </td>
                <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      • Certificate of Trade Name
                      <button
                        onClick={() => handleViewSample("cert-trade-name", "Certificate of Trade Name")}
                        className={`ml-2 text-xs underline flex items-center gap-1 ${
                          isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Sample
                      </button>
                    </li>
                    <li className="ml-4 text-xs italic">
                      If unavailable, a Tax Clearance Certificate matching the applicant"s name may be accepted instead.
                    </li>
                  </ul>
                </td>
              </tr>

              {/* LLC & Partnerships */}
              <tr className={isDarkMode ? "bg-gray-900/50" : "bg-gray-50"}>
                <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  LLC & Partnerships
                </td>
                <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      • Certificate of Formation
                      <button
                        onClick={() => handleViewSample("cert-formation", "Certificate of Formation")}
                        className={`ml-2 text-xs underline flex items-center gap-1 ${
                          isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Sample
                      </button>
                      <span className="ml-2">OR</span>
                    </li>
                    <li className="flex items-center">
                      • Certificate of Formation-Independent
                      <button
                        onClick={() => handleViewSample("cert-formation-independent", "Certificate of Formation-Independent")}
                        className={`ml-2 text-xs underline flex items-center gap-1 ${
                          isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Sample
                      </button>
                      <span className="ml-2">OR</span>
                    </li>
                    <li className="flex items-center">
                      • Operating Agreement
                      <button
                        onClick={() => handleViewSample("operating-agreement", "Operating Agreement")}
                        className={`ml-2 text-xs underline flex items-center gap-1 ${
                          isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Sample
                      </button>
                    </li>
                  </ul>
                </td>
              </tr>

              {/* S & C Corporation */}
              <tr className={isDarkMode ? "bg-gray-800/50" : "bg-white"}>
                <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  S & C Corporation
                </td>
                <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      • Certificate of Incorporation
                      <button
                        onClick={() => handleViewSample("cert-incorporation", "Certificate of Incorporation")}
                        className={`ml-2 text-xs underline flex items-center gap-1 ${
                          isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Sample
                      </button>
                    </li>
                  </ul>
                </td>
              </tr>

              {/* Not-for-profit */}
              <tr className={isDarkMode ? "bg-gray-900/50" : "bg-gray-50"}>
                <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  Not-for-profit
                </td>
                <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      • Certificate of Incorporation
                      <button
                        onClick={() => handleViewSample("cert-incorporation", "Certificate of Incorporation")}
                        className={`ml-2 text-xs underline flex items-center gap-1 ${
                          isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Sample
                      </button>
                    </li>
                    <li className="ml-4">AND</li>
                    <li className="flex items-center">
                      • IRS Determination Letter
                      <button
                        onClick={() => handleViewSample("irs-determination", "IRS Determination Letter")}
                        className={`ml-2 text-xs underline flex items-center gap-1 ${
                          isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Sample
                      </button>
                    </li>
                    <li className="ml-4 text-xs font-medium">OPTIONAL</li>
                    <li className="flex items-center">
                      • By-laws
                      <button
                        onClick={() => handleViewSample("bylaws", "By-laws")}
                        className={`ml-2 text-xs underline flex items-center gap-1 ${
                          isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Sample
                      </button>
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Additional Documents */}
      <div>
        <h4 className={`text-base font-semibold mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
          Additional Documents
        </h4>
        <div className={`overflow-x-auto rounded-lg border ${
          isDarkMode ? "border-gray-700" : "border-gray-300"
        }`}>
          <table className="min-w-full divide-y divide-gray-500">
            <thead className={isDarkMode ? "bg-gray-800" : "bg-gray-100"}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Document Category
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Document Type
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {/* NJ Division of Taxation */}
              <tr className={isDarkMode ? "bg-gray-800/50" : "bg-white"}>
                <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  NJ Division of Taxation Verification
                </td>
                <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      • Tax Clearance Certificate (Online Generated)
                      <button
                        onClick={() => handleViewSample("tax-clearance-online", "Tax Clearance Certificate (Online)")}
                        className={`ml-2 text-xs underline flex items-center gap-1 ${
                          isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Sample
                      </button>
                    </li>
                    <li className="flex items-center">
                      • Tax Clearance Certificate (Manually Generated)
                      <button
                        onClick={() => handleViewSample("tax-clearance-manual", "Tax Clearance Certificate (Manual)")}
                        className={`ml-2 text-xs underline flex items-center gap-1 ${
                          isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Sample
                      </button>
                    </li>
                  </ul>
                </td>
              </tr>

              {/* NJ Division of Revenue and Enterprise Services */}
              <tr className={isDarkMode ? "bg-gray-900/50" : "bg-gray-50"}>
                <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  NJ Division of Revenue and Enterprise Services
                </td>
                <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <ul className="space-y-2">
                    <li>
                      <div className="flex items-center">
                        • Certificate of Alternative Name
                        <button
                          onClick={() => handleViewSample("cert-alternative-name", "Certificate of Alternative Name")}
                          className={`ml-2 text-xs underline flex items-center gap-1 ${
                            isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                          }`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Sample
                        </button>
                      </div>
                      <p className="ml-4 text-xs italic mt-1">
                        Used for businesses operating under a different name. Official formation documents may be
                        accepted instead of a Certificate of Alternative Name.
                      </p>
                    </li>
                    <li>
                      <div className="flex items-start flex-col space-y-1">
                        <div className="flex items-center">
                          • Certificate of Authority V1
                          <button
                            onClick={() => handleViewSample("cert-authority", "Certificate of Authority V1")}
                            className={`ml-2 text-xs underline flex items-center gap-1 ${
                              isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                            }`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Sample
                          </button>
                        </div>
                        <div className="flex items-center">
                          • Certificate of Authority V2
                          <button
                            onClick={() => handleViewSample("cert-authority-foreign", "Certificate of Authority V2")}
                            className={`ml-2 text-xs underline flex items-center gap-1 ${
                              isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                            }`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Sample
                          </button>
                        </div>
                      </div>
                      <p className="ml-4 text-xs italic mt-1">
                        Collected for businesses formed in a state other than New Jersey. A Certificate of Authority
                        must be provided for any business formed outside of NJ, in addition to standard entity
                        verification forms.
                      </p>
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

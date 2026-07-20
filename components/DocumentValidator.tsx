'use client';

import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useUserId } from '../hooks/useUserId';
import Header from './Header';
import FormFields from './FormFields';
import FileUploadArea from './FileUploadArea';
import ValidationButton from './ValidationButton';
import ErrorMessage from './ErrorMessage';
import ValidationResults from './ValidationResults';
import { ContactForm } from './ContactForm';

// --- Document type auto-detection ---
import { detectDocumentType } from '../utils/documentTypeDetector';
// === NEW ANALYTICS IMPORTS - START ===
import { useAnalytics } from '../hooks/useAnalytics';
import { EVENTS } from '../utils/analyticsEvents';
import EmailPreviewModal from './EmailPreviewModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import { ValidatedDocument } from '../utils/analyticsService';
// === NEW ANALYTICS IMPORTS - END ===
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

const FEEDBACK_API_KEY = process.env.NEXT_PUBLIC_FEEDBACK_API_KEY;
const ANALYTICS_API_KEY = process.env.NEXT_PUBLIC_ANALYTICS_API_KEY;


export default function DocumentValidator() {
    const [documents, setDocuments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [formFields, setFormFields] = useState({
        organizationName: '',
        fein: ''
    });
    const [requiredFields, setRequiredFields] = useState({
        organizationName: false,
        fein: false
    });
    const [fieldErrors, setFieldErrors] = useState({
        organizationName: '',
        fein: ''
    });
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // --- NEW: SharePoint search modal state ---
    const [isSharePointModalOpen, setIsSharePointModalOpen] = useState(false);

    // ===== CHANGE FOR EMAIL TEMPLATE FEATURE - START =====
    // Email preview modal state - managed at top level like SharePoint modal
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailText, setEmailText] = useState('');
    // ===== CHANGE FOR EMAIL TEMPLATE FEATURE - END =====
    // --- START: Document preview feature - modal state ---
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewDocument, setPreviewDocument] = useState(null);
// --- END: Document preview feature - modal state ---

    const userId = useUserId();
    const analytics = useAnalytics(userId);


    useEffect(() => {
        // === REMOVED: setSessionStartTime(Date.now()) - handled by analytics service ===

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setIsDarkMode(savedTheme === 'dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDark);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const documentTypes = [
        { value: 'tax-clearance-online', label: 'Tax Clearance Certificate (Online)' },
        { value: 'tax-clearance-manual', label: 'Tax Clearance Certificate (Manually Generated)' },
        { value: 'cert-alternative-name', label: 'Certificate of Alternative Name' },
        { value: 'cert-trade-name', label: 'Certificate of Trade Name' },
        { value: 'cert-formation', label: 'Certificate of Formation' },
        { value: 'cert-formation-independent', label: 'Certificate of Formation - Independent' },
        { value: 'operating-agreement', label: 'Operating Agreement' },
        { value: 'cert-incorporation', label: 'Certificate of Incorporation' },
        { value: 'irs-determination', label: 'IRS Determination Letter' },
        { value: 'bylaws', label: 'By-laws' },
        { value: 'cert-authority', label: 'Certificate of Authority' }
    ];

    useEffect(() => {
        const newRequiredFields = {
            organizationName: false,
            fein: false
        };
        for (const doc of documents) {
            switch (doc.type) {
                case 'tax-clearance-online':
                case 'tax-clearance-manual':
                    newRequiredFields.organizationName = true;
                    newRequiredFields.fein = true;
                    break;
                case 'operating-agreement':
                case 'cert-formation':
                case 'cert-formation-independent':
                case 'cert-incorporation':
                case 'cert-authority':
                case 'cert-alternative-name':
                    newRequiredFields.organizationName = true;
                    break;
                default:
                    break;
            }
        }
        setRequiredFields(newRequiredFields);
    }, [documents]);

    const handleFiles = (selectedFiles: FileList) => {
        setError(null);
        const filesArray = Array.from(selectedFiles);
        const newDocuments: ValidatedDocument[] = [];
        let localError = null;

        for (const file of filesArray) {
            const allowedTypes = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg'];
            const allowedExtensions = ['.pdf', '.txt', '.png', '.jpg', '.jpeg'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

            if (!isValidType) {
                localError = 'Please select valid file types: PDF, TXT, PNG, JPG, or JPEG';
                break;
            }

            if (file.size > 23 * 1024 * 1024) {
                localError = `File "${file.name}" exceeds the 23 MB size limit.`;
                break;
            }

            // Auto-detect document type from filename
            const detection = detectDocumentType(file.name);

            // Track auto-detection if successful
            if (detection.autoSelectedType && analytics) {
                analytics.logEvent('document_type_auto_detected', {
                    fileName: file.name,
                    detectedType: detection.autoSelectedType,
                    detectedCategory: detection.detectedCategory
                });
            }

            newDocuments.push({
                file: file,
                id: uuidv4(),
                result: null,
                type: detection.autoSelectedType,
                detectedCategory: detection.detectedCategory,
                projectNumber: null,
            });
        }

        if (localError) {
            setError(localError);
            return;
        }

        setDocuments(prevDocs => [...prevDocs, ...newDocuments]);

        // Track SharePoint file uploads separately
        if (analytics) {
            const sharepointFiles = newDocuments.filter(doc => doc.projectNumber);
            if (sharepointFiles.length > 0) {
                analytics.logEvent('file_upload_sharepoint', {
                    fileCount: sharepointFiles.length,
                    projectNumbers: sharepointFiles.map(f => f.projectNumber).filter(Boolean)
                });
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files.length > 0) {
            handleFiles(event.target.files);
        }
    };

    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragCounter(prev => prev + 1);
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragCounter(prev => {
            const newCount = prev - 1;
            if (newCount === 0) setIsDragOver(false);
            return newCount;
        });
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
        setDragCounter(0);
        if (event.dataTransfer.files.length > 0) {
            handleFiles(event.dataTransfer.files);
        }
    };

    const handleDocumentTypeChange = (documentId, newType) => {
        setDocuments(prevDocs =>
            prevDocs.map(doc =>
                doc.id === documentId ? { ...doc, type: newType } : doc
            )
        );
    };

    const removeDocument = (id) => {
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormFields(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateRequiredFields = () => {
        const errors = {
            organizationName: '',
            fein: ''
        };
        let isValid = true;
        if (requiredFields.organizationName && !formFields.organizationName.trim()) {
            errors.organizationName = 'Organization Name is required';
            isValid = false;
        }
        if (requiredFields.fein && !formFields.fein.trim()) {
            errors.fein = 'FEIN is required';
            isValid = false;
        }
        setFieldErrors(errors);
        return isValid;
    };
    //======================
    const fileToBase64 = (file: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    };
    //==========================================
    // === REMOVED OLD logSessionAnalytics FUNCTION ===
    // Replaced by analytics service which handles:
    // - Session creation on page load
    // - Event tracking for all user actions
    // - Validation logging with detailed results
    // - Tab visibility and engagement tracking

    const validateDocuments = async () => {
        if (documents.length === 0) {
            setError('Please upload at least one document');
            return;
        }
        // Check if all documents have a type selected
        const documentsWithoutType = documents.filter(doc => !doc.type || doc.type === '');
        if (documentsWithoutType.length > 0) {
            setError('Please select a document type for all uploaded files');
            return;
        }
        if (!validateRequiredFields()) {
            setError('Please fill in all required fields');
            return;
        }

        setIsUploading(true);
        setError(null);

        const validationPromises = documents.map(async (doc) => {
            try {
                const base64File = await fileToBase64(doc.file);
                const payload = {
                    file: base64File,
                    documentType: doc.type,
                    fileType: doc.file.type,
                    fileName: doc.file.name,
                    ...formFields
                };
                const response = await fetch(`${API_BASE_URL}/api/validate-document`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.error || `Error: ${response.statusText}`);
                }
                return await response.json();
            } catch (err) {
                return { error: true, message: err.message || 'Failed to validate document' };
            }
        });

        const results = await Promise.all(validationPromises);

// Show toast notifications for any validation errors
        results.forEach((result, index) => {
            if (result.error) {
                const fileName = documents[index].file.name;
                toast.error(`Error validating "${fileName}": ${result.message}`, {
                    duration: 5000,
                    position: 'top-right'
                });
            }
        });

        setDocuments(prevDocs =>
            prevDocs.map((doc, index) => ({
                ...doc,
                result: results[index]
            }))
        );

        // === NEW ANALYTICS TRACKING - START ===
        // Track validation completion with detailed results
        if (analytics) {
            analytics.startValidation();
            await analytics.logValidation(documents.map((doc, index) => ({
                ...doc,
                result: results[index]
            })), formFields);
        }
        // === NEW ANALYTICS TRACKING - END ===

        setIsUploading(false);
    };

    // ===== CHANGE FOR EMAIL TEMPLATE FEATURE - START =====
    /**
     * Opens the email preview modal with generated email text
     * Called from ValidationResults component when user clicks email preview button
     *
     * @param {string} generatedEmailText - The formatted email template to display
     */
    const handleOpenEmailModal = (generatedEmailText) => {
        setEmailText(generatedEmailText);
        setIsEmailModalOpen(true);
    };
    // ===== CHANGE FOR EMAIL TEMPLATE FEATURE - END =====
    // --- START: Document preview feature ---
        /**
        * Opens the document preview modal with the selected document
        * Called from FileUploadArea (before validation) and SingleResultCard (after validation)
        *
        * @param {Object} document - The document object to preview
    */
    const handleDocumentPreview = (document) => {
        setPreviewDocument(document);
        setIsPreviewModalOpen(true);
    };
    // --- END: Document preview feature ---
    const handleRefresh = () => {
        // Perform a complete page reload (like pressing Ctrl+R)
        // Note: Analytics session will end and new session will start automatically on reload
        window.location.reload();
    };
    const hasValidationRun = documents.length > 0 && documents.some(doc => doc.result !== null);

    return (
        <div className={`min-h-screen w-full transition-colors duration-300 ${isDarkMode
                ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800'
                : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
            }`}>
            <div className="w-full h-full flex flex-col px-6 py-6">
                <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} onRefresh={handleRefresh} />
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left panel - Upload area - Changed from lg:col-span-7 (60%) to lg:col-span-5 (40%) */}
                    <div className="lg:col-span-5 flex flex-col min-h-0">
                        <div className={`${isDarkMode
                                ? 'bg-gray-800/80 border-gray-700/20'
                                : 'bg-white/80 border-white/20'
                            } backdrop-blur-sm p-4 sm:p-5 md:p-5 rounded-2xl shadow-xl border transition-all duration-300 h-full overflow-auto`}>

                            <FileUploadArea
                                documents={documents}
                                isDragOver={isDragOver}
                                handleFileChange={handleFileChange}
                                handleDragEnter={handleDragEnter}
                                handleDragLeave={handleDragLeave}
                                handleDragOver={handleDragOver}
                                handleDrop={handleDrop}
                                isDarkMode={isDarkMode}
                                documentTypes={documentTypes}
                                handleDocumentTypeChange={handleDocumentTypeChange}
                                removeDocument={removeDocument}
                                handleDocumentPreview={handleDocumentPreview}
                                analytics={analytics}
                            />

                            {(requiredFields.organizationName || requiredFields.fein) && (
                                <div className="mt-4">
                                    <FormFields
                                        requiredFields={requiredFields}
                                        formFields={formFields}
                                        handleInputChange={handleInputChange}
                                        fieldErrors={fieldErrors}
                                        isDarkMode={isDarkMode}
                                    />
                                </div>
                            )}

                            <ValidationButton
                                isUploading={isUploading}
                                validateDocument={validateDocuments}
                                isDarkMode={isDarkMode}
                            />

                            <ErrorMessage error={error} isDarkMode={isDarkMode} />
                        </div>
                    </div>

                    {/* Right panel - Validation results - Changed from lg:col-span-5 (40%) to lg:col-span-7 (60%) */}
                    <div className="lg:col-span-7 flex flex-col min-h-0">
                        <div className={`${isDarkMode
                                ? 'bg-gray-800/80 border-gray-700/20'
                                : 'bg-white/80 border-white/20'
                            } backdrop-blur-sm p-6 rounded-2xl shadow-xl border transition-all duration-300 h-full overflow-auto`}>
                            <ValidationResults
                                documents={documents}
                                isDarkMode={isDarkMode}
                                userId={userId}
                                feedbackApiKey={FEEDBACK_API_KEY}
                                onOpenEmailModal={handleOpenEmailModal}
                                onOpenPreviewModal={handleDocumentPreview}
                                analytics={analytics}
                            />

                            {hasValidationRun && (
                                <div className="mt-6">
                                    <ContactForm
                                        userId={userId}
                                        sessionId={analytics?.getSessionId()}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* Email Preview Modal - Rendered at top level like SharePoint modal */}
                {/* This prevents nested scrolling issues by overlaying the entire viewport */}
                <EmailPreviewModal
                    isOpen={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    emailText={emailText}
                    isDarkMode={isDarkMode}
                    analytics={analytics}
                />
                {/* --- START: Document preview feature --- */}
                {/* Document Preview Modal - Rendered at top level like SharePoint and Email modals */}
                <DocumentPreviewModal
                    isOpen={isPreviewModalOpen}
                    onClose={() => {
                        setIsPreviewModalOpen(false);
                        setPreviewDocument(null);
                    }}
                    document={previewDocument}
                    isDarkMode={isDarkMode}
                    userId={userId}
                    feedbackApiKey={FEEDBACK_API_KEY}
                    analytics={analytics}
                />
                {/* --- END: Document preview feature --- */}

            </div>
        </div>
    );
}
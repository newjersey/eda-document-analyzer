export const ALLOWED_MIME_TYPES = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg'];
export const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.png', '.jpg', '.jpeg'];
export const MAX_FILE_SIZE = 23 * 1024 * 1024;

export function validateFile(file: File): string | null {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
  const isValidType = ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);

  if (!isValidType) {
    return 'Please select valid file types: PDF, TXT, PNG, JPG, or JPEG';
  }
  else if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" exceeds the 23 MB size limit.`;
  }

  return null;
}

/**
 * Map a MIME type to our internal fileType category.
 * @param {string} mimeType
 * @returns {"image"|"video"|"audio"|"pdf"|"other"}
 */
const categoriseFile = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
};

/**
 * Allowed MIME types for upload validation.
 */
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Videos
  "video/mp4",
  "video/mpeg",
  "video/webm",
  "video/quicktime",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  // Documents
  "application/pdf",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

module.exports = { categoriseFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };

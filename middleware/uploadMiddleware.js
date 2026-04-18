const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } = require("../utils/fileUtils");

// ── Ensure local uploads directory exists ─────────────────────
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── File filter ───────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error(`Unsupported file type: ${file.mimetype}`), {
        statusCode: 415,
      }),
      false
    );
  }
};

// ── Local disk storage ────────────────────────────────────────
const localDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ── Cloudinary storage (lazy-loaded so missing creds don't crash) ─
let cloudinaryStorage;
const getCloudinaryStorage = () => {
  if (!cloudinaryStorage) {
    const { CloudinaryStorage } = require("multer-storage-cloudinary");
    const cloudinary = require("../config/cloudinary");
    cloudinaryStorage = new CloudinaryStorage({
      cloudinary,
      params: async (_req, file) => ({
        folder: "contentshield",
        resource_type: "auto",
        public_id: uuidv4(),
        format: path.extname(file.originalname).replace(".", "") || undefined,
      }),
    });
  }
  return cloudinaryStorage;
};

// ── Build multer instance based on STORAGE_MODE ───────────────
const buildUploader = () => {
  const storage =
    process.env.STORAGE_MODE === "cloudinary"
      ? getCloudinaryStorage()
      : localDiskStorage;

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
  });
};

const upload = buildUploader();

module.exports = upload;

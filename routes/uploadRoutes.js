const express = require("express");
const { uploadFile, getFiles, deleteFile } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// POST /api/upload  – multipart/form-data, field name: "file"
router.post("/upload", protect, upload.single("file"), uploadFile);

// GET /api/files   – list current user's files (paginated)
router.get("/files", protect, getFiles);

router.delete("/files/:id", protect, deleteFile);

module.exports = router;

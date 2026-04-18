const Fingerprint = require("../models/Fingerprint");
const File = require("../models/File");
const { asyncHandler } = require("../middleware/errorMiddleware");
const { generateHashFromString } = require("../utils/hashUtils");

// ── POST /api/fingerprint/generate ────────────────────────────
const generateFingerprint = asyncHandler(async (req, res) => {
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ message: "fileId is required" });
  }

  const file = await File.findOne({ _id: fileId, userId: req.user._id });
  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  const existing = await Fingerprint.findOne({ fileId });
  if (existing) {
    return res.json({
      message: "Fingerprint already exists",
      fingerprint: existing,
    });
  }

  const hash = generateHashFromString(
    file.fileUrl + file.fileName + file.uploadedAt
  );

  const fingerprint = await Fingerprint.create({
    fileId,
    fingerprintHash: hash,
  });

  res.status(201).json({
    message: "Fingerprint generated successfully",
    fingerprint,
  });
});

module.exports = { generateFingerprint };

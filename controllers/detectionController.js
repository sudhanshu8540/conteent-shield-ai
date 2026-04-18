const Detection = require("../models/Detection");
const Fingerprint = require("../models/Fingerprint");
const File = require("../models/File");
const { asyncHandler } = require("../middleware/errorMiddleware");
const { computeSimilarityScore } = require("../utils/hashUtils");
const { getPlatformForFile } = require("../utils/platformUtils");

// ── POST /api/detect ───────────────────────────────────────────
const detectDuplicates = asyncHandler(async (req, res) => {
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ message: "fileId is required" });
  }

  const file = await File.findOne({ _id: fileId, userId: req.user._id });
  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  const targetPrint = await Fingerprint.findOne({ fileId });
  if (!targetPrint) {
    return res.status(404).json({
      message: "No fingerprint found for this file. Generate one first.",
    });
  }

  // Compare against all OTHER fingerprints
  const allPrints = await Fingerprint.find({ fileId: { $ne: fileId } });

  const matchedFiles = [];

  for (const fp of allPrints) {
    const score = computeSimilarityScore(
      targetPrint.fingerprintHash,
      fp.fingerprintHash
    );
    if (score >= 30) {
      matchedFiles.push({
        fileId: fp.fileId,
        similarityScore: score,
        platform: getPlatformForFile(fp.fileId.toString()),
      });
    }
  }

  // Sort highest similarity first
  matchedFiles.sort((a, b) => b.similarityScore - a.similarityScore);

  const isDuplicate = matchedFiles.some((m) => m.similarityScore >= 90);

  // Upsert detection record
  const detection = await Detection.findOneAndUpdate(
    { originalFileId: fileId, userId: req.user._id },
    {
      matchedFiles,
      totalMatches: matchedFiles.length,
      isDuplicate,
      detectedAt: Date.now(),
    },
    { upsert: true, new: true }
  );

  // Real-time push
  const io = req.app.get("io");
  if (io && isDuplicate) {
    io.emit("detection:new", {
      fileId: file._id,
      fileName: file.originalName,
      totalMatches: matchedFiles.length,
      isDuplicate,
      detectedAt: detection.detectedAt,
    });
  }

  res.json({
    originalFile: file,
    matchedFiles,
    totalMatches: matchedFiles.length,
    isDuplicate,
  });
});

// ── GET /api/detections ───────────────────────────────────────
const getDetections = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, duplicatesOnly } = req.query;

  const filter = { userId: req.user._id };
  if (duplicatesOnly === "true") filter.isDuplicate = true;

  const total = await Detection.countDocuments(filter);
  const detections = await Detection.find(filter)
    .populate(
      "originalFileId",
      "originalName fileType fileSize fileUrl uploadedAt"
    )
    .sort({ detectedAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    detections,
  });
});

module.exports = { detectDuplicates, getDetections };

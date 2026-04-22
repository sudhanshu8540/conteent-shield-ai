const path = require("path");
const File = require("../models/File");
const Fingerprint = require("../models/Fingerprint");
const Detection = require("../models/Detection");
const { asyncHandler } = require("../middleware/errorMiddleware");
const { categoriseFile } = require("../utils/fileUtils");
const {
  generateFileHash,
  generateHashFromString,
  computeSimilarityScore,
} = require("../utils/hashUtils");
const { getPlatformForFile } = require("../utils/platformUtils");


// ── POST /api/upload ──────────────────────────────────────────
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const isCloudinary = process.env.STORAGE_MODE === "cloudinary";
  const fileUrl = req.file.path;
  const filePath = isCloudinary ? null : req.file.path;

  const fileDoc = await File.create({
    userId: req.user._id,
    fileName: req.file.filename || req.file.public_id,
    originalName: req.file.originalname,
    fileType: categoriseFile(req.file.mimetype),
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    fileUrl,
    storageProvider: isCloudinary ? "cloudinary" : "local",
    publicId: req.file.public_id || null,
  });

  let fingerprintHash;
  try {
    fingerprintHash = filePath
      ? await generateFileHash(filePath)
      : generateHashFromString(fileUrl + req.file.originalname);
  } catch {
    fingerprintHash = generateHashFromString(
      req.file.originalname + Date.now()
    );
  }

  const exactMatch = await Fingerprint.findOne({ fingerprintHash });

  const fingerprint = await Fingerprint.create({
    fileId: fileDoc._id,
    fingerprintHash,
  });

  const allPrints = await Fingerprint.find({
    fileId: { $ne: fileDoc._id },
  }).populate("fileId");

  const matchedFiles = [];

  for (const fp of allPrints) {
    const score = computeSimilarityScore(
      fingerprintHash,
      fp.fingerprintHash
    );

    if (score >= 30) {
      matchedFiles.push({
        fileId: fp.fileId?._id,
        similarityScore: score,
        platform: getPlatformForFile(
          fp.fileId?._id?.toString() || ""
        ),
      });
    }
  }

  matchedFiles.sort((a, b) => b.similarityScore - a.similarityScore);

  const isDuplicate =
    exactMatch !== null ||
    matchedFiles.some((m) => m.similarityScore >= 90);

  const detection = await Detection.create({
    originalFileId: fileDoc._id,
    userId: req.user._id,
    matchedFiles,
    totalMatches: matchedFiles.length,
    isDuplicate,
  });

  const io = req.app.get("io");
  if (io && isDuplicate) {
    io.emit("detection:new", {
      fileId: fileDoc._id,
      fileName: fileDoc.originalName,
      totalMatches: matchedFiles.length,
      isDuplicate,
      detectedAt: detection.detectedAt,
    });
  }

  res.status(201).json({
    message: "File uploaded successfully",
    file: fileDoc,
    fingerprint: {
      id: fingerprint._id,
      hash: fingerprintHash,
    },
    detection: {
      originalFile: fileDoc,
      matchedFiles,
      isDuplicate,
      totalMatches: matchedFiles.length,
    },
  });
});


// ── GET /api/files ─────────────────────────────────────────────
const getFiles = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;

  const filter = { userId: req.user._id };
  if (type) filter.fileType = type;

  const total = await File.countDocuments(filter);

  const files = await File.find(filter)
    .sort({ uploadedAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    files,
  });
});


// ── DELETE /api/files/:id ──────────────────────────────────────
const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  await file.deleteOne();

  res.json({ message: "File deleted successfully" });
});


// ── EXPORT ────────────────────────────────────────────────────
module.exports = {
  uploadFile,
  getFiles,
  deleteFile,
};
const mongoose = require("mongoose");

const PLATFORMS = [
  "Instagram",
  "Twitter",
  "Facebook",
  "YouTube",
  "TikTok",
  "LinkedIn",
  "Pinterest",
  "Reddit",
  "Unknown",
];

const matchSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
    similarityScore: { type: Number, min: 0, max: 100 }, // percentage
    platform: { type: String, enum: PLATFORMS, default: "Unknown" },
  },
  { _id: false }
);

const detectionSchema = new mongoose.Schema(
  {
    originalFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    matchedFiles: [matchSchema],
    totalMatches: { type: Number, default: 0 },
    isDuplicate: { type: Boolean, default: false },
    detectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Detection", detectionSchema);

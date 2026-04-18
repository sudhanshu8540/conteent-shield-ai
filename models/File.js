const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ["image", "video", "audio", "pdf", "other"],
    },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true }, // bytes
    fileUrl: { type: String, required: true },
    storageProvider: {
      type: String,
      enum: ["cloudinary", "local"],
      default: "local",
    },
    publicId: { type: String }, // Cloudinary public_id (if applicable)
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);

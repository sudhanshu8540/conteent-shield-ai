const mongoose = require("mongoose");

const fingerprintSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
      unique: true,
      index: true,
    },
    fingerprintHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    algorithm: {
      type: String,
      default: "SHA-256",
    },
    metadata: {
      // extensible bucket for future perceptual-hash data
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fingerprint", fingerprintSchema);

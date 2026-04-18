const crypto = require("crypto");
const fs = require("fs");

/**
 * Generate a SHA-256 fingerprint from a file on disk.
 * @param {string} filePath  Absolute path to the uploaded file
 * @returns {Promise<string>} Hex digest
 */
const generateFileHash = (filePath) =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });

/**
 * Generate a deterministic SHA-256 from arbitrary string data
 * (used when we only have a URL / buffer, not a local path).
 * @param {string} data
 * @returns {string} Hex digest
 */
const generateHashFromString = (data) =>
  crypto.createHash("sha256").update(data).digest("hex");

/**
 * Compute a mock "similarity score" between two hex hashes.
 * Real implementation would use perceptual hashing (pHash / dHash).
 * This version counts matching nibbles as a percentage.
 * @param {string} hashA
 * @param {string} hashB
 * @returns {number} 0-100
 */
const computeSimilarityScore = (hashA, hashB) => {
  if (hashA === hashB) return 100;
  let matches = 0;
  const len = Math.min(hashA.length, hashB.length);
  for (let i = 0; i < len; i++) {
    if (hashA[i] === hashB[i]) matches++;
  }
  return Math.round((matches / len) * 100);
};

module.exports = {
  generateFileHash,
  generateHashFromString,
  computeSimilarityScore,
};

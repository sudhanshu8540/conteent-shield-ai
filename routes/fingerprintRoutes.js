const express = require("express");
const { generateFingerprint } = require("../controllers/fingerprintController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/fingerprint/generate
router.post("/generate", protect, generateFingerprint);

module.exports = router;

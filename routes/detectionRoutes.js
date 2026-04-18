const express = require("express");
const {
  detectDuplicates,
  getDetections,
} = require("../controllers/detectionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/detect
router.post("/detect", protect, detectDuplicates);

// GET /api/detections   – supports ?duplicatesOnly=true&page=1&limit=20
router.get("/detections", protect, getDetections);

module.exports = router;

const File = require("../models/File");
const Detection = require("../models/Detection");
const { asyncHandler } = require("../middleware/errorMiddleware");
const { getMockPlatformDistribution } = require("../utils/platformUtils");

// ── GET /api/analytics ────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Run all DB queries in parallel
  const [
    totalFiles,
    totalDetections,
    duplicateCount,
    fileTypeBreakdown,
    recentUploads,
  ] = await Promise.all([
    File.countDocuments({ userId }),

    Detection.countDocuments({ userId }),

    Detection.countDocuments({ userId, isDuplicate: true }),

    File.aggregate([
      { $match: { userId } },
      { $group: { _id: "$fileType", count: { $sum: 1 } } },
      { $project: { fileType: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),

    // Uploads per day for last 7 days
    File.aggregate([
      {
        $match: {
          userId,
          uploadedAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$uploadedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]),
  ]);

  // Mock accuracy: scales between 70-95% based on detection ratio
  const accuracy =
    totalDetections > 0
      ? Math.min(95, 70 + Math.floor((duplicateCount / totalDetections) * 25))
      : 0;

  res.json({
    overview: {
      totalFilesUploaded: totalFiles,
      totalDuplicatesFound: duplicateCount,
      totalDetections,
      accuracyPercentage: accuracy,
    },
    fileTypeBreakdown,
    platformDistribution: getMockPlatformDistribution(),
    uploadsLast7Days: recentUploads,
    generatedAt: new Date().toISOString(),
  });
});

module.exports = { getAnalytics };

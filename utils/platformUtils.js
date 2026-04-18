const PLATFORMS = [
  "Instagram",
  "Twitter",
  "Facebook",
  "YouTube",
  "TikTok",
  "LinkedIn",
  "Pinterest",
  "Reddit",
];

/**
 * Return a seeded-random platform name so results are reproducible
 * for the same fileId string.
 */
const getPlatformForFile = (fileIdStr) => {
  let seed = 0;
  for (let i = 0; i < fileIdStr.length; i++) {
    seed += fileIdStr.charCodeAt(i);
  }
  return PLATFORMS[seed % PLATFORMS.length];
};

/**
 * Platform distribution mock for analytics.
 */
const getMockPlatformDistribution = () =>
  PLATFORMS.map((platform) => ({
    platform,
    count: Math.floor(Math.random() * 200) + 10,
  }));

module.exports = { PLATFORMS, getPlatformForFile, getMockPlatformDistribution };

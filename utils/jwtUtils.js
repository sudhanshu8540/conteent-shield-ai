const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT for the given user id.
 */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/**
 * Verify a JWT and return the decoded payload.
 * Throws if invalid / expired.
 */
const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { generateToken, verifyToken };

const User = require("../models/User");
const { verifyToken } = require("../utils/jwtUtils");

/**
 * Protect routes – verifies Bearer JWT and attaches req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

// ✅ Step 1: Header check
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({ message: "Not authorised - no token provided" });
}

// ✅ Step 2: Token extract
const token = authHeader.split(" ")[1];

// ✅ Step 3: Token empty check
if (!token) {
  return res.status(401).json({ message: "Token missing" });
}
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { protect };

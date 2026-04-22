const express = require("express");
const { register, login } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");


const router = express.Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Profile fetched successfully",
    user: req.user
  });
});

module.exports = router;

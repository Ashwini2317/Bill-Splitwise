const express = require("express");
const { registerUser, requestOtp, loginWithOtp, logoutUser } = require("../controller/authController");
const { protect } = require("../middleware/userMiddleware");
const router = express.Router();

// Register
router.post("/register", registerUser);

// Request OTP
router.post("/otp", requestOtp);

// Login with OTP
router.post("/login", loginWithOtp);

// Logout
router.post("/logout", protect, logoutUser);

module.exports = router;

const express = require("express");
const { searchUsers, getAllUsers } = require("../controller/userController");
const { protect } = require("../middleware/userMiddleware");
const router = express.Router();

// Search users by name
router.get("/search", protect, searchUsers);

// Get all users (optional)
router.get("/", protect, getAllUsers);

module.exports = router;

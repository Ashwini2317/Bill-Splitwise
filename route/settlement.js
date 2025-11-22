const express = require("express");
const { createSettlement, getAllSettlements, getUserSettlements, updateSettlement, deleteSettlement, migrateExistingExpenses, debugDatabaseStatus } = require("../controller/settlementController");
const { protect } = require("../middleware/userMiddleware");
const router = express.Router();


// Debug endpoint - check database status
router.get("/debug", protect, debugDatabaseStatus);

// Create settlement
router.post("/", protect, createSettlement);

// Get all settlements
router.get("/", protect, getAllSettlements);

// Migrate existing expenses to settlements (run once)
router.post("/migrate", protect, migrateExistingExpenses);

// Get settlements of a user
router.get("/user/:userId", protect, getUserSettlements);

// Update settlement
router.put("/:id", protect, updateSettlement);

// Delete settlement
router.delete("/:id", protect, deleteSettlement);

module.exports = router;

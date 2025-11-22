const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/userMiddleware");

const { createExpense, getGroupExpenses, getGroupBalances, updateExpense, deleteExpense } = require("../controller/expenceController")
// --------------------- Expense CRUD ---------------------

// Create a new expense
router.post("/", protect, createExpense);

// Get all expenses of a group
router.get("/group/:groupId", protect, getGroupExpenses);

// Get balances of a group
router.get("/group/:groupId/balances", protect, getGroupBalances);

// Update an expense
router.put("/:expenseId", protect, updateExpense);

// Delete an expense
router.delete("/:expenseId", protect, deleteExpense);

module.exports = router;

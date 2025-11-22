const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/userMiddleware");
const { createGroup, getAllGroups, getGroupById, updateGroup, addMember, removeMember, updateTotalExpenses } = require("../controller/groupController");

// --------------------- Group CRUD ---------------------

// Create a new group
router.post("/", protect, createGroup);

// Get all groups
router.get("/", protect, getAllGroups);

// Get group by ID
router.get("/:groupId", protect, getGroupById);

// Update group info
router.put("/:groupId", protect, updateGroup);

// --------------------- Group Members ---------------------

// Add member to group
router.post("/:groupId/member", protect, addMember);

// Remove member from group
router.delete("/:groupId/member/:userId", protect, removeMember);

// --------------------- Update Total Expenses (optional) ---------------------
// Usually called internally from Expense controller, not exposed to public
router.post("/:groupId/totalExpenses", protect, async (req, res) => {
    const { amount } = req.body;
    await updateTotalExpenses(req.params.groupId, amount);
    res.json({ message: "Group total expenses updated" });
});

module.exports = router;

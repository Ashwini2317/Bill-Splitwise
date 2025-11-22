const expressAsyncHandler = require("express-async-handler");
const Group = require("../model/Group");
const User = require("../model/User");

// --------------------- Create Group ---------------------
const createGroup = expressAsyncHandler(async (req, res) => {
    const { name, description, category, groupImage } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Group name is required" });
    }

    // Use logged-in user as creator (from protect middleware)
    const createdBy = req.user._id;

    const group = await Group.create({
        name,
        description,
        category,
        groupImage,
        createdBy,
        members: [{ user: createdBy, role: "ADMIN" }],
    });

    // Populate and return the created group
    const populatedGroup = await Group.findById(group._id)
        .populate("createdBy", "name email")
        .populate("members.user", "name email");

    res.status(201).json({ message: "Group created successfully", group: populatedGroup });
});

// --------------------- Get Group by ID ---------------------
const getGroupById = expressAsyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
        .populate("createdBy", "name email")
        .populate("members.user", "name email");

    if (!group) return res.status(404).json({ message: "Group not found" });

    res.json(group);
});

// --------------------- Get All Groups ---------------------
const getAllGroups = expressAsyncHandler(async (req, res) => {
    // Get only groups where the logged-in user is a member
    const userId = req.user._id;

    const groups = await Group.find({
        "members.user": userId
    })
        .populate("createdBy", "name email")
        .populate("members.user", "name email")
        .sort({ createdAt: -1 });

    res.json(groups);
});

// --------------------- Update Group ---------------------
const updateGroup = expressAsyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const updates = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    Object.assign(group, updates); // Update fields
    await group.save();

    // Populate and return updated group
    const updatedGroup = await Group.findById(groupId)
        .populate("createdBy", "name email")
        .populate("members.user", "name email");

    res.json({ message: "Group updated successfully", group: updatedGroup });
});

// --------------------- Add Member ---------------------
const addMember = expressAsyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { userId, role } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if userId is an email or ObjectId
    let userIdToAdd = userId;

    // If it's an email (contains @), find the user by email
    if (userId.includes('@')) {
        const user = await User.findOne({ email: userId });
        if (!user) {
            return res.status(404).json({ message: "User with this email not found" });
        }
        userIdToAdd = user._id;
    }

    // Check if user is already a member
    const exists = group.members.some(m => m.user.toString() === userIdToAdd.toString());
    if (exists) return res.status(400).json({ message: "User is already a member" });

    group.members.push({ user: userIdToAdd, role: role || "MEMBER" });
    await group.save();

    // Populate and return updated group
    const updatedGroup = await Group.findById(groupId)
        .populate("createdBy", "name email")
        .populate("members.user", "name email");

    res.json({ message: "Member added successfully", group: updatedGroup });
});

// --------------------- Remove Member ---------------------
const removeMember = expressAsyncHandler(async (req, res) => {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.members = group.members.filter(m => m.user.toString() !== userId);
    await group.save();

    // Populate and return updated group
    const updatedGroup = await Group.findById(groupId)
        .populate("createdBy", "name email")
        .populate("members.user", "name email");

    res.json({ message: "Member removed successfully", group: updatedGroup });
});

// --------------------- Update Total Expenses ---------------------
const updateTotalExpenses = expressAsyncHandler(async (groupId, amount) => {
    const group = await Group.findById(groupId);
    if (group) {
        group.totalExpenses += amount;
        await group.save();
    }
});

module.exports = {
    createGroup,
    getGroupById,
    getAllGroups,
    updateGroup,        // Added
    addMember,
    removeMember,
    updateTotalExpenses,
};

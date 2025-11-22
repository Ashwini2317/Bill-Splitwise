const expressAsyncHandler = require("express-async-handler");
const User = require("../model/User");

// --------------------- Search Users by Name ---------------------
const searchUsers = expressAsyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    // Search users by name (case-insensitive)
    const users = await User.find({
        name: { $regex: query, $options: 'i' }
    })
    .select('_id name email phone')
    .limit(20);

    res.json(users);
});

// --------------------- Get All Users (optional) ---------------------
const getAllUsers = expressAsyncHandler(async (req, res) => {
    const users = await User.find()
        .select('_id name email phone')
        .limit(50);

    res.json(users);
});

module.exports = { searchUsers, getAllUsers };

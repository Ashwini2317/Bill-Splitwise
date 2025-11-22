const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },                         // ग्रुपची माहिती
    category: { type: String, default: "OTHER" },          // TRIP, HOME, OFFICE इ.
    groupImage: { type: String, default: "" },             // ग्रुपचा फोटो
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ग्रुप बनवणारा
    members: [                                             // ग्रुपचे मेंबर्स
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            role: { type: String, default: "MEMBER" },     // ADMIN किंवा MEMBER
            joinedAt: { type: Date, default: Date.now },   // joined date
        },
    ],
    isActive: { type: Boolean, default: true },            // ग्रुप active आहे का
    totalExpenses: { type: Number, default: 0 },           // एकूण खर्च
}, { timestamps: true });

module.exports = mongoose.model("Group", groupSchema);

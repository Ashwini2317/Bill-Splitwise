const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
    title: { type: String, required: true },                          // खर्चाचं नाव
    description: { type: String },                                    // थोडक्यात माहिती
    amount: { type: Number, required: true },                         // रक्कम
    category: { type: String, default: "OTHER" },                     // प्रकार (FOOD, TRAVEL, etc.)
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true }, // कोणत्या group मधला खर्च
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // कोणी पैसे दिले
    date: { type: Date, default: Date.now },                          // खर्चाची तारीख
    splits: [                                                         // कोण कोणावर खर्च वाटला
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            amount: { type: Number, required: true },
        },
    ],
    notes: { type: String },                                          // अतिरिक्त माहिती
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);

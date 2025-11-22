const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "UPI" },
    status: { type: String, default: "PENDING" },
    date: { type: Date, default: Date.now },

    notes: { type: String },
    proof: { type: String },

    active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Settlement", settlementSchema);

const expressAsyncHandler = require("express-async-handler");
const Settlement = require("../model/Settlement");
const Group = require("../model/Group");
const User = require("../model/User");
const Expense = require("../model/Expense");

// --------------------- Create Settlement ---------------------
const createSettlement = expressAsyncHandler(async (req, res) => {
    const { group, from, to, amount, paymentMethod, notes, proof } = req.body;

    if (!group || !from || !to || !amount) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    const settlement = await Settlement.create({
        group,
        from,
        to,
        amount,
        paymentMethod: paymentMethod || "UPI",
        notes,
        proof
    });

    res.status(201).json({ message: "Settlement created successfully", settlement });
});

// --------------------- Get All Settlements ---------------------
const getAllSettlements = expressAsyncHandler(async (req, res) => {
    const settlements = await Settlement.find()
        .populate("group", "name")
        .populate("from", "name email")
        .populate("to", "name email")
        .sort({ date: -1 });

    res.json(settlements);
});

// --------------------- Get Settlements of a User ---------------------
const getUserSettlements = expressAsyncHandler(async (req, res) => {
    const { userId } = req.params;

    console.log("========== GET USER SETTLEMENTS ==========");
    console.log("User ID from params:", userId);

    // First check total settlements in database
    const totalSettlements = await Settlement.countDocuments();
    console.log("Total settlements in database:", totalSettlements);

    const settlements = await Settlement.find({
        $or: [{ from: userId }, { to: userId }]
    })
        .populate("group", "name")
        .populate("from", "name email")
        .populate("to", "name email")
        .sort({ date: -1 });

    console.log("Settlements found for user:", settlements.length);
    console.log("Settlements data:", JSON.stringify(settlements, null, 2));
    console.log("=========================================");

    res.json(settlements);
});

// --------------------- Update Settlement ---------------------
const updateSettlement = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const settlement = await Settlement.findByIdAndUpdate(id, updates, { new: true });

    if (!settlement) return res.status(404).json({ message: "Settlement not found" });

    res.json({ message: "Settlement updated successfully", settlement });
});

// --------------------- Delete Settlement ---------------------
const deleteSettlement = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const settlement = await Settlement.findByIdAndDelete(id);
    if (!settlement) return res.status(404).json({ message: "Settlement not found" });

    res.json({ message: "Settlement deleted successfully" });
});

// --------------------- Migrate: Create Settlements for Existing Expenses ---------------------
const migrateExistingExpenses = expressAsyncHandler(async (req, res) => {
    try {
        console.log("========== MIGRATION STARTED ==========");

        // Get all expenses
        const expenses = await Expense.find({});
        console.log(`Found ${expenses.length} expenses in database`);

        let settlementsCreated = 0;
        let settlementsUpdated = 0;

        for (const expense of expenses) {
            console.log(`\nProcessing expense: ${expense.title}`);
            console.log(`  Paid by: ${expense.paidBy}`);
            console.log(`  Splits: ${expense.splits.length}`);

            // For each split in the expense
            for (const split of expense.splits) {
                // Skip if the split user is the one who paid
                if (split.user.toString() !== expense.paidBy.toString()) {
                    console.log(`  - ${split.user} owes ₹${split.amount} to ${expense.paidBy}`);

                    // Check if settlement already exists
                    const existingSettlement = await Settlement.findOne({
                        group: expense.group,
                        from: split.user,
                        to: expense.paidBy,
                        status: "PENDING"
                    });

                    if (existingSettlement) {
                        // Update existing settlement
                        existingSettlement.amount += split.amount;
                        await existingSettlement.save();
                        settlementsUpdated++;
                        console.log(`    ✓ Updated existing settlement (total: ₹${existingSettlement.amount})`);
                    } else {
                        // Create new settlement
                        const newSettlement = await Settlement.create({
                            group: expense.group,
                            from: split.user,
                            to: expense.paidBy,
                            amount: split.amount,
                            paymentMethod: "UPI",
                            status: "PENDING",
                            notes: `Settlement for expense: ${expense.title}`
                        });
                        settlementsCreated++;
                        console.log(`    ✓ Created new settlement (ID: ${newSettlement._id})`);
                    }
                } else {
                    console.log(`  - Skipping ${split.user} (same as paidBy)`);
                }
            }
        }

        console.log("\n========== MIGRATION SUMMARY ==========");
        console.log(`Total expenses: ${expenses.length}`);
        console.log(`Settlements created: ${settlementsCreated}`);
        console.log(`Settlements updated: ${settlementsUpdated}`);
        console.log("======================================");

        res.json({
            message: "Migration completed successfully",
            summary: {
                totalExpenses: expenses.length,
                settlementsCreated,
                settlementsUpdated
            }
        });
    } catch (error) {
        console.error("Migration error:", error);
        res.status(500).json({ message: "Migration failed", error: error.message });
    }
});

// --------------------- Debug: Check Database Status ---------------------
const debugDatabaseStatus = expressAsyncHandler(async (req, res) => {
    console.log("🔍 DEBUG: Checking database status...");

    const totalExpenses = await Expense.countDocuments();
    const totalSettlements = await Settlement.countDocuments();
    const totalGroups = await Group.countDocuments();
    const totalUsers = await User.countDocuments();

    console.log("📊 Counts:", { totalExpenses, totalSettlements, totalGroups, totalUsers });

    // Get some sample expenses
    const sampleExpenses = await Expense.find().limit(3).populate("paidBy", "name");
    const sampleSettlements = await Settlement.find().limit(3).populate("from to", "name");

    console.log("📝 Sample Expenses:", sampleExpenses.map(e => e.title));
    console.log("💰 Sample Settlements:", sampleSettlements.length);

    res.json({
        counts: {
            expenses: totalExpenses,
            settlements: totalSettlements,
            groups: totalGroups,
            users: totalUsers
        },
        sampleExpenses: sampleExpenses.map(e => ({
            id: e._id,
            title: e.title,
            amount: e.amount,
            paidBy: e.paidBy?.name,
            splits: e.splits.length
        })),
        sampleSettlements: sampleSettlements.map(s => ({
            id: s._id,
            from: s.from?.name,
            to: s.to?.name,
            amount: s.amount,
            status: s.status
        }))
    });
});

module.exports = {
    createSettlement,
    getAllSettlements,
    getUserSettlements,
    updateSettlement,
    deleteSettlement,
    migrateExistingExpenses,
    debugDatabaseStatus
};

const mongoose = require("mongoose");
const Expense = require("../model/Expense");
const Settlement = require("../model/Settlement");
require("dotenv").config();

/**
 * This script creates settlements for all existing expenses in the database
 * Run this ONCE to migrate old data
 */

const createSettlementsForExistingExpenses = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to database successfully!");

        // Get all expenses
        const expenses = await Expense.find({});
        console.log(`Found ${expenses.length} expenses`);

        let settlementsCreated = 0;
        let settlementsUpdated = 0;

        for (const expense of expenses) {
            console.log(`Processing expense: ${expense.title} (${expense._id})`);

            // For each split in the expense
            for (const split of expense.splits) {
                // Skip if the split user is the one who paid
                if (split.user.toString() !== expense.paidBy.toString()) {
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
                        console.log(`  ✓ Updated existing settlement (${split.user} → ${expense.paidBy}): ₹${split.amount}`);
                    } else {
                        // Create new settlement
                        await Settlement.create({
                            group: expense.group,
                            from: split.user,
                            to: expense.paidBy,
                            amount: split.amount,
                            paymentMethod: "UPI",
                            status: "PENDING",
                            notes: `Settlement for expense: ${expense.title}`
                        });
                        settlementsCreated++;
                        console.log(`  ✓ Created new settlement (${split.user} → ${expense.paidBy}): ₹${split.amount}`);
                    }
                }
            }
        }

        console.log("\n========== SUMMARY ==========");
        console.log(`Total expenses processed: ${expenses.length}`);
        console.log(`Settlements created: ${settlementsCreated}`);
        console.log(`Settlements updated: ${settlementsUpdated}`);
        console.log("============================\n");

        console.log("✅ Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during migration:", error);
        process.exit(1);
    }
};

// Run the migration
createSettlementsForExistingExpenses();

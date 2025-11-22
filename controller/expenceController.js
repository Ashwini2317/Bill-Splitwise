const expressAsyncHandler = require("express-async-handler");
const Expense = require("../model/Expense");
const Group = require("../model/Group");
const Settlement = require("../model/Settlement");

// --------------------- Create Expense ---------------------
const createExpense = expressAsyncHandler(async (req, res) => {
    const { title, description, amount, category, group, paidBy, splits, notes } = req.body;

    if (!title || !amount || !group || !paidBy || !splits || splits.length === 0) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    const expense = await Expense.create({
        title,
        description,
        amount,
        category,
        group,
        paidBy,
        splits,
        notes,
    });

    // Update group's total expenses
    const grp = await Group.findById(group);
    if (grp) {
        grp.totalExpenses += amount;
        await grp.save();
    }

    // Create settlements automatically
    console.log("========== CREATING SETTLEMENTS ==========");
    console.log("Expense:", title);
    console.log("Paid by:", paidBy);
    console.log("Splits:", splits);

    // For each split user (except paidBy), create settlement from split.user to paidBy
    for (const split of splits) {
        // Skip if the split user is the one who paid
        if (split.user.toString() !== paidBy.toString()) {
            console.log(`Processing split: ${split.user} owes ${split.amount} to ${paidBy}`);

            // Check if settlement already exists for this user pair in this group
            const existingSettlement = await Settlement.findOne({
                group: group,
                from: split.user,
                to: paidBy,
                status: "PENDING"
            });

            if (existingSettlement) {
                // Update existing settlement amount
                existingSettlement.amount += split.amount;
                await existingSettlement.save();
                console.log(`✓ Updated existing settlement: ${existingSettlement._id}, new amount: ${existingSettlement.amount}`);
            } else {
                // Create new settlement
                const newSettlement = await Settlement.create({
                    group: group,
                    from: split.user,
                    to: paidBy,
                    amount: split.amount,
                    paymentMethod: "UPI",
                    status: "PENDING",
                    notes: `Settlement for expense: ${title}`
                });
                console.log(`✓ Created new settlement: ${newSettlement._id}, amount: ${newSettlement.amount}`);
            }
        } else {
            console.log(`Skipping split for paidBy user: ${split.user}`);
        }
    }
    console.log("=========================================");

    res.status(201).json({ message: "Expense created successfully", expense });
});

// --------------------- Get Expenses of a Group ---------------------
const getGroupExpenses = expressAsyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const expenses = await Expense.find({ group: groupId })
        .populate("paidBy", "name email")
        .populate("splits.user", "name email")
        .sort({ date: -1 });

    res.json(expenses);
});

// --------------------- Get Group Balances ---------------------
const getGroupBalances = expressAsyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const expenses = await Expense.find({ group: groupId });
    const balances = {};

    expenses.forEach(exp => {
        exp.splits.forEach(split => {
            balances[split.user] = (balances[split.user] || 0) + split.amount;
        });
        balances[exp.paidBy] = (balances[exp.paidBy] || 0) - exp.amount;
    });

    res.json(balances);
});

// --------------------- Update Expense ---------------------
const updateExpense = expressAsyncHandler(async (req, res) => {
    const { expenseId } = req.params;
    const updates = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const oldAmount = expense.amount;

    Object.assign(expense, updates);
    await expense.save();

    // Update group total if amount changed
    if (updates.amount && updates.amount !== oldAmount) {
        const grp = await Group.findById(expense.group);
        if (grp) {
            grp.totalExpenses = grp.totalExpenses - oldAmount + updates.amount;
            await grp.save();
        }
    }

    res.json({ message: "Expense updated successfully", expense });
});

// --------------------- Delete Expense ---------------------
const deleteExpense = expressAsyncHandler(async (req, res) => {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const grp = await Group.findById(expense.group);
    if (grp) {
        grp.totalExpenses -= expense.amount;
        await grp.save();
    }

    // Reduce or delete settlements related to this expense
    for (const split of expense.splits) {
        if (split.user.toString() !== expense.paidBy.toString()) {
            const settlement = await Settlement.findOne({
                group: expense.group,
                from: split.user,
                to: expense.paidBy,
                status: "PENDING"
            });

            if (settlement) {
                settlement.amount -= split.amount;
                if (settlement.amount <= 0) {
                    // Delete settlement if amount becomes 0 or negative
                    await settlement.deleteOne();
                } else {
                    await settlement.save();
                }
            }
        }
    }

    await expense.deleteOne();

    res.json({ message: "Expense deleted successfully" });
});

module.exports = {
    createExpense,
    getGroupExpenses,
    getGroupBalances,
    updateExpense,
    deleteExpense
};
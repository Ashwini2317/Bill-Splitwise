import { createSlice } from "@reduxjs/toolkit";
import { expenseApi } from "../api/expenseApi";

const expenseSlice = createSlice({
    name: "expenseSlice",
    initialState: {
        expenses: JSON.parse(localStorage.getItem("expenses")) || [],
        balances: JSON.parse(localStorage.getItem("balances")) || {},
        loading: false,
        error: null,
    },
    reducers: {
        invalidate: (state) => {
            state.expenses = [];
            state.balances = {};
            localStorage.removeItem("expenses");
            localStorage.removeItem("balances");
        }
    },
    extraReducers: (builder) =>
        builder
            // ---------------- getGroupExpenses ----------------
            .addMatcher(expenseApi.endpoints.getGroupExpenses.matchPending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addMatcher(expenseApi.endpoints.getGroupExpenses.matchFulfilled, (state, { payload }) => {
                state.loading = false;
                state.expenses = payload;
                // save to localStorage
                if (payload.length > 0) {
                    localStorage.setItem(`expenses_group_${payload[0].group}`, JSON.stringify(payload));
                }
            })
            .addMatcher(expenseApi.endpoints.getGroupExpenses.matchRejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            })

            // ---------------- getGroupBalances ----------------
            .addMatcher(expenseApi.endpoints.getGroupBalances.matchPending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addMatcher(expenseApi.endpoints.getGroupBalances.matchFulfilled, (state, { payload }) => {
                state.loading = false;
                state.balances = payload;
                localStorage.setItem(`balances`, JSON.stringify(payload));
            })
            .addMatcher(expenseApi.endpoints.getGroupBalances.matchRejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            })

            // ---------------- addExpense ----------------
            .addMatcher(expenseApi.endpoints.addExpense.matchFulfilled, (state, { payload }) => {
                state.expenses.push(payload);
                localStorage.setItem(`expense_${payload._id}`, JSON.stringify(payload));
            })

            // ---------------- updateExpense ----------------
            .addMatcher(expenseApi.endpoints.updateExpense.matchFulfilled, (state, { payload }) => {
                const index = state.expenses.findIndex(e => e._id === payload._id);
                if (index !== -1) state.expenses[index] = payload;
                localStorage.setItem(`expense_${payload._id}`, JSON.stringify(payload));
            })

            // ---------------- deleteExpense ----------------
            .addMatcher(expenseApi.endpoints.deleteExpense.matchFulfilled, (state, { meta }) => {
                const expenseId = meta.arg.originalArgs;
                state.expenses = state.expenses.filter(e => e._id !== expenseId);
                localStorage.removeItem(`expense_${expenseId}`);
            })
});

export const { invalidate } = expenseSlice.actions;
export default expenseSlice.reducer;

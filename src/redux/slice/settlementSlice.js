import { createSlice } from "@reduxjs/toolkit";
import { settlementApi } from "../api/settlement";

const settlementSlice = createSlice({
    name: "settlementSlice",
    initialState: {
        settlements: JSON.parse(localStorage.getItem("settlements")) || [],
        loading: false,
        error: null,
    },
    reducers: {
        invalidate: (state) => {
            state.settlements = [];
            localStorage.removeItem("settlements");
        }
    },
    extraReducers: (builder) => {
        // ---------------- Pending ----------------
        builder.addMatcher(
            settlementApi.endpoints.getAllSettlements.matchPending ||
            settlementApi.endpoints.createSettlement.matchPending ||
            settlementApi.endpoints.updateSettlement.matchPending ||
            settlementApi.endpoints.deleteSettlement.matchPending,
            (state) => {
                state.loading = true;
                state.error = null;
            }
        );

        // ---------------- Fulfilled ----------------
        builder.addMatcher(
            settlementApi.endpoints.getAllSettlements.matchFulfilled,
            (state, { payload }) => {
                state.loading = false;
                state.settlements = payload;
                localStorage.setItem("settlements", JSON.stringify(payload));
            }
        );

        builder.addMatcher(
            settlementApi.endpoints.createSettlement.matchFulfilled,
            (state, { payload }) => {
                state.loading = false;
                state.settlements.push(payload);
                localStorage.setItem(`settlement_${payload._id}`, JSON.stringify(payload));
            }
        );

        builder.addMatcher(
            settlementApi.endpoints.updateSettlement.matchFulfilled,
            (state, { payload }) => {
                state.loading = false;
                const index = state.settlements.findIndex(s => s._id === payload._id);
                if (index !== -1) state.settlements[index] = payload;
                localStorage.setItem(`settlement_${payload._id}`, JSON.stringify(payload));
            }
        );

        builder.addMatcher(
            settlementApi.endpoints.deleteSettlement.matchFulfilled,
            (state, { meta }) => {
                state.loading = false;
                const id = meta.arg.originalArgs;
                state.settlements = state.settlements.filter(s => s._id !== id);
                localStorage.removeItem(`settlement_${id}`);
            }
        );

        // ---------------- Rejected ----------------
        builder.addMatcher(
            settlementApi.endpoints.getAllSettlements.matchRejected ||
            settlementApi.endpoints.createSettlement.matchRejected ||
            settlementApi.endpoints.updateSettlement.matchRejected ||
            settlementApi.endpoints.deleteSettlement.matchRejected,
            (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            }
        );
    }
});

export const { invalidate } = settlementSlice.actions;
export default settlementSlice.reducer;

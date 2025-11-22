import { createSlice } from "@reduxjs/toolkit";
import { groupApi } from "../api/groupApi";

const groupSlice = createSlice({
    name: "groupSlice",
    initialState: {
        groups: JSON.parse(localStorage.getItem("groups")) || [],
        lastGroup: JSON.parse(localStorage.getItem("lastGroup")) || null,
        loading: false,
        error: null,
    },
    reducers: {
        invalidate: (state) => {
            state.groups = [];
            state.lastGroup = null;
            localStorage.removeItem("groups");
            localStorage.removeItem("lastGroup");
        }
    },
    extraReducers: (builder) => {
        // ---------------- Pending ----------------
        builder.addMatcher(
            groupApi.endpoints.createGroup.matchPending ||
            groupApi.endpoints.getAllGroups.matchPending ||
            groupApi.endpoints.getGroupById.matchPending,
            (state) => {
                state.loading = true;
                state.error = null;
            }
        );

        // ---------------- Fulfilled ----------------
        builder.addMatcher(
            groupApi.endpoints.createGroup.matchFulfilled,
            (state, { payload }) => {
                state.loading = false;
                state.lastGroup = payload.group;
                localStorage.setItem("lastGroup", JSON.stringify(payload.group));
            }
        );

        builder.addMatcher(
            groupApi.endpoints.getAllGroups.matchFulfilled,
            (state, { payload }) => {
                state.loading = false;
                state.groups = payload;
                localStorage.setItem("groups", JSON.stringify(payload));
            }
        );

        builder.addMatcher(
            groupApi.endpoints.getGroupById.matchFulfilled,
            (state, { payload }) => {
                state.loading = false;
                localStorage.setItem(`group_${payload._id}`, JSON.stringify(payload));
            }
        );

        builder.addMatcher(
            groupApi.endpoints.updateGroup.matchFulfilled,
            (state, { payload }) => {
                state.loading = false;
                // Update in groups array if exists
                const index = state.groups.findIndex(g => g._id === payload._id);
                if (index !== -1) state.groups[index] = payload;
                localStorage.setItem(`group_${payload._id}`, JSON.stringify(payload));
            }
        );

        builder.addMatcher(
            groupApi.endpoints.addMember.matchFulfilled,
            (state, { payload }) => {
                state.loading = false;
                // Refresh the group data
                const index = state.groups.findIndex(g => g._id === payload._id);
                if (index !== -1) state.groups[index] = payload;
                localStorage.setItem(`group_${payload._id}`, JSON.stringify(payload));
            }
        );

        builder.addMatcher(
            groupApi.endpoints.removeMember.matchFulfilled,
            (state, { payload }) => {
                state.loading = false;
                // Refresh the group data
                const index = state.groups.findIndex(g => g._id === payload._id);
                if (index !== -1) state.groups[index] = payload;
                localStorage.setItem(`group_${payload._id}`, JSON.stringify(payload));
            }
        );

        // ---------------- Rejected ----------------
        builder.addMatcher(
            groupApi.endpoints.createGroup.matchRejected ||
            groupApi.endpoints.getAllGroups.matchRejected ||
            groupApi.endpoints.getGroupById.matchRejected ||
            groupApi.endpoints.updateGroup.matchRejected ||
            groupApi.endpoints.addMember.matchRejected ||
            groupApi.endpoints.removeMember.matchRejected,
            (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            }
        );
    }
});

export const { invalidate } = groupSlice.actions;
export default groupSlice.reducer;

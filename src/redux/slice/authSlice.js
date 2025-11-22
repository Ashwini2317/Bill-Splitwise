import { createSlice } from "@reduxjs/toolkit";
import { authApi } from "../api/authApi";

// -------------------- Auth Slice --------------------
const authSlice = createSlice({
    name: "authSlice",
    initialState: {
        user: JSON.parse(localStorage.getItem("userInfo")) || null,
        loading: false,
        error: null,
    },
    reducers: {
        invalidate: (state) => {
            state.user = null;
            localStorage.removeItem("userInfo");
        },
    },
    extraReducers: (builder) =>
        builder
            // Login with OTP
            .addMatcher(authApi.endpoints.loginWithOtp.matchPending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addMatcher(authApi.endpoints.loginWithOtp.matchFulfilled, (state, { payload }) => {
                state.loading = false;
                state.user = payload.user;
                // save to localStorage (already done in api, safe to keep)
                localStorage.setItem("userInfo", JSON.stringify(payload.user));
            })
            .addMatcher(authApi.endpoints.loginWithOtp.matchRejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            })

            // Logout
            .addMatcher(authApi.endpoints.logoutUser.matchPending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addMatcher(authApi.endpoints.logoutUser.matchFulfilled, (state) => {
                state.loading = false;
                state.user = null;
                localStorage.removeItem("userInfo");
            })
            .addMatcher(authApi.endpoints.logoutUser.matchRejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            })
});

export const { invalidate } = authSlice.actions;
export default authSlice.reducer;

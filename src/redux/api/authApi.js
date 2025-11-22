import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/api/auth`,
        credentials: "include",
    }),
    tagTypes: ["user"],
    endpoints: (builder) => ({
        registerUser: builder.mutation({
            query: (userData) => ({
                url: "/register",
                method: "POST",
                body: userData
            }),
            invalidatesTags: ["user"]
        }),
        requestOtp: builder.mutation({
            query: (userData) => ({
                url: "/otp",
                method: "POST",
                body: userData
            }),
            invalidatesTags: ["user"]
        }),
        loginWithOtp: builder.mutation({
            query: (userData) => ({
                url: "/login",
                method: "POST",
                body: userData
            }),
            invalidatesTags: ["user"],
            // ---------------- Transparent localStorage save ----------------
            transformResponse: (response) => {
                if (response?.user) {
                    localStorage.setItem("userInfo", JSON.stringify(response.user));
                }
                return response;
            }
        }),
        logoutUser: builder.mutation({
            query: () => ({
                url: "/logout",
                method: "POST"
            }),
            invalidatesTags: ["user"],
            transformResponse: (response) => {
                localStorage.removeItem("userInfo");
                return response;
            }
        }),
    })
});

export const {
    useLoginWithOtpMutation,
    useLogoutUserMutation,
    useRegisterUserMutation,
    useRequestOtpMutation
} = authApi;

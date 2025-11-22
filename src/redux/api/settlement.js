import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const settlementApi = createApi({
    reducerPath: "settlementApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/api/settlement`,
        credentials: "include",
    }),
    tagTypes: ["Settlement"],
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
    keepUnusedDataFor: 300, // Keep data for 5 minutes
    endpoints: (builder) => ({
        createSettlement: builder.mutation({
            query: (settlementData) => ({
                url: "/",
                method: "POST",
                body: settlementData,
            }),
            invalidatesTags: ["Settlement"],
            transformResponse: (response) => {
                if (response?._id) localStorage.setItem(`settlement_${response._id}`, JSON.stringify(response));
                return response;
            },
        }),
        getAllSettlements: builder.query({
            query: () => "/",
            providesTags: ["Settlement"],
            transformResponse: (response) => {
                localStorage.setItem("allSettlements", JSON.stringify(response));
                return response;
            },
        }),
        getUserSettlements: builder.query({
            query: (userId) => {
                console.log("📡 API Call: getUserSettlements for userId:", userId);
                return `/user/${userId}`;
            },
            providesTags: ["Settlement"],
            transformResponse: (response, meta, arg) => {
                console.log("✅ API Response received:", {
                    userId: arg,
                    dataLength: response?.length,
                    data: response
                });
                localStorage.setItem(`settlements_user_${arg}`, JSON.stringify(response));
                return response;
            },
        }),
        updateSettlement: builder.mutation({
            query: ({ settlementId, updates }) => ({
                url: `/${settlementId}`,
                method: "PUT",
                body: updates,
            }),
            invalidatesTags: ["Settlement"],
            transformResponse: (response) => {
                if (response?._id) localStorage.setItem(`settlement_${response._id}`, JSON.stringify(response));
                return response;
            },
        }),
        deleteSettlement: builder.mutation({
            query: (settlementId) => ({
                url: `/${settlementId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Settlement"],
            transformResponse: (response, meta, arg) => {
                localStorage.removeItem(`settlement_${arg}`);
                return response;
            },
        }),
    }),
});

export const {
    useCreateSettlementMutation,
    useGetAllSettlementsQuery,
    useGetUserSettlementsQuery,
    useUpdateSettlementMutation,
    useDeleteSettlementMutation,
} = settlementApi;

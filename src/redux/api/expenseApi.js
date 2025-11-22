import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const expenseApi = createApi({
    reducerPath: "expenseApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/api/expense`,
        credentials: "include",
    }),
    tagTypes: ["Expense"],
    refetchOnFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false, // Don't refetch when reconnecting
    refetchOnMountOrArgChange: false, // Don't refetch on mount
    keepUnusedDataFor: 300, // Keep cached data for 5 minutes
    endpoints: (builder) => ({
        getGroupExpenses: builder.query({
            query: (groupId) => `/group/${groupId}`,
            providesTags: ["Expense"],
            transformResponse: (response) => {
                localStorage.setItem(`expenses_group_${response[0]?.group}`, JSON.stringify(response));
                return response;
            },
        }),
        getGroupBalances: builder.query({
            query: (groupId) => `/group/${groupId}/balances`,
            providesTags: ["Expense"],
            transformResponse: (response, meta, arg) => {
                localStorage.setItem(`balances_group_${arg}`, JSON.stringify(response));
                return response;
            },
        }),
        addExpense: builder.mutation({
            query: (expenseData) => ({
                url: "/",
                method: "POST",
                body: expenseData,
            }),
            invalidatesTags: ["Expense"],
            transformResponse: (response) => {
                if (response?._id) localStorage.setItem(`expense_${response._id}`, JSON.stringify(response));
                return response;
            },
        }),
        updateExpense: builder.mutation({
            query: ({ expenseId, updates }) => ({
                url: `/${expenseId}`,
                method: "PUT",
                body: updates,
            }),
            invalidatesTags: ["Expense"],
            transformResponse: (response) => {
                if (response?._id) localStorage.setItem(`expense_${response._id}`, JSON.stringify(response));
                return response;
            },
        }),
        deleteExpense: builder.mutation({
            query: (expenseId) => ({
                url: `/${expenseId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Expense"],
            transformResponse: (response, meta, arg) => {
                localStorage.removeItem(`expense_${arg}`);
                return response;
            },
        }),
    }),
});

export const {
    useGetGroupExpensesQuery,
    useGetGroupBalancesQuery,
    useAddExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
} = expenseApi;

import { configureStore } from "@reduxjs/toolkit";



import { authApi } from "./api/authApi";
import { expenseApi } from "./api/expenseApi";
import { groupApi } from "./api/groupApi";
import { settlementApi } from "./api/settlement";
import authSlice from "./slice/authSlice";
import expenseSlice from "./slice/expenceSlice";
import groupSlice from "./slice/groupSlice";
import settlementSlice from "./slice/settlementSlice";

export const store = configureStore({
    reducer: {
        auth: authSlice,
        expence: expenseSlice,
        group: groupSlice,
        settlement: settlementSlice,

        [authApi.reducerPath]: authApi.reducer,
        [expenseApi.reducerPath]: expenseApi.reducer,
        [groupApi.reducerPath]: groupApi.reducer,
        [settlementApi.reducerPath]: settlementApi.reducer,
    },
    middleware: def => [...def(),
    authApi.middleware,
    expenseApi.middleware,
    groupApi.middleware,
    settlementApi.middleware
    ]
});

export default store;

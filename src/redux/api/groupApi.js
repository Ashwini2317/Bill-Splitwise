import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const groupApi = createApi({
    reducerPath: "groupApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/api/group`,
        credentials: "include",
    }),
    tagTypes: ["Group"],
    refetchOnFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false, // Don't refetch when reconnecting
    refetchOnMountOrArgChange: false, // Don't refetch on mount
    keepUnusedDataFor: 300, // Keep cached data for 5 minutes
    endpoints: (builder) => ({
        createGroup: builder.mutation({
            query: (groupData) => ({
                url: "/",
                method: "POST",
                body: groupData,
            }),
            invalidatesTags: ["Group"],
            transformResponse: (response) => {
                if (response?.group) {
                    localStorage.setItem("lastGroup", JSON.stringify(response.group));
                }
                return response;
            },
        }),
        getAllGroups: builder.query({
            query: () => "/",
            providesTags: ["Group"],
            transformResponse: (response) => {
                localStorage.setItem("groups", JSON.stringify(response));
                return response;
            },
        }),
        getGroupById: builder.query({
            query: (groupId) => `/${groupId}`,
            providesTags: ["Group"],
            transformResponse: (response) => {
                localStorage.setItem(`group_${response._id}`, JSON.stringify(response));
                return response;
            },
        }),
        updateGroup: builder.mutation({
            query: ({ groupId, updates }) => ({
                url: `/${groupId}`,
                method: "PUT",
                body: updates,
            }),
            invalidatesTags: ["Group"],
            transformResponse: (response) => {
                if (response?._id) localStorage.setItem(`group_${response._id}`, JSON.stringify(response));
                return response;
            },
        }),
        addMember: builder.mutation({
            query: ({ groupId, userId, role }) => ({
                url: `/${groupId}/member`,
                method: "POST",
                body: { userId, role },
            }),
            invalidatesTags: ["Group"],
        }),
        removeMember: builder.mutation({
            query: ({ groupId, userId }) => ({
                url: `/${groupId}/member/${userId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Group"],
        }),
    }),
});

export const {
    useCreateGroupMutation,
    useGetAllGroupsQuery,
    useGetGroupByIdQuery,
    useUpdateGroupMutation,
    useAddMemberMutation,
    useRemoveMemberMutation,
} = groupApi;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URI = "http://localhost:4000/api";

const baseQuery = fetchBaseQuery({ baseUrl: API_URI });

export const apiSlice = createApi({
  baseQuery,
  tagTypes: [],
  endpoints: (builder) => ({}),
});


// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const API_URI = "http://localhost:4000/api/auth";

// const baseQuery = fetchBaseQuery({ baseUrl: API_URI });

// export const apiSlice = createApi({
//   baseQuery,
//   tagTypes: [],
//   endpoints: (builder) => ({
//     login: builder.mutation({
//       query: ({ email, password }) => ({
//         url: '/login',
//         method: 'POST',
//         body: { email, password },
//       }),
//     }),
//   }),
// });

// export const { useLoginMutation } = apiSlice;



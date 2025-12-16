import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { apiSlice } from "./slices/apiSlice";
import userReducer from "./slices/userSlice"; 
import taskReducer from "./slices/taskSlice";
import clientReducer from "./slices/clientSlice"; 
import departmentReducer from "./slices/departmentSlice";
import projectReducer from "./slices/projectSlice";
import subtaskReducer from "./slices/subtaskSlice";

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    users: userReducer,
    departments: departmentReducer,
    clients: clientReducer,
    tasks: taskReducer,
    projects: projectReducer,
    subtasks: subtaskReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});

export default store;
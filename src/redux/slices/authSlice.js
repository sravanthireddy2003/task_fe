import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { httpPostService,httpPatchService,httpGetService} from "../../App/httpHandler";
 
 
const initialState = {
   user:JSON.parse(localStorage.getItem("userInfo")),
   isSidebarOpen: false,
   status: null,
   error: null,
   users:{}
}
 
export const authLogin = createAsyncThunk(
  "api/auth/login",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/login", data);
      const ret =response.user;
      return ret;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);
 
// export const authGoogleLogin = createAsyncThunk(
//   "api/auth/googleLogin",
//   async ( thunkAPI) => {
//     try {
//       const response = await httpGetService(`api/auth/google?code=${code}`);
//       const ret =response.user;
//       return ret;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );
 
export const authGoogleLogin = createAsyncThunk(
  "api/auth/googleLogin",
  async (code, thunkAPI) => {
    try {
      const response = await httpGetService(`api/auth/googleLogin?code=${code}`);
      return response.user; //
    } catch (error) {
      const errorMessage = error?.response?.data || "Failed to login with Google";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);
 
export const authRegister = createAsyncThunk(
  "api/auth/register",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/register", data);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);
 
export const changePassword = createAsyncThunk(
  "api/auth/changepass",
  async (data, thunkAPI) => {
    try {
      const response = await httpPatchService("api/auth/changepass", data);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);
 
 
 
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // getUser:(state,action) => {
    //   state.status = "succeeded";
    //   state.users = action.payload;
    // },
    register:(state,action)=>{
    },
    setCredentials: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");
    },
    setOpenSidebar: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
   
      // .addCase(getUser.fulfilled, (state,action) => {
      //   state.status = "succeeded";
      //   state.users = action.payload;
      // })
      .addCase(authRegister.fulfilled, (state,action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(authLogin.pending, (state) => {
        state.status = "loading";
      })
      .addCase(authLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        localStorage.setItem("userInfo", JSON.stringify(action.payload));
      })
      .addCase(authLogin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(authGoogleLogin.pending, (state) => {
        state.status = "loading";
      })
      .addCase(authGoogleLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        localStorage.setItem("userInfo", JSON.stringify(action.payload));
      })
      .addCase(authGoogleLogin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});
 
export const { setCredentials, logout, setOpenSidebar } = authSlice.actions;
 
export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
 
export default authSlice.reducer;






// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { httpPostService,httpPatchService } from "../../App/httpHandler";


// const initialState = {
//    user:JSON.parse(localStorage.getItem("userInfo")),
//    isSidebarOpen: false,
//    status: null,
//    error: null,
//    users:{}
// }

// export const authLogin = createAsyncThunk(
//   "api/auth/login",
//   async (data, thunkAPI) => {
//     try {
//       const response = await httpPostService("api/auth/login", data);
//       const ret =response.user;
//       return ret;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// export const authRegister = createAsyncThunk(
//   "api/auth/register",
//   async (data, thunkAPI) => {
//     try {
//       const response = await httpPostService("api/auth/register", data);
//       return response;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// export const changePassword = createAsyncThunk(
//   "api/auth/changepass",
//   async (data, thunkAPI) => {
//     try {
//       const response = await httpPatchService("api/auth/changepass", data);
//       return response;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );



// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     // getUser:(state,action) => {
//     //   state.status = "succeeded";
//     //   state.users = action.payload;
//     // },
//     register:(state,action)=>{
//     },
//     setCredentials: (state, action) => {
//       state.user = action.payload;
//       localStorage.setItem("userInfo", JSON.stringify(action.payload));
//     },
//     logout: (state) => {
//       state.user = null;
//       localStorage.removeItem("userInfo");
//       localStorage.removeItem("token");
//     },
//     setOpenSidebar: (state, action) => {
//       state.isSidebarOpen = action.payload;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
    
//       // .addCase(getUser.fulfilled, (state,action) => {
//       //   state.status = "succeeded";
//       //   state.users = action.payload;
//       // })
//       .addCase(authRegister.fulfilled, (state,action) => {
//         state.status = "succeeded";
//         state.user = action.payload;
//       })
//       .addCase(authLogin.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(authLogin.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.user = action.payload;
//         localStorage.setItem("userInfo", JSON.stringify(action.payload));
//       })
//       .addCase(authLogin.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       });
//   },
// });

// export const { setCredentials, logout, setOpenSidebar } = authSlice.actions;

// export const selectUser = (state) => state.auth.user;
// export const selectAuthStatus = (state) => state.auth.status;
// export const selectAuthError = (state) => state.auth.error;

// export default authSlice.reducer;




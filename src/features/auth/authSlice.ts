import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthPayload, AuthState } from "./auth.types";

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isBootstrapping: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthPayload>) => {
      state.user = action.payload.user ?? null;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      Object.assign(state, initialState);
      state.isBootstrapping = false;
    },
   setBootstrapping: (state, action: PayloadAction<boolean>) => {
  state.isBootstrapping = action.payload;
},

  },
});

export const { setCredentials, clearAuth, setBootstrapping } =
  authSlice.actions;

export default authSlice.reducer;

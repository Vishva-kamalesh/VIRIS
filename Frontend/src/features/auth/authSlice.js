import { createSlice } from '@reduxjs/toolkit';

const saved = localStorage.getItem('viris_auth');
const initial = saved
  ? JSON.parse(saved)
  : { user: null, role: null, email: null, token: null, isAuthenticated: false };

const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload.username;
      state.role = action.payload.role;
      state.email = action.payload.email || null;
      state.token = action.payload.token || null;
      state.isAuthenticated = true;

      // Persist auth state
      localStorage.setItem('viris_auth', JSON.stringify(state));

      // Store token separately for Axios interceptor
      if (action.payload.token) {
        localStorage.setItem('viris_token', action.payload.token);
      }
    },
    logout(state) {
      state.user = null;
      state.role = null;
      state.email = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('viris_auth');
      localStorage.removeItem('viris_token');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

/**
 * Auth slice — manages who is currently logged in.
 *
 * STATE SHAPE:
 * {
 *   user: { name, email, ... } | null,
 *   accessToken: "eyJ..." | null,
 *   isAuthenticated: true | false
 * }
 *
 * WHY STORE THE ACCESS TOKEN IN REDUX (MEMORY)?
 * The safest place to store a JWT is in memory (JavaScript variable).
 * - localStorage: vulnerable to XSS — any injected script can steal it
 * - sessionStorage: same risk as localStorage
 * - HttpOnly cookie: safe from JS, but we use this for the REFRESH token instead
 * - Memory (Redux): disappears on page refresh — fine because we use the
 *   refresh token cookie to silently get a new access token on load
 *
 * INTERVIEW ANSWER: "The access token lives in Redux memory. It's short-lived
 * (15 minutes) and not persisted. On refresh, the app calls /api/auth/refresh
 * using the HttpOnly cookie to get a new access token silently."
 *
 * ACTIONS:
 * - setCredentials: called after login or token refresh
 * - logout: clears all auth state
 * - updateToken: used during silent token refresh (keeps user, updates token)
 */
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    isAuthenticated: false,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
    updateToken: (state, action) => {
      // Used for silent refresh — don't clear user, just update token
      state.accessToken = action.payload;
    },
  },
});

export const { setCredentials, logout, updateToken } = authSlice.actions;
export default authSlice.reducer;

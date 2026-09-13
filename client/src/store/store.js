import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

/**
 * Redux store — single source of truth for client-side state.
 *
 * WHY REDUX TOOLKIT (RTK)?
 * Plain Redux requires a lot of boilerplate (action types, action creators,
 * reducers). RTK dramatically reduces this with createSlice(), which generates
 * action creators and action types automatically.
 *
 * WHAT GOES IN REDUX?
 * Only GLOBAL state that many components need:
 *   - Who is logged in? (auth.user)
 *   - What is the access token? (auth.accessToken)
 *
 * What does NOT go in Redux:
 *   - Server data (repositories, reviews, etc.) — fetched per-page with Axios
 *   - Form state — local useState
 *   - Loading states — local useState
 *
 * INTERVIEW ANSWER: "I use Redux for auth state because multiple components
 * (the protected route, the sidebar, the nav) all need to know if the user
 * is logged in. Instead of prop-drilling through every component, they can
 * all read from the same store."
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  // Redux DevTools works automatically in development — you can inspect state
  // in the browser's Redux DevTools extension
  devTools: process.env.NODE_ENV !== 'production',
});

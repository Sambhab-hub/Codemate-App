import axios from 'axios';
import { store } from '../store/store';
import { updateToken, logout } from '../store/slices/authSlice';

/**
 * Configured Axios instance.
 *
 * WHY A CUSTOM INSTANCE (not plain axios)?
 * - Sets baseURL once — no need to repeat http://localhost:5000 everywhere
 * - withCredentials:true — browser automatically sends the HttpOnly refresh
 *   token cookie on every request (needed for /api/auth/refresh)
 * - Interceptors add the auth token to every request automatically
 *
 * USAGE in components:
 *   import api from '../services/api';
 *   const { data } = await api.get('/github/repos');   ← no need to write /api/...
 *   const { data } = await api.post('/auth/login', { email, password });
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ────────────────────────────────────────────────────────
// Runs before EVERY request. Reads the access token from Redux and attaches it.
api.interceptors.request.use(
  (config) => {
    const { accessToken } = store.getState().auth;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ───────────────────────────────────────────────────────
// Runs after EVERY response. Handles 401 errors by attempting a silent
// token refresh before giving up and logging the user out.
//
// FLOW:
// 1. Request fails with 401 (token expired)
// 2. We call POST /api/auth/refresh (sends HttpOnly refresh cookie automatically)
// 3. If refresh succeeds → update token in Redux → retry the original request
// 4. If refresh fails → dispatch logout → user sees the login page
//
// NOTE: _retry flag prevents infinite retry loops
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true },
        );
        const newToken = data.data?.accessToken;

        // Update Redux store with new token
        store.dispatch(updateToken(newToken));

        // Flush the queue — retry all waiting requests with the new token
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];

        // Retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — log out and clear queue
        store.dispatch(logout());
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

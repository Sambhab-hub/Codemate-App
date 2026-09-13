import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store/store';
import { setCredentials } from './store/slices/authSlice';
import api from './services/api';

import ProtectedRoute from './routes/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GitHub from './pages/GitHub';
import Repositories from './pages/Repositories';
import RepositoryDetail from './pages/RepositoryDetail';
import PullRequests from './pages/PullRequests';
import PullRequestDetail from './pages/PullRequestDetail';
import Issues from './pages/Issues';
import IssueDetail from './pages/IssueDetail';
import AIReview from './pages/AIReview';
import BugAssistant from './pages/BugAssistant';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

/**
 * AppRoutes — separated so it can use useDispatch inside the Provider.
 *
 * SILENT REFRESH ON STARTUP:
 * When the user refreshes the page, Redux state is wiped (it's in memory).
 * But the HttpOnly refresh token cookie persists in the browser.
 *
 * On mount, we call POST /api/auth/refresh:
 *   - If the cookie is valid → we get a new access token → restore Redux state
 *   - If the cookie is expired/missing → user stays logged out
 *
 * During this check (initializing = true), we show a spinner.
 * Without this, users would be kicked to the login page on every page refresh.
 */
const AppRoutes = () => {
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    api.post('/auth/refresh')
      .then(({ data }) => {
        dispatch(setCredentials({
          user: data.data.user,
          accessToken: data.data.accessToken,
        }));
      })
      .catch(() => {
        // No valid session — that's fine, user will see login page
      })
      .finally(() => {
        setInitializing(false);
      });
  }, [dispatch]);

  // Show a loading screen while checking for an existing session
  if (initializing) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-white">Code<span className="text-blue-400">Mate</span></p>
          <p className="text-gray-600 text-xs mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public — auth pages */}
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected — requires authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard"          element={<Dashboard />} />
            <Route path="/github"             element={<GitHub />} />
            <Route path="/repositories"       element={<Repositories />} />
            <Route path="/repositories/:id"   element={<RepositoryDetail />} />
            <Route path="/pull-requests"      element={<PullRequests />} />
            <Route path="/pull-requests/:id"  element={<PullRequestDetail />} />
            <Route path="/issues"             element={<Issues />} />
            <Route path="/issues/:id"         element={<IssueDetail />} />
            <Route path="/ai-review"          element={<AIReview />} />
            <Route path="/bug-assistant"      element={<BugAssistant />} />
            <Route path="/settings"           element={<Settings />} />
          </Route>
        </Route>

        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  );
}

export default App;

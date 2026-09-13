import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute — guards routes that require authentication.
 *
 * HOW IT WORKS:
 * - Reads isAuthenticated from Redux
 * - If NOT authenticated → redirect to /login
 * - If authenticated → render the child routes via <Outlet />
 *
 * USAGE in App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route element={<AppLayout />}>
 *       <Route path="/dashboard" element={<Dashboard />} />
 *     </Route>
 *   </Route>
 *
 * The `replace` prop replaces the current history entry so clicking
 * the browser back button doesn't loop back to the protected page.
 *
 * INTERVIEW ANSWER: "ProtectedRoute reads the auth state from Redux.
 * If the user isn't authenticated, React Router redirects them to login.
 * If they are authenticated, <Outlet /> renders whichever child route
 * matches the current URL."
 */
const ProtectedRoute = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

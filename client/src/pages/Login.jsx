import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { GitHubIcon } from '../components/ui/Icons';
import api from '../services/api';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      // Store user + access token in Redux memory
      dispatch(setCredentials({
        user: data.data.user,
        accessToken: data.data.accessToken,
      }));
      navigate('/dashboard');
    } catch (err) {
      // Show the server's error message, or a generic fallback
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo mode — explore the UI without a real account
  const enterDemoMode = () => {
    dispatch(setCredentials({
      user: { name: 'Demo User', email: 'demo@codemate.dev' },
      accessToken: 'demo-token',
    }));
    navigate('/dashboard');
  };

  return (
    <>
      <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
      <p className="text-gray-500 text-sm mb-6">Sign in to your CodeMate account</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#30363d]" />
        <span className="text-xs text-gray-600">or</span>
        <div className="flex-1 h-px bg-[#30363d]" />
      </div>

      {/* GitHub OAuth — wired in Phase 5 */}
      <button
        onClick={() => window.location.href = '/api/github/auth'}
        className="w-full flex items-center justify-center gap-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 font-medium py-2.5 rounded-lg text-sm transition-colors mb-3"
      >
        <GitHubIcon className="w-5 h-5" />
        Continue with GitHub
      </button>

      <button
        onClick={enterDemoMode}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-[#30363d] text-gray-500 hover:text-gray-300 hover:border-gray-500 font-medium py-2.5 rounded-lg text-sm transition-colors"
      >
        ⚡ Demo Mode — explore the UI
      </button>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-400 hover:text-blue-300">
          Create one
        </Link>
      </p>
    </>
  );
};

export default Login;

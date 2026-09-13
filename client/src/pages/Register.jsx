import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { GitHubIcon } from '../components/ui/Icons';
import api from '../services/api';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', form);
      dispatch(setCredentials({
        user: data.data.user,
        accessToken: data.data.accessToken,
      }));
      navigate('/dashboard');
    } catch (err) {
      const response = err.response?.data;

      if (response?.errors) {
        // Field-level validation errors from express-validator
        const fieldErrors = {};
        response.errors.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
      } else {
        setServerError(response?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold text-white mb-1">Create an account</h2>
      <p className="text-gray-500 text-sm mb-6">Start reviewing code with AI today</p>

      {serverError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="John Smith"
            required
            className={`w-full bg-[#0d1117] border rounded-lg px-4 py-2.5 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 transition ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : 'border-[#30363d] focus:border-blue-500 focus:ring-blue-500/40'}`}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className={`w-full bg-[#0d1117] border rounded-lg px-4 py-2.5 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 transition ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : 'border-[#30363d] focus:border-blue-500 focus:ring-blue-500/40'}`}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Min. 8 chars with uppercase and number"
            required
            className={`w-full bg-[#0d1117] border rounded-lg px-4 py-2.5 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 transition ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : 'border-[#30363d] focus:border-blue-500 focus:ring-blue-500/40'}`}
          />
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#30363d]" />
        <span className="text-xs text-gray-600">or</span>
        <div className="flex-1 h-px bg-[#30363d]" />
      </div>

      <button
        onClick={() => window.location.href = '/api/github/auth'}
        className="w-full flex items-center justify-center gap-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 font-medium py-2.5 rounded-lg text-sm transition-colors"
      >
        <GitHubIcon className="w-5 h-5" />
        Sign up with GitHub
      </button>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-400 hover:text-blue-300">
          Sign in
        </Link>
      </p>
    </>
  );
};

export default Register;

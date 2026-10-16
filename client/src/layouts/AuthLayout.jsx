import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">

      <Link to="/login" className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Code<span className="text-blue-400">Mate</span>
        </h1>
        <p className="text-gray-500 text-sm text-center mt-1">
          AI-Powered Code Review
        </p>
      </Link>

      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl p-8 shadow-2xl">
        <Outlet />
      </div>

      <p className="text-gray-600 text-xs mt-8">
        © 2025 CodeMate · Built for developers
      </p>
    </div>
  );
};

export default AuthLayout;

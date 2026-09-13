import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
    <div className="text-center">
      <p className="text-6xl font-bold text-[#30363d] mb-4">404</p>
      <h1 className="text-xl font-semibold text-white mb-2">Page not found</h1>
      <p className="text-gray-500 text-sm mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFound;

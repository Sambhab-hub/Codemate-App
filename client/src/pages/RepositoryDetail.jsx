import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FolderIcon, PullRequestIcon, IssueIcon, SparklesIcon, GitHubIcon } from '../components/ui/Icons';
import api from '../services/api';

/**
 * Repository Detail Page — view specific repository details and quick actions.
 */
const RepositoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchRepo = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/repositories/${id}`);
        setRepo(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load repository details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRepo();
  }, [id]);

  const handleUntrack = async () => {
    if (!window.confirm(`Are you sure you want to stop tracking "${repo?.name}"?`)) return;

    try {
      setActionLoading(true);
      await api.delete(`/repositories/${id}`);
      navigate('/repositories');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to untrack repository.');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-400 text-sm">Loading repository details...</p>
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error || 'Repository not found.'}
        </div>
        <Link to="/repositories" className="text-blue-400 hover:underline text-sm">
          ← Back to Repositories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link to="/repositories" className="text-xs text-gray-500 hover:text-gray-300">
              Repositories /
            </Link>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
              repo.isPrivate
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
            }`}>
              {repo.isPrivate ? 'Private' : 'Public'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{repo.fullName}</h2>
          <p className="text-gray-400 text-sm mt-1">{repo.description || 'No description available.'}</p>
        </div>

        <div className="flex items-center gap-3">
          {repo.url && (
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <GitHubIcon className="w-4 h-4" />
              Open on GitHub
            </a>
          )}
          <button
            onClick={handleUntrack}
            disabled={actionLoading}
            className="border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
          >
            Untrack Repo
          </button>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <p className="text-xs text-gray-500">Language</p>
          <p className="text-sm font-semibold text-white mt-1">{repo.language || 'Unknown'}</p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <p className="text-xs text-gray-500">Default Branch</p>
          <p className="text-sm font-semibold text-white mt-1">{repo.defaultBranch}</p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <p className="text-xs text-gray-500">Owner</p>
          <p className="text-sm font-semibold text-white mt-1">{repo.owner}</p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <p className="text-xs text-gray-500">Tracked Since</p>
          <p className="text-sm font-semibold text-white mt-1">
            {new Date(repo.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/pull-requests"
            className="flex items-center gap-3 p-4 rounded-xl bg-[#21262d] hover:bg-[#282e37] border border-[#30363d] transition-colors"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <PullRequestIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Pull Requests</p>
              <p className="text-xs text-gray-500">View & review PRs</p>
            </div>
          </Link>

          <Link
            to="/ai-review"
            className="flex items-center gap-3 p-4 rounded-xl bg-[#21262d] hover:bg-[#282e37] border border-[#30363d] transition-colors"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">AI Code Review</p>
              <p className="text-xs text-gray-500">Run automated review</p>
            </div>
          </Link>

          <Link
            to="/issues"
            className="flex items-center gap-3 p-4 rounded-xl bg-[#21262d] hover:bg-[#282e37] border border-[#30363d] transition-colors"
          >
            <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
              <IssueIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Issues</p>
              <p className="text-xs text-gray-500">View repo issues</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RepositoryDetail;

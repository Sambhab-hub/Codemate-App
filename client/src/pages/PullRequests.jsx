import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PullRequestIcon, FolderIcon, SparklesIcon } from '../components/ui/Icons';
import api from '../services/api';

/**
 * Pull Requests page — view and sync open/closed pull requests across tracked repositories.
 */
const PullRequests = () => {
  const [prs, setPrs] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [selectedState, setSelectedState] = useState('open'); // 'open' | 'closed' | 'merged' | 'all'
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch tracked repositories for dropdown
  const fetchRepositories = async () => {
    try {
      const { data } = await api.get('/repositories');
      setRepositories(data.data);
    } catch (err) {
      console.error('Failed to load repositories for selector:', err.message);
    }
  };

  // Fetch pull requests with filters
  const fetchPullRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedRepoId) params.repositoryId = selectedRepoId;
      if (selectedState && selectedState !== 'all') params.state = selectedState;

      const { data } = await api.get('/pull-requests', { params });
      setPrs(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pull requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    fetchPullRequests();
  }, [selectedRepoId, selectedState]);

  // Sync PRs from GitHub for the selected repository
  const handleSyncPRs = async () => {
    if (!selectedRepoId) {
      setError('Please select a repository to sync pull requests from GitHub.');
      return;
    }

    try {
      setSyncing(true);
      setError('');
      const { data } = await api.post(`/pull-requests/sync/${selectedRepoId}?state=${selectedState}`);
      setSuccessMsg(`Synced ${data.data.length} pull request(s) from GitHub.`);
      await fetchPullRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync pull requests from GitHub.');
    } finally {
      setSyncing(false);
    }
  };

  const getStateBadge = (state) => {
    switch (state) {
      case 'open':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'merged':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'closed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Pull Requests</h2>
          <p className="text-gray-500 text-sm mt-1">
            Inspect pull requests and generate AI code reviews.
          </p>
        </div>

        {/* Sync button */}
        <button
          onClick={handleSyncPRs}
          disabled={syncing || !selectedRepoId}
          title={!selectedRepoId ? 'Select a repository to sync from GitHub' : ''}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors self-start sm:self-auto"
        >
          {syncing && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {syncing ? 'Syncing...' : 'Sync from GitHub'}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Repo Selector */}
        <div className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-gray-400" />
          <select
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Tracked Repositories</option>
            {repositories.map((repo) => (
              <option key={repo._id} value={repo._id}>
                {repo.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* State Filter Tabs */}
        <div className="flex bg-[#0d1117] border border-[#30363d] p-1 rounded-lg">
          {['open', 'closed', 'merged', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedState(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                selectedState === tab
                  ? 'bg-[#21262d] text-white border border-[#30363d]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Success alert */}
      {successMsg && (
        <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-green-400 font-bold ml-2">×</button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 font-bold ml-2">×</button>
        </div>
      )}

      {/* PR Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Loading pull requests...</p>
        </div>
      ) : prs.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="p-3 rounded-xl bg-[#21262d] mb-4">
            <PullRequestIcon className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-300 font-medium mb-1">No pull requests found</p>
          <p className="text-gray-500 text-sm max-w-xs mb-4">
            Select a tracked repository and click "Sync from GitHub" to import open pull requests.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {prs.map((pr) => (
            <div
              key={pr._id}
              className="bg-[#161b22] border border-[#30363d] hover:border-gray-600 rounded-xl p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border capitalize ${getStateBadge(pr.state)}`}>
                    {pr.state}
                  </span>
                  <span className="text-xs font-mono text-gray-500">#{pr.number}</span>
                  <Link
                    to={`/pull-requests/${pr._id}`}
                    className="text-base font-semibold text-white hover:text-blue-400 transition truncate max-w-md"
                  >
                    {pr.title}
                  </Link>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  <span>Repo: <strong className="text-gray-300">{pr.repositoryId?.fullName}</strong></span>
                  <span>·</span>
                  <span>Author: <strong className="text-gray-300">@{pr.author}</strong></span>
                  <span>·</span>
                  <span className="font-mono bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                    {pr.sourceBranch} → {pr.targetBranch}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                  to={`/pull-requests/${pr._id}`}
                  className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
                >
                  <SparklesIcon className="w-4 h-4 text-amber-400" />
                  Inspect & Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PullRequests;

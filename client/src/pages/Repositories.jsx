import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, PlusIcon, GitHubIcon } from '../components/ui/Icons';
import api from '../services/api';

/**
 * Repositories page — manage tracked repositories & import from GitHub.
 */
const Repositories = () => {
  const [activeTab, setActiveTab] = useState('tracked'); // 'tracked' | 'import'
  const [trackedRepos, setTrackedRepos] = useState([]);
  const [remoteRepos, setRemoteRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isGitHubConnected, setIsGitHubConnected] = useState(true);

  // Fetch tracked repositories
  const fetchTrackedRepos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/repositories');
      setTrackedRepos(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tracked repositories.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch remote GitHub repositories
  const fetchRemoteRepos = async () => {
    try {
      setRemoteLoading(true);
      setError('');
      const { data } = await api.get('/repositories/github-remote');
      setRemoteRepos(data.data);
      setIsGitHubConnected(true);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 401) {
        setIsGitHubConnected(false);
      } else {
        setError(err.response?.data?.message || 'Failed to load remote GitHub repositories.');
      }
    } finally {
      setRemoteLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackedRepos();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'import' && remoteRepos.length === 0 && isGitHubConnected) {
      fetchRemoteRepos();
    }
  };

  // Track a new repository
  const handleTrackRepo = async (repo) => {
    try {
      setActionId(repo.githubRepositoryId);
      setError('');
      const { data } = await api.post('/repositories', repo);
      setTrackedRepos((prev) => [data.data, ...prev]);
      setSuccessMsg(`Repository "${repo.name}" is now tracked in CodeMate.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to track repository.');
    } finally {
      setActionId(null);
    }
  };

  // Untrack a repository
  const handleUntrackRepo = async (repoId, name) => {
    if (!window.confirm(`Are you sure you want to stop tracking "${name}"?`)) return;

    try {
      setActionId(repoId);
      setError('');
      await api.delete(`/repositories/${repoId}`);
      setTrackedRepos((prev) => prev.filter((r) => r._id !== repoId));
      setSuccessMsg(`Stopped tracking "${name}".`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to untrack repository.');
    } finally {
      setActionId(null);
    }
  };

  const isTracked = (githubRepoId) => {
    return trackedRepos.some((r) => r.githubRepositoryId === githubRepoId);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Repositories</h2>
          <p className="text-gray-500 text-sm mt-1">Manage connected GitHub repositories.</p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-[#161b22] border border-[#30363d] p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => handleTabChange('tracked')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'tracked'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Tracked ({trackedRepos.length})
          </button>
          <button
            onClick={() => handleTabChange('import')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Import from GitHub
          </button>
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

      {/* ── TAB 1: TRACKED REPOSITORIES ───────────────────────────────────── */}
      {activeTab === 'tracked' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-gray-400 text-sm">Loading repositories...</p>
            </div>
          ) : trackedRepos.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="p-3 rounded-xl bg-[#21262d] mb-4">
                <FolderIcon className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-300 font-medium mb-1">No repositories tracked yet</p>
              <p className="text-gray-500 text-sm max-w-xs mb-6">
                Import repositories from your GitHub account to enable AI code reviews.
              </p>
              <button
                onClick={() => handleTabChange('import')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Import from GitHub
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trackedRepos.map((repo) => (
                <div
                  key={repo._id}
                  className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-gray-600 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        to={`/repositories/${repo._id}`}
                        className="text-base font-semibold text-blue-400 hover:underline truncate"
                      >
                        {repo.fullName}
                      </Link>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border flex-shrink-0 ${
                        repo.isPrivate
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {repo.isPrivate ? 'Private' : 'Public'}
                      </span>
                    </div>

                    <p className="text-gray-400 text-xs line-clamp-2 mb-4">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#30363d] text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        {repo.language}
                      </span>
                      <span>Branch: {repo.defaultBranch}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/repositories/${repo._id}`}
                        className="text-gray-300 hover:text-white font-medium"
                      >
                        View →
                      </Link>
                      <button
                        onClick={() => handleUntrackRepo(repo._id, repo.name)}
                        disabled={actionId === repo._id}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        Untrack
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: IMPORT FROM GITHUB ────────────────────────────────────── */}
      {activeTab === 'import' && (
        <>
          {!isGitHubConnected ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
              <div className="p-3 bg-[#21262d] rounded-xl w-fit mx-auto mb-4">
                <GitHubIcon className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">GitHub Not Connected</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                Connect your GitHub account to view and import your repositories for AI code reviews.
              </p>
              <Link
                to="/github"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Connect GitHub Account
              </Link>
            </div>
          ) : remoteLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-gray-400 text-sm">Fetching repositories from GitHub...</p>
            </div>
          ) : (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl divide-y divide-[#30363d]">
              <div className="px-5 py-3 bg-[#21262d] flex items-center justify-between text-xs font-semibold text-gray-400 rounded-t-xl">
                <span>Repository ({remoteRepos.length} found)</span>
                <span>Action</span>
              </div>

              {remoteRepos.map((repo) => {
                const tracked = isTracked(repo.githubRepositoryId);

                return (
                  <div
                    key={repo.githubRepositoryId}
                    className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#1c2128] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-200 truncate">
                          {repo.fullName}
                        </span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-medium border ${
                          repo.isPrivate
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {repo.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {repo.description || 'No description'} · {repo.language}
                      </p>
                    </div>

                    <div>
                      {tracked ? (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          Tracked ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTrackRepo(repo)}
                          disabled={actionId === repo.githubRepositoryId}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5"
                        >
                          {actionId === repo.githubRepositoryId && (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          )}
                          Track Repo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Repositories;

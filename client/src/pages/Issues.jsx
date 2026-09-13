import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IssueIcon, FolderIcon, SparklesIcon } from '../components/ui/Icons';
import api from '../services/api';

/**
 * Issues Page — view, filter, sync, and analyze GitHub issues.
 */
const Issues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [selectedState, setSelectedState] = useState('open'); // 'open' | 'closed' | 'all'
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load repositories for selector
  const fetchRepositories = async () => {
    try {
      const { data } = await api.get('/repositories');
      setRepositories(data.data);
    } catch (err) {
      console.error('Failed to load repositories:', err.message);
    }
  };

  // Load stored issues
  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedRepoId) params.repositoryId = selectedRepoId;
      if (selectedState && selectedState !== 'all') params.state = selectedState;

      const { data } = await api.get('/issues', { params });
      setIssues(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [selectedRepoId, selectedState]);

  // Sync issues from GitHub for selected repository
  const handleSyncIssues = async () => {
    if (!selectedRepoId) {
      setError('Please select a repository to sync issues from GitHub.');
      return;
    }

    try {
      setSyncing(true);
      setError('');
      const { data } = await api.post(`/issues/sync/${selectedRepoId}?state=${selectedState}`);
      setSuccessMsg(`Synced ${data.data.length} issue(s) from GitHub.`);
      await fetchIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync issues from GitHub.');
    } finally {
      setSyncing(false);
    }
  };

  // Analyze issue with AI Bug Assistant
  const handleAnalyzeIssue = async (issueId) => {
    try {
      setAnalyzingId(issueId);
      setError('');
      await api.post(`/issues/${issueId}/analyze`);
      // Redirect to Bug Assistant page where the analysis is displayed
      navigate('/bug-assistant');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze issue.');
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Issues</h2>
          <p className="text-gray-500 text-sm mt-1">
            View GitHub issues and generate AI root-cause analysis.
          </p>
        </div>

        <button
          onClick={handleSyncIssues}
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
          {['open', 'closed', 'all'].map((tab) => (
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

      {/* Issues List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="p-3 rounded-xl bg-[#21262d] mb-4">
            <IssueIcon className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-300 font-medium mb-1">No issues found</p>
          <p className="text-gray-500 text-sm max-w-xs mb-4">
            Select a tracked repository and click "Sync from GitHub" to import issues.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue._id}
              className="bg-[#161b22] border border-[#30363d] hover:border-gray-600 rounded-xl p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border capitalize ${
                    issue.state === 'open'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {issue.state}
                  </span>
                  <span className="text-xs font-mono text-gray-500">#{issue.number}</span>
                  <Link
                    to={`/issues/${issue._id}`}
                    className="text-base font-semibold text-white hover:text-blue-400 transition truncate max-w-md"
                  >
                    {issue.title}
                  </Link>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  <span>Repo: <strong className="text-gray-300">{issue.repositoryId?.fullName}</strong></span>
                  <span>·</span>
                  <span>Author: <strong className="text-gray-300">@{issue.author}</strong></span>
                </div>

                {issue.labels?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {issue.labels.map((lbl, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] bg-[#0d1117] text-gray-400 border border-[#30363d]">
                        {lbl}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => handleAnalyzeIssue(issue._id)}
                  disabled={analyzingId === issue._id}
                  className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {analyzingId === issue._id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <SparklesIcon className="w-4 h-4 text-amber-400" />
                  )}
                  Analyze with AI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Issues;

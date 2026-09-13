import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { IssueIcon, SparklesIcon, GitHubIcon } from '../components/ui/Icons';
import api from '../services/api';

/**
 * Issue Detail Page — inspect issue description, labels, and trigger AI analysis.
 */
const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/issues/${id}`);
        setIssue(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load issue details.');
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id]);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError('');
      await api.post(`/issues/${id}/analyze`);
      navigate('/bug-assistant');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze issue.');
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-400 text-sm">Loading issue details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error || 'Issue not found.'}
        </div>
        <Link to="/issues" className="text-blue-400 hover:underline text-sm">
          ← Back to Issues
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
            <Link to="/issues" className="text-xs text-gray-500 hover:text-gray-300">
              Issues /
            </Link>
            <span className="text-xs font-mono text-gray-400">#{issue.number}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${
              issue.state === 'open'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}>
              {issue.state}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{issue.title}</h2>
          <p className="text-gray-400 text-sm mt-1">
            Author: <strong className="text-gray-200">@{issue.author}</strong> · Repo: <strong className="text-gray-200">{issue.repositoryId?.fullName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {issue.url && (
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <GitHubIcon className="w-4 h-4" />
              View on GitHub
            </a>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg transition-all"
          >
            {analyzing ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SparklesIcon className="w-4 h-4 text-amber-300" />
            )}
            Analyze with AI
          </button>
        </div>
      </div>

      {/* Labels list */}
      {issue.labels?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Labels:</span>
          {issue.labels.map((lbl, idx) => (
            <span key={idx} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#161b22] text-gray-300 border border-[#30363d]">
              {lbl}
            </span>
          ))}
        </div>
      )}

      {/* Description Body Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-200">Description</h3>
        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-sans bg-[#0d1117] p-4 rounded-lg border border-[#30363d]">
          {issue.body || 'No description provided for this issue.'}
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;

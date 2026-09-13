import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SparklesIcon, CheckCircleIcon, FolderIcon, PullRequestIcon, ZapIcon } from '../components/ui/Icons';
import api from '../services/api';

/**
 * AI Code Review Page — trigger and inspect comprehensive AI PR code reviews.
 */
const AIReview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedReviewId = searchParams.get('id');
  const targetPRId = searchParams.get('prId');

  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);

  // Form modal state
  const [showTriggerModal, setShowTriggerModal] = useState(Boolean(targetPRId));
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [selectedPRId, setSelectedPRId] = useState(targetPRId || '');

  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load user's past reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/ai/reviews');
      setReviews(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load AI reviews.');
    } finally {
      setLoading(false);
    }
  };

  // Load tracked repositories for review modal
  const fetchRepositories = async () => {
    try {
      const { data } = await api.get('/repositories');
      setRepositories(data.data);
    } catch (err) {
      console.error('Failed to load repositories:', err.message);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchRepositories();
  }, []);

  // Fetch PRs when repo is selected in trigger modal
  useEffect(() => {
    if (!selectedRepoId) {
      setPullRequests([]);
      return;
    }
    api.get(`/pull-requests?repositoryId=${selectedRepoId}&state=open`)
      .then(({ data }) => setPullRequests(data.data))
      .catch((err) => console.error('Failed to load PRs:', err.message));
  }, [selectedRepoId]);

  // Fetch single review detail if URL has `id`
  useEffect(() => {
    if (!selectedReviewId) {
      setSelectedReview(null);
      return;
    }
    const fetchReviewDetail = async () => {
      try {
        setDetailLoading(true);
        const { data } = await api.get(`/ai/reviews/${selectedReviewId}`);
        setSelectedReview(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load review details.');
      } finally {
        setDetailLoading(false);
      }
    };
    fetchReviewDetail();
  }, [selectedReviewId]);

  // Trigger a new AI Review
  const handleTriggerReview = async (e) => {
    e.preventDefault();
    if (!selectedPRId) {
      setError('Please select a Pull Request to review.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const { data } = await api.post('/ai/review', { pullRequestId: selectedPRId });
      setShowTriggerModal(false);
      await fetchReviews();
      // Set active review view to newly created review
      setSearchParams({ id: data.data._id });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI code review.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':     return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'medium':   return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low':      return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:         return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high':     return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium':   return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';
      default:         return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────────
  if (selectedReviewId && selectedReview) {
    const filteredFindings = categoryFilter === 'all'
      ? selectedReview.findings
      : selectedReview.findings.filter((f) => f.category?.toLowerCase() === categoryFilter.toLowerCase());

    return (
      <div className="max-w-5xl space-y-6">
        {/* Back Link & Header */}
        <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
          <button
            onClick={() => setSearchParams({})}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            ← Back to All Reviews
          </button>
          <span className="text-xs text-gray-500">
            Reviewed on {new Date(selectedReview.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Score & Summary Banner */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Score Ring */}
            <div className="w-20 h-20 rounded-full bg-[#0d1117] border-4 border-blue-500/30 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-2xl font-extrabold text-white">
                {selectedReview.overallScore ? selectedReview.overallScore.toFixed(1) : '8.0'}
              </span>
              <span className="text-[10px] text-gray-500 font-medium uppercase">Score</span>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h2 className="text-lg font-bold text-white">
                  PR #{selectedReview.pullRequestId?.number || selectedReview.pullRequestNumber} Review
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getRiskBadge(selectedReview.riskLevel)}`}>
                  {selectedReview.riskLevel} Risk
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed max-w-2xl">
                {selectedReview.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Findings Filter & List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-white">
              Identified Findings ({filteredFindings.length})
            </h3>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 bg-[#161b22] border border-[#30363d] p-1 rounded-lg">
              {['all', 'security', 'performance', 'bug', 'quality', 'error-handling'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredFindings.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center text-gray-400 text-sm">
              No findings in category "{categoryFilter}".
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFindings.map((finding, idx) => (
                <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityBadge(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#0d1117] text-gray-400 border border-[#30363d] capitalize">
                        {finding.category}
                      </span>
                      <h4 className="text-sm font-semibold text-gray-200">{finding.title}</h4>
                    </div>

                    {finding.file && (
                      <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                        {finding.file}{finding.line ? `:L${finding.line}` : ''}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">{finding.explanation}</p>

                  {finding.recommendation && (
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs space-y-1">
                      <p className="text-gray-500 font-semibold uppercase text-[10px]">Recommendation:</p>
                      <p className="text-gray-300 font-mono">{finding.recommendation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Testing Recommendations */}
        {selectedReview.testingRecommendations?.length > 0 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-200">Recommended Test Cases</h3>
            <div className="space-y-2">
              {selectedReview.testingRecommendations.map((test, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>{test}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── REVIEWS LIST VIEW ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">AI Code Reviews</h2>
          <p className="text-gray-500 text-sm mt-1">
            Automated security, quality, and performance code auditing powered by AI.
          </p>
        </div>

        <button
          onClick={() => setShowTriggerModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-lg self-start sm:self-auto"
        >
          <SparklesIcon className="w-4 h-4 text-amber-300" />
          Run New AI Review
        </button>
      </div>

      {/* Trigger Review Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-amber-400" />
                Run AI Code Review
              </h3>
              <button onClick={() => setShowTriggerModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleTriggerReview} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Select Tracked Repository</label>
                <select
                  value={selectedRepoId}
                  onChange={(e) => setSelectedRepoId(e.target.value)}
                  required
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Repository --</option>
                  {repositories.map((repo) => (
                    <option key={repo._id} value={repo._id}>{repo.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Select Open Pull Request</label>
                <select
                  value={selectedPRId}
                  onChange={(e) => setSelectedPRId(e.target.value)}
                  required
                  disabled={!selectedRepoId}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">-- Choose Pull Request --</option>
                  {pullRequests.map((pr) => (
                    <option key={pr._id} value={pr._id}>#{pr.number} - {pr.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedPRId}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  {submitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {submitting ? 'Analyzing Code...' : 'Start Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 font-bold ml-2">×</button>
        </div>
      )}

      {/* Past Reviews List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Loading AI reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="p-3 rounded-xl bg-amber-500/10 mb-4">
            <SparklesIcon className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-gray-300 font-medium mb-1">No AI reviews generated yet</p>
          <p className="text-gray-500 text-sm max-w-xs mb-6">
            Click "Run New AI Review" or select a pull request to trigger automated code auditing.
          </p>
          <button
            onClick={() => setShowTriggerModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <SparklesIcon className="w-4 h-4" />
            Run New AI Review
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev._id}
              onClick={() => setSearchParams({ id: rev._id })}
              className="bg-[#161b22] border border-[#30363d] hover:border-gray-600 rounded-xl p-5 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border capitalize ${getRiskBadge(rev.riskLevel)}`}>
                    {rev.riskLevel} Risk
                  </span>
                  <h3 className="text-base font-semibold text-white truncate">
                    {rev.repositoryId?.fullName || 'Repository'} — PR #{rev.pullRequestNumber || rev.pullRequestId?.number}
                  </h3>
                </div>
                <p className="text-xs text-gray-400 line-clamp-1">{rev.summary}</p>
                <p className="text-[11px] text-gray-500">
                  {rev.findings?.length || 0} finding(s) identified · {new Date(rev.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{rev.overallScore ? rev.overallScore.toFixed(1) : '8.0'}</p>
                  <p className="text-[10px] text-gray-500 font-medium">OVERALL SCORE</p>
                </div>
                <span className="text-gray-400 text-sm">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIReview;

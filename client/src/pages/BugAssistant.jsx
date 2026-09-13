import { useState, useEffect } from 'react';
import { BugIcon, CheckCircleIcon, SparklesIcon, ClockIcon } from '../components/ui/Icons';
import api from '../services/api';

/**
 * AI Bug Assistant Page — plain-text bug root-cause analysis and fix generator.
 */
const BugAssistant = () => {
  const [description, setDescription] = useState('');
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch past bug analyses
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data } = await api.get('/ai/bug-analysis');
      setHistory(data.data);
    } catch (err) {
      console.error('Failed to load bug analysis history:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the bug.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/ai/bug-analysis', { description });
      setActiveAnalysis(data.data);
      await fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze bug.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':     return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'medium':   return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:         return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">AI Bug Assistant</h2>
        <p className="text-gray-500 text-sm mt-1">
          Describe a bug or error message and get AI-powered root-cause analysis & code fixes.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 font-bold ml-2">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Output */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe the bug or paste error logs
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Payment fails when the user clicks Pay twice quickly. The server logs throw a 'MongoError: E11000 duplicate key error' on the transaction ID..."
                  rows={5}
                  required
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition resize-none font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Include steps to reproduce, expected behavior, or stack traces for best analysis.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !description.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-all shadow-lg"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <BugIcon className="w-4 h-4" />
                )}
                {loading ? 'Analyzing Root Cause...' : 'Analyze Bug'}
              </button>
            </form>
          </div>

          {/* Active AI Output Card */}
          {activeAnalysis && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-semibold text-white">AI Root Cause Analysis</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getSeverityBadge(activeAnalysis.severity)}`}>
                  {activeAnalysis.severity} Severity
                </span>
              </div>

              {/* Probable Cause */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Probable Cause</h4>
                <p className="text-sm font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                  {activeAnalysis.possibleCause}
                </p>
              </div>

              {/* Explanation */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Explanation</h4>
                <p className="text-xs text-gray-300 leading-relaxed bg-[#0d1117] p-3 rounded-lg border border-[#30363d]">
                  {activeAnalysis.explanation}
                </p>
              </div>

              {/* Recommended Fix */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Recommended Fix</h4>
                <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 font-mono text-xs text-green-400 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{activeAnalysis.recommendedFix}</pre>
                </div>
              </div>

              {/* Recommended Tests */}
              {activeAnalysis.recommendedTests?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommended Tests</h4>
                  <div className="space-y-1.5">
                    {activeAnalysis.recommendedTests.map((test, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                        <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>{test}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Analysis History Sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            Analysis History ({history.length})
          </h3>

          {history.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 text-center text-xs text-gray-500">
              No past bug analyses.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setActiveAnalysis(item)}
                  className={`bg-[#161b22] border rounded-xl p-4 cursor-pointer transition space-y-2 ${
                    activeAnalysis?._id === item._id
                      ? 'border-blue-500/50 bg-[#1c2128]'
                      : 'border-[#30363d] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${getSeverityBadge(item.severity)}`}>
                      {item.severity}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-200 line-clamp-2">{item.description}</p>
                  <p className="text-[11px] text-amber-300/80 line-clamp-1">{item.possibleCause}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BugAssistant;

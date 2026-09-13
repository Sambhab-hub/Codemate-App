import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PullRequestIcon, SparklesIcon, GitHubIcon } from '../components/ui/Icons';
import api from '../services/api';

/**
 * Code Diff Block — displays git patch lines with syntax highlighting colors for diffs.
 */
const PatchDiffViewer = ({ patch }) => {
  if (!patch) {
    return <p className="text-xs text-gray-500 italic p-3">Binary file or no patch available.</p>;
  }

  const lines = patch.split('\n');

  return (
    <div className="font-mono text-xs overflow-x-auto bg-[#0d1117] p-3 rounded-b-xl border-t border-[#30363d] leading-relaxed">
      {lines.map((line, idx) => {
        let lineStyle = 'text-gray-400';
        if (line.startsWith('+') && !line.startsWith('+++')) {
          lineStyle = 'text-green-400 bg-green-500/10 block px-1 -mx-1';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          lineStyle = 'text-red-400 bg-red-500/10 block px-1 -mx-1';
        } else if (line.startsWith('@@')) {
          lineStyle = 'text-purple-400 font-semibold block bg-[#161b22] px-1 -mx-1 py-0.5 my-1';
        }

        return (
          <div key={idx} className={lineStyle}>
            {line}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Pull Request Detail Page — inspect PR details, changed files, and git code diff patches.
 */
const PullRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pr, setPr] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPR = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/pull-requests/${id}`);
        setPr(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load pull request details.');
      } finally {
        setLoading(false);
      }
    };

    fetchPR();
  }, [id]);

  useEffect(() => {
    if (!pr) return;

    const fetchFiles = async () => {
      try {
        setFilesLoading(true);
        const { data } = await api.get(`/pull-requests/${id}/files`);
        setFiles(data.data);
      } catch (err) {
        console.error('Failed to load PR diff files:', err.message);
      } finally {
        setFilesLoading(false);
      }
    };

    fetchFiles();
  }, [pr, id]);

  const handleRunAIReview = () => {
    // Navigates to AI Review page passing the selected PR in navigation state or query
    navigate(`/ai-review?prId=${id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-400 text-sm">Loading pull request details...</p>
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error || 'Pull request not found.'}
        </div>
        <Link to="/pull-requests" className="text-blue-400 hover:underline text-sm">
          ← Back to Pull Requests
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link to="/pull-requests" className="text-xs text-gray-500 hover:text-gray-300">
              Pull Requests /
            </Link>
            <span className="text-xs font-mono text-gray-400">#{pr.number}</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium border bg-green-500/10 text-green-400 border-green-500/20 capitalize">
              {pr.state}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{pr.title}</h2>
          <p className="text-gray-400 text-sm mt-1">
            Author: <strong className="text-gray-200">@{pr.author}</strong> · Repo: <strong className="text-gray-200">{pr.repositoryId?.fullName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pr.url && (
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <GitHubIcon className="w-4 h-4" />
              View on GitHub
            </a>
          )}
          <button
            onClick={handleRunAIReview}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg transition-all"
          >
            <SparklesIcon className="w-4 h-4 text-amber-300" />
            Run AI Review
          </button>
        </div>
      </div>

      {/* Branch & Meta Panel */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span>Branches:</span>
          <span className="font-mono bg-[#0d1117] text-gray-200 px-2 py-1 rounded border border-[#30363d]">
            {pr.sourceBranch} → {pr.targetBranch}
          </span>
        </div>
        <div>
          <span>Changed Files: <strong className="text-white">{files.length}</strong></span>
        </div>
      </div>

      {/* Changed Files & Code Diff Viewer */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Changed Files & Code Diff</h3>

        {filesLoading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-[#161b22] border border-[#30363d] rounded-xl">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-gray-400 text-xs">Fetching code diffs from GitHub...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center text-gray-400 text-sm">
            No changed files found for this pull request.
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file, idx) => (
              <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
                {/* File Header */}
                <div className="px-4 py-3 bg-[#21262d] flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-200 font-medium">{file.filename}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">+{file.additions}</span>
                    <span className="text-red-400">-{file.deletions}</span>
                    <span className="capitalize px-2 py-0.5 rounded text-[10px] bg-[#0d1117] text-gray-400 border border-[#30363d]">
                      {file.status}
                    </span>
                  </div>
                </div>

                {/* Diff Viewer */}
                <PatchDiffViewer patch={file.patch} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PullRequestDetail;

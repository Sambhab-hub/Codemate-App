import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GitHubIcon } from '../components/ui/Icons';
import api from '../services/api';

/**
 * GitHub Integration Page.
 * Handles OAuth connection, status display, and disconnection.
 */
const GitHub = () => {
  const [searchParams] = useSearchParams();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch current connection status from server
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/github/status');
      setConnection(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check GitHub connection status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check URL query parameters for callback status/error
    const statusParam = searchParams.get('status');
    const errorParam = searchParams.get('error');

    if (statusParam === 'connected') {
      setSuccessMsg('Successfully connected your GitHub account!');
    } else if (errorParam) {
      setError(`GitHub authorization failed: ${errorParam}`);
    }
  }, [searchParams]);

  // Initiate OAuth flow
  const handleConnect = async () => {
    try {
      setActionLoading(true);
      setError('');
      const { data } = await api.get('/github/auth');
      // Redirect user's browser to GitHub OAuth authorization URL
      window.location.href = data.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize GitHub OAuth flow.');
      setActionLoading(false);
    }
  };

  // Disconnect GitHub account
  const handleDisconnect = async () => {
    try {
      setActionLoading(true);
      setError('');
      await api.post('/github/disconnect');
      setSuccessMsg('GitHub account disconnected successfully.');
      await fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect GitHub account.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-400 text-sm">Checking GitHub connection...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">GitHub Integration</h2>
        <p className="text-gray-500 text-sm mt-1">
          Connect your GitHub account to access repositories and pull requests.
        </p>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-green-400 font-bold ml-2">×</button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 font-bold ml-2">×</button>
        </div>
      )}

      {/* Connection Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          {connection?.connected && connection.githubAvatarUrl ? (
            <img
              src={connection.githubAvatarUrl}
              alt={connection.githubUsername}
              className="w-12 h-12 rounded-full border border-[#30363d]"
            />
          ) : (
            <div className="p-3 bg-[#21262d] rounded-xl">
              <GitHubIcon className="w-8 h-8 text-gray-300" />
            </div>
          )}

          <div>
            <h3 className="text-white font-semibold">
              {connection?.connected ? `@${connection.githubUsername}` : 'GitHub Account'}
            </h3>
            <p className="text-gray-500 text-sm">
              {connection?.connected
                ? `Connected on ${new Date(connection.createdAt).toLocaleDateString()}`
                : 'Not connected'}
            </p>
          </div>

          <div className="ml-auto">
            {connection?.connected ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                Connected
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Access permissions summary */}
        <div className="space-y-3 mb-6 text-sm text-gray-400">
          <p className="font-medium text-gray-300">What CodeMate can access:</p>
          {[
            'View public & private repositories',
            'Inspect pull request changes & line diffs',
            'Read and create GitHub issues',
            'Receive webhook triggers for automatic reviews',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {connection?.connected ? (
          <button
            onClick={handleDisconnect}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 font-medium py-3 rounded-lg text-sm transition-colors"
          >
            {actionLoading && (
              <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
            )}
            Disconnect GitHub Account
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 disabled:opacity-50 font-medium py-3 rounded-lg text-sm transition-colors"
          >
            {actionLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <GitHubIcon className="w-5 h-5" />
            )}
            {actionLoading ? 'Connecting...' : 'Connect GitHub Account'}
          </button>
        )}
      </div>
    </div>
  );
};

export default GitHub;

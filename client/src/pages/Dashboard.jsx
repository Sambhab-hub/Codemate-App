import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { SparklesIcon, FolderIcon, PullRequestIcon, IssueIcon, ZapIcon, BugIcon } from '../components/ui/Icons';
import api from '../services/api';

const CATEGORY_COLORS = {
  security: '#ef4444',       // red
  performance: '#f59e0b',    // amber
  bug: '#eab308',            // yellow
  quality: '#3b82f6',        // blue
  'error-handling': '#a855f7',// purple
};

const StatCard = ({ label, value, icon: Icon, color, subtitle }) => (
  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    {subtitle && <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/analytics/dashboard');
        setStats(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-400 text-sm">Loading platform dashboard metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-3xl p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
        {error || 'Failed to load stats.'}
      </div>
    );
  }

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':     return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'medium':   return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:         return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            Real-time developer intelligence & code quality metrics
          </p>
        </div>

        <Link
          to="/ai-review"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-lg"
        >
          <SparklesIcon className="w-4 h-4 text-amber-300" />
          Run AI Review
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Tracked Repos"
          value={stats.repoCount}
          icon={FolderIcon}
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          label="Open PRs"
          value={stats.openPRCount}
          icon={PullRequestIcon}
          color="bg-purple-500/10 text-purple-400"
        />
        <StatCard
          label="AI Reviews"
          value={stats.reviewCount}
          icon={SparklesIcon}
          color="bg-amber-500/10 text-amber-400"
        />
        <StatCard
          label="Open Issues"
          value={stats.openIssueCount}
          icon={IssueIcon}
          color="bg-green-500/10 text-green-400"
        />
        <StatCard
          label="Avg Quality Score"
          value={`${stats.avgScore} / 10`}
          icon={ZapIcon}
          color="bg-indigo-500/10 text-indigo-400"
          subtitle="Based on AI reviews"
        />
      </div>

      {/* Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Analytics Panel */}
        <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
            <h3 className="text-sm font-semibold text-gray-200">Identified Findings by Category</h3>
            <span className="text-xs text-gray-500">AI Code Quality Audit</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#30363d', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category?.toLowerCase()] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200 border-b border-[#30363d] pb-3">Quick Navigation</h3>
          <div className="space-y-2.5">
            <Link
              to="/github"
              className="flex items-center justify-between p-3 rounded-lg bg-[#21262d] hover:bg-[#282e37] border border-[#30363d] transition text-xs font-medium text-gray-200"
            >
              <span>Connect GitHub Account</span>
              <span>→</span>
            </Link>

            <Link
              to="/repositories"
              className="flex items-center justify-between p-3 rounded-lg bg-[#21262d] hover:bg-[#282e37] border border-[#30363d] transition text-xs font-medium text-gray-200"
            >
              <span>Import Repositories</span>
              <span>→</span>
            </Link>

            <Link
              to="/ai-review"
              className="flex items-center justify-between p-3 rounded-lg bg-[#21262d] hover:bg-[#282e37] border border-[#30363d] transition text-xs font-medium text-gray-200"
            >
              <span className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-amber-400" />
                AI Code Reviews
              </span>
              <span>→</span>
            </Link>

            <Link
              to="/bug-assistant"
              className="flex items-center justify-between p-3 rounded-lg bg-[#21262d] hover:bg-[#282e37] border border-[#30363d] transition text-xs font-medium text-gray-200"
            >
              <span className="flex items-center gap-2">
                <BugIcon className="w-4 h-4 text-red-400" />
                AI Bug Assistant
              </span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent AI Reviews */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
          <h3 className="text-sm font-semibold text-gray-200">Recent AI Reviews</h3>
          <Link to="/ai-review" className="text-xs text-blue-400 hover:underline">
            View All →
          </Link>
        </div>

        {stats.recentReviews?.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">No AI code reviews completed yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentReviews.map((rev) => (
              <Link
                key={rev._id}
                to={`/ai-review?id=${rev._id}`}
                className="flex items-center justify-between p-3.5 rounded-lg bg-[#0d1117] hover:bg-[#161b22] border border-[#30363d] transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {rev.repositoryId?.fullName || 'Repo'} — PR #{rev.pullRequestNumber}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold border capitalize ${getRiskBadge(rev.riskLevel)}`}>
                      {rev.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1">{rev.summary}</p>
                </div>

                <div className="text-right flex-shrink-0 ml-4">
                  <span className="text-sm font-bold text-white">{rev.overallScore ? rev.overallScore.toFixed(1) : '8.0'}</span>
                  <span className="text-[10px] text-gray-500 block">SCORE</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

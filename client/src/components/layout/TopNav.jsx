import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { BellIcon, UserIcon, SparklesIcon } from '../ui/Icons';
import { connectSocket, getSocket } from '../../services/socket';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/github': 'GitHub Integration',
  '/repositories': 'Repositories',
  '/pull-requests': 'Pull Requests',
  '/ai-review': 'AI Code Review',
  '/bug-assistant': 'Bug Assistant',
  '/issues': 'Issues',
  '/settings': 'Settings',
};

const TopNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();

    if (socket) {
      const handleReviewCompleted = (data) => {
        console.log('📡 [Real-time] Review completed event received:', data);
        setNotifications((prev) => [
          {
            id: Date.now(),
            title: `AI Code Review Complete`,
            message: `Score: ${data.overallScore?.toFixed(1) || '8.0'} (${data.riskLevel || 'low'} risk)`,
            reviewId: data.reviewId,
            time: 'Just now',
          },
          ...prev,
        ]);
      };

      socket.on('review:completed', handleReviewCompleted);

      return () => {
        socket.off('review:completed', handleReviewCompleted);
      };
    }
  }, [isAuthenticated]);

  const title =
    PAGE_TITLES[pathname] ||
    Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ||
    'CodeMate';

  const unreadCount = notifications.length;

  return (
    <header className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-6 flex-shrink-0 relative">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-gray-200">{title}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#21262d] transition-colors"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-[#161b22] animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-200">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setNotifications([])}
                    className="text-[10px] text-blue-400 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-[#30363d]">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-gray-500 text-center">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (n.reviewId) navigate(`/ai-review?id=${n.reviewId}`);
                      }}
                      className="p-3 hover:bg-[#21262d] transition cursor-pointer flex items-start gap-3"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                        <SparklesIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-200">{n.title}</p>
                        <p className="text-[11px] text-gray-400 truncate">{n.message}</p>
                        <span className="text-[9px] text-gray-500 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            {user?.githubAvatarUrl ? (
              <img
                src={user.githubAvatarUrl}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-blue-400 text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-300 hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};

export default TopNav;

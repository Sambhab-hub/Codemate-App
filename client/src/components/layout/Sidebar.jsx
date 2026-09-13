import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  HomeIcon,
  GitHubIcon,
  FolderIcon,
  PullRequestIcon,
  SparklesIcon,
  BugIcon,
  IssueIcon,
  SettingsIcon,
  LogOutIcon,
} from '../ui/Icons';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', Icon: HomeIcon },
  { path: '/github', label: 'GitHub', Icon: GitHubIcon },
  { path: '/repositories', label: 'Repositories', Icon: FolderIcon },
  { path: '/pull-requests', label: 'Pull Requests', Icon: PullRequestIcon },
  { path: '/ai-review', label: 'AI Review', Icon: SparklesIcon },
  { path: '/bug-assistant', label: 'Bug Assistant', Icon: BugIcon },
  { path: '/issues', label: 'Issues', Icon: IssueIcon },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-[#161b22] border-r border-[#30363d] flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#30363d]">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Code<span className="text-blue-400">Mate</span>
        </h2>
        <p className="text-[11px] text-gray-500 mt-0.5">AI Code Review</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#21262d]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="pt-2 mt-2 border-t border-[#30363d]">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#21262d]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <SettingsIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                Settings
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-[#30363d]">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 text-xs font-bold">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-200 font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
        >
          <LogOutIcon className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

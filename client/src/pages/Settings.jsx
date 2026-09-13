import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials, logout } from '../store/slices/authSlice';
import api from '../services/api';

/**
 * Settings Page — manage profile information, password security, and account deletion.
 */
const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      setProfileMsg('');
      setProfileError('');
      const { data } = await api.put('/auth/profile', { name, email });
      dispatch(setCredentials({ user: data.data.user, accessToken }));
      setProfileMsg('Profile details updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordError('Please enter both current and new passwords.');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMsg('');
      setPasswordError('');
      await api.put('/auth/password', { currentPassword, newPassword });
      setPasswordMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError('');
      await api.delete('/auth/account');
      dispatch(logout());
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your account credentials and security preferences.</p>
      </div>

      {/* ── PROFILE SECTION ────────────────────────────────────────────── */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-200 border-b border-[#30363d] pb-3">Profile Information</h3>

        {profileMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs">
            {profileMsg}
          </div>
        )}

        {profileError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
            {profileError}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
          >
            {profileLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* ── SECURITY SECTION ───────────────────────────────────────────── */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-200 border-b border-[#30363d] pb-3">Change Password</h3>

        {passwordMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs">
            {passwordMsg}
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              minLength={8}
              required
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-gray-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
          >
            {passwordLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {passwordLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ── DANGER ZONE ────────────────────────────────────────────────── */}
      <div className="bg-[#161b22] border border-red-500/20 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-red-400 border-b border-red-500/20 pb-3">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-200">Delete Account</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently delete your account and all tracked repositories, reviews, and bug analyses.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-xs border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-red-500/30 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-red-400">Delete Account Confirmation</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete your CodeMate account? This action is permanent and cannot be undone. All your connected repositories, AI reviews, and history will be deleted.
            </p>

            {deleteError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
                {deleteError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
              >
                {deleteLoading && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

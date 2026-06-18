import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { User, KeyRound, Save } from 'lucide-react';

const profileSchema = zod.object({
  firstName: zod.string().min(1, 'First name is required.'),
  lastName: zod.string().min(1, 'Last name is required.'),
});

const passwordSchema = zod.object({
  oldPassword: zod.string().min(8, 'Old password must be at least 8 characters.'),
  newPassword: zod.string().min(8, 'New password must be at least 8 characters.'),
});

export const UserProfile = () => {
  const addToast = useToast((s) => s.addToast);
  const { user, setSession, accessToken, refreshToken } = useAuthStore();
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Profile Form
  const { register: regProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    }
  });

  // Password Form
  const { register: regPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const onUpdateProfile = async (data) => {
    if (!user) return;
    setUpdatingProfile(true);
    try {
      const res = await api.patch(`/customers/${user.userId}`, data);
      if (res.data?.success) {
        const updatedUser = res.data.data;
        // Merge with current session
        if (accessToken && refreshToken) {
          setSession(updatedUser, { accessToken, refreshToken });
        }
        addToast('Profile updated successfully.', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const onUpdatePassword = async (data) => {
    setUpdatingPassword(true);
    try {
      const res = await api.patch('/auth/change-password', data);
      if (res.data?.success) {
        addToast('Security password altered successfully.', 'success');
        resetPasswordForm();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Password update failed.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Account Settings</h1>
        <p className="text-gray-400 text-xs">Configure your shopper profile and security parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile editing form */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-6 shadow-md">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
            <User className="w-4 h-4 text-primary" /> Profile Parameters
          </h2>

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400">First Name</label>
                <input
                  type="text"
                  {...regProfile('firstName')}
                  className="bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none"
                />
                {profileErrors.firstName && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{profileErrors.firstName.message?.toString()}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400">Last Name</label>
                <input
                  type="text"
                  {...regProfile('lastName')}
                  className="bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none"
                />
                {profileErrors.lastName && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{profileErrors.lastName.message?.toString()}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-gray-500">Email Address (Immutable)</label>
              <input
                type="text"
                value={user.email}
                disabled
                className="bg-black/20 border border-white/5 p-3 rounded-lg text-gray-500 cursor-not-allowed outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" /> Save Profile Details
            </button>
          </form>
        </div>

        {/* Change password form */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-6 shadow-md">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
            <KeyRound className="w-4 h-4 text-primary" /> Security Credentials
          </h2>

          <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="space-y-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400">Current Password</label>
              <input
                type="password"
                {...regPassword('oldPassword')}
                placeholder="••••••••"
                className="bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none"
              />
              {passwordErrors.oldPassword && (
                <span className="text-xs text-rose-500 mt-1 block font-medium">{passwordErrors.oldPassword.message?.toString()}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400">New Password</label>
              <input
                type="password"
                {...regPassword('newPassword')}
                placeholder="••••••••"
                className="bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none"
              />
              {passwordErrors.newPassword && (
                <span className="text-xs text-rose-500 mt-1 block font-medium">{passwordErrors.newPassword.message?.toString()}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-all active:scale-[0.98]"
            >
              <KeyRound className="w-4 h-4" /> Change Password Credentials
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

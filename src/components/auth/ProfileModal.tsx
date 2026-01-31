import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation();
  const { user, resetPassword, deleteAccount, signOut } = useAuth();
  const { isSubscribed, subscribe } = useSubscription();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const loginMethod = user.app_metadata?.provider === 'google' ? t('googleLogin') : t('emailLogin');

  const handleResetPassword = async () => {
    setError('');
    setMessage('');
    setSubmitting(true);
    const { error } = await resetPassword(user.email!);
    if (error) {
      setError(error.message);
    } else {
      setMessage(t('resetPasswordSent'));
    }
    setSubmitting(false);
  };

  const handleDeleteAccount = async () => {
    setError('');
    setSubmitting(true);
    const { error } = await deleteAccount();
    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[#1a1030] border border-[#5b13ec]/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(91,19,236,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white/80 text-xl">
          &times;
        </button>

        <h2 className="text-2xl font-bold text-white text-center mb-6">{t('myPage')}</h2>

        {/* Account Info */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm text-white/50 uppercase tracking-wider">{t('accountInfo')}</h3>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">{t('email')}</span>
              <span className="text-white text-sm truncate max-w-[200px]">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">{t('loginMethod')}</span>
              <span className="text-white text-sm">{loginMethod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">{tc('sub.subscriptionStatus')}</span>
              {isSubscribed ? (
                <span className="text-[#5b13ec] text-sm font-medium">{tc('sub.active')}</span>
              ) : (
                <button
                  onClick={() => subscribe()}
                  className="text-[#5b13ec] text-sm font-medium hover:underline"
                >
                  {tc('sub.inactive')} · {tc('sub.subscribeNow')}
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
        {message && <p className="text-green-400 text-sm text-center mb-4">{message}</p>}

        {/* Actions */}
        <div className="space-y-3">
          {/* Reset Password - only for email login */}
          {user.app_metadata?.provider !== 'google' && (
            <button
              onClick={handleResetPassword}
              disabled={submitting}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
            >
              {t('resetPasswordButton')}
            </button>
          )}

          {/* Logout */}
          <button
            onClick={() => { signOut(); onClose(); }}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors"
          >
            {t('logout')}
          </button>

          {/* Delete Account */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 text-red-400/60 hover:text-red-400 text-sm transition-colors"
            >
              {t('deleteAccount')}
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
              <p className="text-red-400 text-sm text-center">{t('deleteAccountConfirm')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
                >
                  {t('close')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={submitting}
                  className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {t('deleteAccount')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { themes, ThemeKey } from '../../lib/themes';
import { applyTheme, type ColorMode } from '../../lib/applyTheme';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { t } = useTranslation('auth');
  const { t: tc, i18n } = useTranslation();
  const { user, session, resetPassword, deleteAccount, signOut } = useAuth();
  const { isSubscribed, isTrialing, trialEndsAt, subscribe, cancelSubscription } = useSubscription();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [profile, setProfile] = useState<{ height?: number; weight?: number; photo_url?: string; birth_date?: string; birth_hour?: number; theme?: string } | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>(() => (localStorage.getItem('theme') as ThemeKey) || 'cosmic');
  const [currentMode, setCurrentMode] = useState<ColorMode>(() => (localStorage.getItem('mystic_color_mode') as ColorMode) || 'dark');

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !session?.access_token) return;
    fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.profile) { setProfile(d.profile); if (d.profile.theme) setCurrentTheme(d.profile.theme); } })
      .catch(() => { });
  }, [isOpen, session?.access_token]);

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

  const handleThemeChange = async (key: ThemeKey) => {
    setCurrentTheme(key);
    applyTheme(key, currentMode);
    localStorage.setItem('theme', key);
    if (session?.access_token) {
      fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: key }),
      }).catch(() => {});
    }
  };

  const handleCancelSubscription = async () => {
    setError('');
    setMessage('');
    setSubmitting(true);
    const success = await cancelSubscription();
    if (success) {
      setMessage(tc('sub.cancelSuccess')); // Assuming this key exists, or use literal
      setShowCancelConfirm(false);
    } else {
      setError('Failed to cancel subscription');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--bg-panel-solid)] border border-[var(--accent-30)] rounded-2xl p-6 shadow-[0_0_40px_var(--accent-20)]"
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
            {profile?.height && (
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">{tc('profile.height')}</span>
                <span className="text-white text-sm">{profile.height} cm</span>
              </div>
            )}
            {profile?.weight && (
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">{tc('profile.weight')}</span>
                <span className="text-white text-sm">{profile.weight} kg</span>
              </div>
            )}
            {profile?.birth_date && (
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">{tc('profile.birthDate')}</span>
                <span className="text-white text-sm">{profile.birth_date}</span>
              </div>
            )}
            {profile?.birth_hour != null && (
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">{tc('profile.birthHour')}</span>
                <span className="text-white text-sm">{profile.birth_hour}{tc('profile.hourSuffix')}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">{tc('sub.subscriptionStatus')}</span>
              {isSubscribed ? (
                <div className="text-right">
                  <span className="text-[var(--accent)] text-sm font-medium">
                    {isTrialing ? tc('sub.trialActive') : tc('sub.active')}
                  </span>
                  {isTrialing && trialEndsAt && (
                    <p className="text-white/30 text-xs mt-0.5">
                      {tc('sub.trialEnds', { date: new Date(trialEndsAt).toLocaleDateString() })}
                    </p>
                  )}
                  {!showCancelConfirm ? (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-white/40 hover:text-white/60 text-xs underline mt-1 block w-full text-right"
                    >
                      {tc('sub.cancelSubscription')}
                    </button>
                  ) : (
                    <div className="mt-2 flex flex-col items-end gap-1 animate-fade-in">
                      <p className="text-white/60 text-xs">{tc('sub.confirmCancel')}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-2 py-1 text-xs text-white/40 hover:text-white/60"
                        >
                          {tc('cancel')}
                        </button>
                        <button
                          onClick={handleCancelSubscription}
                          disabled={submitting}
                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded transition-colors disabled:opacity-50"
                        >
                          {tc('sub.confirmYes')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => subscribe()}
                  className="text-[var(--accent)] text-sm font-medium hover:underline"
                >
                  {tc('sub.inactive')} · {tc('sub.subscribeNow')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Color Mode Toggle */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm text-white/50 uppercase tracking-wider">{tc('theme.colorMode', 'Mode')}</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setCurrentMode('dark');
                localStorage.setItem('mystic_color_mode', 'dark');
                applyTheme(currentTheme, 'dark');
              }}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                currentMode === 'dark'
                  ? 'border-[var(--accent)] bg-[var(--accent-10)] ring-1 ring-[var(--accent-30)]'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span>🌙</span>
              <span className={`text-xs font-medium ${currentMode === 'dark' ? 'text-white' : 'text-white/60'}`}>
                {i18n.language === 'ko' ? '다크 모드' : 'Dark'}
              </span>
            </button>
            <button
              onClick={() => {
                setCurrentMode('light');
                localStorage.setItem('mystic_color_mode', 'light');
                applyTheme(currentTheme, 'light');
              }}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                currentMode === 'light'
                  ? 'border-[var(--accent)] bg-[var(--accent-10)] ring-1 ring-[var(--accent-30)]'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span>☀️</span>
              <span className={`text-xs font-medium ${currentMode === 'light' ? 'text-white' : 'text-white/60'}`}>
                {i18n.language === 'ko' ? '라이트 모드' : 'Light'}
              </span>
            </button>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm text-white/50 uppercase tracking-wider">{tc('theme.title', 'Theme')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(themes) as ThemeKey[]).map((key) => {
              const th = themes[key];
              const isActive = currentTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                    isActive
                      ? 'border-[var(--accent)] bg-[var(--accent-10)] ring-1 ring-[var(--accent-30)]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0"
                    style={{ background: th['--accent'] }}
                  />
                  <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                    {i18n.language === 'ko' ? th.nameKo : th.name}
                  </span>
                </button>
              );
            })}
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

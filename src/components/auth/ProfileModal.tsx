import { useState, useEffect } from 'react';
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
  const { user, session, resetPassword, deleteAccount, signOut } = useAuth();
  const { isSubscribed, isTrialing, trialEndsAt, subscribe, cancelSubscription } = useSubscription();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [profile, setProfile] = useState<{ height?: number; weight?: number; photo_url?: string; birth_date?: string; birth_hour?: number; calendar_type?: string } | null>(null);

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
      .then(d => { if (d.profile) { setProfile(d.profile); } })
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
    // z-[70] 은 50 으로 되돌리지 말 것. 상설 헤더(AppHeader)도 z-50 이라 예전에는
    // 동률이었고, 모달이 헤더를 덮은 건 순전히 DOM 순서 덕이었다 — 모달을 포털로
    // 옮기거나 #app-content 에 z-*/transform/filter 가 붙는 순간 조용히 뒤집힌다.
    // 레이어 서열: 네비 40 < 헤더 50 < 토스트 60 < 모달 70.
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border border-gal-border rounded-gal-xl p-6 shadow-gal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gal-muted hover:text-gal-black text-xl">
          &times;
        </button>

        <h2 className="text-2xl font-bold text-gal-black text-center mb-6">{t('myPage')}</h2>

        {/* Account Info */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm text-gal-muted uppercase tracking-wider">{t('accountInfo')}</h3>
          <div className="bg-gal-light border border-gal-border rounded-gal-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gal-muted text-sm">{t('email')}</span>
              <span className="text-gal-black text-sm truncate max-w-[200px]">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gal-muted text-sm">{t('loginMethod')}</span>
              <span className="text-gal-black text-sm">{loginMethod}</span>
            </div>
            {profile?.height && (
              <div className="flex justify-between items-center">
                <span className="text-gal-muted text-sm">{tc('profile.height')}</span>
                <span className="text-gal-black text-sm">{profile.height} cm</span>
              </div>
            )}
            {profile?.weight && (
              <div className="flex justify-between items-center">
                <span className="text-gal-muted text-sm">{tc('profile.weight')}</span>
                <span className="text-gal-black text-sm">{profile.weight} kg</span>
              </div>
            )}
            {profile?.birth_date && (
              <div className="flex justify-between items-center">
                <span className="text-gal-muted text-sm">{tc('profile.birthDate')}</span>
                <span className="text-gal-black text-sm">
                  {profile.birth_date}
                  {profile.calendar_type && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-gal-bg text-gal-muted border border-gal-border">
                      {profile.calendar_type === 'lunar' ? tc('saju.lunar') : tc('saju.solar')}
                    </span>
                  )}
                </span>
              </div>
            )}
            {profile?.birth_hour != null && (
              <div className="flex justify-between items-center">
                <span className="text-gal-muted text-sm">{tc('profile.birthHour')}</span>
                <span className="text-gal-black text-sm">{profile.birth_hour}{tc('profile.hourSuffix')}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gal-muted text-sm">{tc('sub.subscriptionStatus')}</span>
              {isSubscribed ? (
                <div className="text-right">
                  <span className="text-gal-accent text-sm font-medium">
                    {isTrialing ? tc('sub.trialActive') : tc('sub.active')}
                  </span>
                  {isTrialing && trialEndsAt && (
                    <p className="text-gal-muted text-xs mt-0.5">
                      {tc('sub.trialEnds', { date: new Date(trialEndsAt).toLocaleDateString() })}
                    </p>
                  )}
                  {!showCancelConfirm ? (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-gal-muted hover:text-gal-body text-xs underline mt-1 block w-full text-right"
                    >
                      {tc('sub.cancelSubscription')}
                    </button>
                  ) : (
                    <div className="mt-2 flex flex-col items-end gap-1 animate-fade-in">
                      <p className="text-gal-body text-xs">{tc('sub.confirmCancel')}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-2 py-1 text-xs text-gal-muted hover:text-gal-body"
                        >
                          {tc('cancel')}
                        </button>
                        <button
                          onClick={handleCancelSubscription}
                          disabled={submitting}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-gal-sm transition-colors disabled:opacity-50"
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
                  className="text-gal-accent text-sm font-medium hover:underline"
                >
                  {tc('sub.inactive')} · {tc('sub.subscribeNow')}
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
        {message && <p className="text-green-600 text-sm text-center mb-4">{message}</p>}

        {/* Actions */}
        <div className="space-y-3">
          {/* Reset Password - only for email login */}
          {user.app_metadata?.provider !== 'google' && (
            <button
              onClick={handleResetPassword}
              disabled={submitting}
              className="w-full py-3 bg-gal-light hover:bg-gal-bg border border-gal-border rounded-gal-md text-gal-black font-medium transition-colors disabled:opacity-50"
            >
              {t('resetPasswordButton')}
            </button>
          )}

          {/* Logout */}
          <button
            onClick={() => { signOut(); onClose(); }}
            className="w-full py-3 bg-gal-light hover:bg-gal-bg border border-gal-border rounded-gal-md text-gal-black font-medium transition-colors"
          >
            {t('logout')}
          </button>

          {/* Delete Account */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 text-red-400 hover:text-red-600 text-sm transition-colors"
            >
              {t('deleteAccount')}
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-gal-lg p-4 space-y-3">
              <p className="text-red-600 text-sm text-center">{t('deleteAccountConfirm')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-gal-light hover:bg-gal-bg border border-gal-border rounded-gal-md text-gal-black text-sm transition-colors"
                >
                  {t('close')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={submitting}
                  className="flex-1 py-2 bg-red-100 hover:bg-red-200 border border-red-300 rounded-gal-md text-red-600 text-sm font-semibold transition-colors disabled:opacity-50"
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

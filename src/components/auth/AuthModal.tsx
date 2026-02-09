import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useTranslation('auth');
  const { signIn, signUp, signInWithOAuth, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setMessage(t('resetPasswordSent'));
          setTimeout(() => onClose(), 3000);
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onClose();
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setMessage(t('signupSuccess'));
        }
      }
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'kakao' | 'apple') => {
    const { error } = await signInWithOAuth(provider);
    if (error) setError(error.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-md bg-white border border-gal-border rounded-gal-xl p-6 shadow-gal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gal-muted hover:text-gal-black text-xl">
          &times;
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gal-black text-center mb-6">
          {mode === 'forgot' ? t('forgotPassword') : mode === 'login' ? t('login') : t('signup')}
        </h2>

        {mode !== 'forgot' && (
          <>
            {/* Google Login */}
            <div className="space-y-3">
              <button
                onClick={() => handleOAuth('google')}
                className="w-full py-3 bg-gal-light hover:bg-gal-bg border border-gal-border rounded-gal-md text-gal-black flex items-center justify-center gap-3 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('google')}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 h-px bg-gal-border" />
              <span className="px-3 text-gal-muted text-sm">{t('orContinueWith')}</span>
              <div className="flex-1 h-px bg-gal-border" />
            </div>
          </>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white border border-gal-border rounded-gal-md text-gal-black placeholder-gal-muted focus:outline-none focus:border-gal-accent transition-colors"
          />
          {mode !== 'forgot' && (
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white border border-gal-border rounded-gal-md text-gal-black placeholder-gal-muted focus:outline-none focus:border-gal-accent transition-colors"
            />
          )}
          {mode === 'signup' && (
            <input
              type="password"
              placeholder={t('confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white border border-gal-border rounded-gal-md text-gal-black placeholder-gal-muted focus:outline-none focus:border-gal-accent transition-colors"
            />
          )}

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {message && <p className="text-green-600 text-sm text-center">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gal-accent hover:bg-gal-accent-dark disabled:opacity-50 rounded-gal-md text-white font-semibold transition-colors"
          >
            {mode === 'forgot' ? t('sendResetEmail') : mode === 'login' ? t('loginButton') : t('signupButton')}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="text-center text-sm mt-5 space-y-2">
          {mode === 'forgot' ? (
            <p className="text-gal-muted">
              <button
                onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                className="text-gal-accent hover:underline font-semibold"
              >
                {t('backToLogin')}
              </button>
            </p>
          ) : (
            <>
              <p className="text-gal-muted">
                {mode === 'login' ? t('switchToSignup') : t('switchToLogin')}{' '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
                  className="text-gal-accent hover:underline font-semibold"
                >
                  {mode === 'login' ? t('signup') : t('login')}
                </button>
              </p>
              {mode === 'login' && (
                <p>
                  <button
                    onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                    className="text-gal-muted hover:text-gal-body text-xs"
                  >
                    {t('forgotPassword')}
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

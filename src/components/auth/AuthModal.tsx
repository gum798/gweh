import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';

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

  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC 닫기 + 포커스 트랩 + 포커스 복원. ProfileModal 과 **같은 훅**을 쓴다.
  useFocusTrap(isOpen, onClose, dialogRef);

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
    // z-[70] 은 50 으로 되돌리지 말 것. 상설 헤더(AppHeader)도 z-50 이라 예전에는
    // 동률이었고, 모달이 헤더를 덮은 건 순전히 DOM 순서 덕이었다 — 모달을 포털로
    // 옮기거나 #app-content 에 z-*/transform/filter 가 붙는 순간 조용히 뒤집힌다.
    // 레이어 서열: 네비 40 < 헤더 50 < 토스트 60 < 모달 70.
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      {/* role="dialog" 는 바깥 오버레이가 아니라 이 패널에 붙인다. 오버레이는
          배경 클릭으로 닫는 백드롭까지 포함하는 범위라, 거기에 dialog 를 걸면
          백드롭이 다이얼로그 내용의 일부라고 선언하는 셈이 된다. 포커스 트랩이
          훑는 범위(dialogRef)와도 이쪽이 일치한다. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md bg-gal-light border border-gal-border rounded-gal-xl p-6 shadow-gal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} aria-label={t('close')} className="absolute top-4 right-4 text-gal-muted hover:text-gal-black text-xl">
          &times;
        </button>

        {/* Title */}
        <h2 id="auth-modal-title" className="text-2xl font-bold text-gal-black text-center mb-6">
          {mode === 'forgot' ? t('forgotPassword') : mode === 'login' ? t('login') : t('signup')}
        </h2>

        {mode !== 'forgot' && (
          <>
            {/* Google Login */}
            <div className="space-y-3">
              <button
                onClick={() => handleOAuth('google')}
                className="w-full py-3 bg-gal-bg hover:bg-gal-light border border-gal-border rounded-gal-md text-gal-black flex items-center justify-center gap-3 transition-colors"
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
        {/* 포커스 표시를 테두리 "색 교체"로 내면 안 된다. UA 링을 끈 상태에서 그
            테두리가 유일한 포커스 단서가 되는데, gal-accent 는 채움 전용 값이라
            선으로 쓰면 입력 배경 대비 2.43:1 / 패널 대비 1.83:1 이다 — 쉬는 상태의
            gal-border(4.43 / 3.34)보다 **오히려 어두워진다**. 포커스가 오히려 덜
            보이는 표시자는 WCAG 2.4.7(A) 과 1.4.11(AA, 3:1) 을 동시에 놓친다.
            그래서 테두리는 쉬는 값 그대로 두고 gal-accent-ink 링을 덧그린다 —
            SajuTab·FashionTab·FortuneTab 의 입력 8곳이 쓰는 그 패턴이다.
            그 8곳은 포커스 시 배경도 카드색으로 올리지만 여기서는 뺐다. 그쪽
            입력은 페이지 배경 위에 있어 카드색이 "떠오르는" 효과지만, 이 패널이
            이미 카드색이라 여기서 같은 걸 하면 입력이 패널에 녹아 테두리만
            남는다. */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gal-bg border border-gal-border rounded-gal-md text-gal-black placeholder-gal-muted focus:outline-none focus:ring-1 focus:ring-gal-accent-ink transition-colors"
          />
          {mode !== 'forgot' && (
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-gal-bg border border-gal-border rounded-gal-md text-gal-black placeholder-gal-muted focus:outline-none focus:ring-1 focus:ring-gal-accent-ink transition-colors"
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
              className="w-full px-4 py-3 bg-gal-bg border border-gal-border rounded-gal-md text-gal-black placeholder-gal-muted focus:outline-none focus:ring-1 focus:ring-gal-accent-ink transition-colors"
            />
          )}

          {error && <p className="text-status-danger text-sm text-center">{error}</p>}
          {message && <p className="text-status-success text-sm text-center">{message}</p>}

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
                className="text-gal-accent-ink hover:underline font-semibold"
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
                  className="text-gal-accent-ink hover:underline font-semibold"
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

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { applyTheme } from './lib/applyTheme'
import App from './App.jsx'

// ✨ Apply saved theme + color mode
const savedTheme = (localStorage.getItem('theme') as any) || 'cosmic';
const savedMode = (localStorage.getItem('mystic_color_mode') as any) || 'light';
applyTheme(savedTheme, savedMode);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SubscriptionProvider>
        <App />
      </SubscriptionProvider>
    </AuthProvider>
  </StrictMode>,
)

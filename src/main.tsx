import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { applyTheme } from './lib/applyTheme'
import App from './App.jsx'

// ✨ Apply saved theme (falls back to 'cosmic')
applyTheme((localStorage.getItem('theme') as any) || 'cosmic')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SubscriptionProvider>
        <App />
      </SubscriptionProvider>
    </AuthProvider>
  </StrictMode>,
)

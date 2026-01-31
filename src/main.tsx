import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { applyTheme } from './lib/applyTheme'
import App from './App.jsx'

// ✨ Apply theme — change the argument to switch skins:
// 'cosmic' | 'celestial' | 'ember' | 'jade'
applyTheme('cosmic')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SubscriptionProvider>
        <App />
      </SubscriptionProvider>
    </AuthProvider>
  </StrictMode>,
)

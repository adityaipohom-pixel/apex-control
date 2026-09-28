import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SettingsProvider } from './hooks/useSettings'
import { ToastProvider } from './hooks/useToast'
import { AppsProvider } from './hooks/useApps'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <SettingsProvider>
      <ToastProvider>
        <AppsProvider>
          <App />
        </AppsProvider>
      </ToastProvider>
    </SettingsProvider>
  </React.StrictMode>,
)

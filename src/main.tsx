import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthGate } from './auth/AuthGate.tsx'
import './index.css'

try {
  document.documentElement.classList.toggle('dark', localStorage.getItem('transban_theme') !== 'light')
} catch {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>,
)

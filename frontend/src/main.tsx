import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/shadcn.css'
import './styles/app.css'
import App from './App'

const root = createRoot(document.getElementById('root')!)

// Dev-only component gallery behind /_demo. Stripped from production builds
// because import.meta.env.DEV is statically false there.
if (import.meta.env.DEV && window.location.pathname === '/_demo') {
  void import('./demo/DemoView').then(({ DemoView }) => {
    root.render(
      <React.StrictMode>
        <DemoView />
      </React.StrictMode>,
    )
  })
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

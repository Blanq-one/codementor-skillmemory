import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/shadcn.css'
import './styles/app.css'
import App from './App'

const root = createRoot(document.getElementById('root')!)

// Dev-only routes. Stripped from production builds because import.meta.env.DEV
// is statically false there.
const devPath = import.meta.env.DEV ? window.location.pathname : ''

if (devPath === '/_demo') {
  void import('./demo/DemoView').then(({ DemoView }) => {
    root.render(
      <React.StrictMode>
        <DemoView />
      </React.StrictMode>,
    )
  })
} else if (
  devPath === '/_chat' ||
  devPath === '/_dashboard' ||
  devPath === '/_app' ||
  devPath === '/_live'
) {
  const initial = devPath === '/_dashboard' ? 'dashboard' : 'chat'
  const live = devPath === '/_live'
  void import('./redesign/RedesignApp').then(({ RedesignApp }) => {
    root.render(
      <React.StrictMode>
        <RedesignApp initial={initial} live={live} />
      </React.StrictMode>,
    )
  })
} else if (devPath === '/_shell') {
  void import('./redesign/shell/ShellPreview').then(({ ShellPreview }) => {
    root.render(
      <React.StrictMode>
        <ShellPreview />
      </React.StrictMode>,
    )
  })
} else if (devPath === '/_legacy') {
  // The previous UI, kept as a fallback.
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  // Default "/" — the real product entry (redesign).
  void import('./redesign/RootApp').then(({ RootApp }) => {
    root.render(
      <React.StrictMode>
        <RootApp />
      </React.StrictMode>,
    )
  })
}

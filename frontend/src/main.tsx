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
} else if (devPath === '/_chat' || devPath === '/_dashboard' || devPath === '/_app') {
  const initial = devPath === '/_dashboard' ? 'dashboard' : 'chat'
  void import('./redesign/RedesignApp').then(({ RedesignApp }) => {
    root.render(
      <React.StrictMode>
        <RedesignApp initial={initial} />
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
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

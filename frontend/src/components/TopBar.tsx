import type { Theme } from '../hooks/useTheme'

interface Props {
  theme: Theme
  onToggleTheme: () => void
  connected: boolean
}

function SunIcon() {
  return (
    <svg className="toggle__icon" viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.3" />
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13" />
      </g>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="toggle__icon" viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <path
        d="M13.5 9.8A5.5 5.5 0 0 1 6.2 2.5a5.5 5.5 0 1 0 7.3 7.3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TopBar({ theme, onToggleTheme, connected }: Props) {
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand__mark">CodeAtlas</span>
        <span className="brand__sub">skill memory</span>
      </div>
      <div className="topbar__right">
        <span className="conn" title={connected ? 'Backend reachable' : 'Backend not reachable'}>
          <span className={`conn__dot${connected ? '' : ' conn__dot--off'}`} />
          {connected ? 'connected' : 'offline'}
        </span>
        <button
          type="button"
          className="toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${next} theme`}
        >
          {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
          <span className="toggle__label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </header>
  )
}

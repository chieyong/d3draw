import { Component } from 'react'

/**
 * Vangt fouten uit het tekenen op. Moet een class zijn - React kent geen
 * hook-variant van componentDidCatch.
 *
 * Hoort in de renderer, niet in de editor: juist in de gebakken export,
 * waar niemand een console openslaat, is een wit scherm het ergste dat er
 * kan gebeuren. Een leesbare melding laat de rest van de pagina staan.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    const { error } = this.state
    const { children, theme, title = 'De visualisatie kon niet getekend worden' } = this.props
    // Bewuste uitzondering op "alles uit de spec": deze melding moet ook
    // kunnen tekenen wanneer juist de spec stuk of onvolledig is.
    if (!error) return children

    return (
      <div
        role="alert"
        style={{
          fontFamily: `${theme?.fontBody ?? 'monospace'}, ui-monospace, monospace`,
          fontSize: 12,
          lineHeight: 1.6,
          color: theme?.ink ?? '#1a1a2e',
          background: theme?.background ?? '#fdf6ec',
          border: '1px solid rgba(26,26,46,0.25)',
          borderRadius: 4,
          padding: '1rem 1.25rem',
        }}
      >
        <strong>{title}</strong>
        <p style={{ margin: '0.4rem 0 0', opacity: 0.85 }}>{error.message}</p>
      </div>
    )
  }
}

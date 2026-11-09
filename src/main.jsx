import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Any unexpected error shows a friendly message with a reload button instead of a blank page.
class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(e) {
    console.error(e)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="mx-auto max-w-xl px-4 pt-14">
        <h1 className="text-3xl font-bold text-tinta">Algo deu errado</h1>
        <p className="mt-3 text-lg">Suas escolhas já confirmadas estão guardadas. Toque abaixo para abrir de novo.</p>
        <button onClick={() => location.reload()} className="mt-6 min-h-14 rounded-2xl bg-tinta px-6 text-lg font-bold text-papel">
          Abrir de novo
        </button>
      </main>
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </StrictMode>,
)

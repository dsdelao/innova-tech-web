import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// El build inyecta el HTML prerenderizado en #root (scripts/prerender.mjs).
// Con contenido ya presente se hidrata encima; en dev, donde #root viene
// vacio, se monta desde cero igual que siempre.
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}

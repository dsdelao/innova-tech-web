import { StrictMode } from "react"
import { renderToString } from "react-dom/server"
import App from "./App"

// Prerender: mismo arbol que monta src/main.tsx, para que `#root` llegue
// poblado en el HTML (indexable con JS desactivado).
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

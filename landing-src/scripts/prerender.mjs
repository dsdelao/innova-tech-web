// Post-proceso de `npm run build`: renderiza <App/> con react-dom/server y
// mete el HTML dentro de <div id="root"></div> de ../landing/index.html.
// Se ejecuta DESPUES de `vite build`, usando el propio Vite en modo SSR
// (ssrLoadModule) para compilar el TSX sin generar un segundo bundle.
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createServer } from "vite"

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, "..") // landing-src/
const outFile = path.resolve(root, "..", "landing", "index.html")
const MARKER = '<div id="root"></div>'

// renderToString escapa <, > y & en los hijos de texto. Eso es correcto en
// HTML normal (el parser los decodifica), pero <style> es un elemento de texto
// crudo: si quedara "&gt;" el CSS con selectores hijo (`.a>.b`) se romperia y
// la hidratacion no casaria. Aqui se deshace el escaping SOLO dentro de
// <style>...</style>, que es el unico texto crudo del arbol.
const unescapeStyleBlocks = (html) =>
  html.replace(/<style>([\s\S]*?)<\/style>/g, (_m, css) => {
    const raw = css
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, "&")
    return "<style>" + raw + "</style>"
  })

let html = ""
const server = await createServer({
  root,
  appType: "custom",
  server: { middlewareMode: true },
  logLevel: "warn",
})
try {
  const mod = await server.ssrLoadModule("/src/prerender.tsx")
  html = unescapeStyleBlocks(mod.render())
} finally {
  await server.close()
}

// Red de seguridad: nunca inyectar markup vacio o a medias.
const missing = ["data-section", "<h1", "nf-faq", "<footer"].filter(
  (needle) => !html.includes(needle),
)
if (html.length < 10000 || missing.length) {
  console.error(
    "[prerender] HTML incompleto (" + html.length + " bytes), faltan: " + missing.join(", "),
  )
  process.exit(1)
}

const doc = await readFile(outFile, "utf8")
if (/<div id="root">(?!\s*<\/div>)/.test(doc)) {
  console.error("[prerender] " + outFile + " ya estaba prerenderizado")
  process.exit(1)
}
if (!doc.includes(MARKER)) {
  console.error("[prerender] no se encontro " + MARKER + " en " + outFile)
  process.exit(1)
}
await writeFile(outFile, doc.replace(MARKER, '<div id="root">' + html + "</div>"))
console.log("[prerender] OK: " + html.length + " bytes inyectados en landing/index.html")

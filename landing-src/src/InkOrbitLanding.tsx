// Ink Orbit SaaS Template — a monochrome landing page for an AI product:
// framed sticky nav, a hero with a generative ink sculpture, a bento of live
// workflow diagrams, an about block with counting stats, FAQ, a sign-up band
// and a footer. Everything sits on white panels over a hatched page, held by
// thin corner brackets.
//
// The sculpture is a seeded 3D point cloud — stippled ink loops caging a glass
// sphere that refracts what's behind it. It turns on its own, leans toward the
// pointer, can be dragged and flicked, and a click "reforges" it: every grain
// morphs into a new seed's shape.
//
// Every picture is drawn in this file (canvas + SVG). Nothing loads at runtime.
import * as React from "react"

/* ------------------------------------------------------------------ types */

export type InkNavLink = { label: string; /** A section key ("features") or any href. */ target: string }
export type InkHero = {
  titleTop: string
  /** The serif line. Several entries cycle. */
  titleAccent: string[]
  description: string
  primaryCta: string
  secondaryCta: string
  /** Under the sculpture. Empty hides it. */
  sculptureHint: string
}
export type InkFeatureCopy = { title: string; description: string }
export type InkFeatures = {
  tag: string
  /** `*word*` sets a word in the muted tone; `\n` breaks the line (in a JSX attribute too). */
  title: string
  collaboration: InkFeatureCopy
  reports: InkFeatureCopy
  integrations: InkFeatureCopy & { tools: string[] }
  insights: InkFeatureCopy & { values: number[]; forecastFrom: number }
}
export type InkStat = { value: string; label: string }
export type InkAbout = { tag: string; title: string; body: string; stats: InkStat[] }
export type InkFaq = { question: string; answer: string }
export type InkCta = { title: string; description: string; button: string }
export type InkFooterColumn = { title: string; links: { label: string; href: string }[] }
export type InkDemoStep = { label: string; detail: string }

export type InkOrbitSaasTemplateProps = {
  brand?: string
  nav?: InkNavLink[]
  navCta?: string
  hero?: Partial<InkHero>
  features?: Partial<InkFeatures>
  about?: Partial<InkAbout>
  faq?: InkFaq[]
  cta?: Partial<InkCta>
  footerTagline?: string
  footerColumns?: InkFooterColumn[]
  /** The steps the Watch Demo dialog plays through. */
  demoSteps?: InkDemoStep[]
  /** Starting shape of the sculpture. Any integer. */
  sculptureSeed?: number
  onReforge?: (seed: number) => void
  onGetStarted?: () => void
  onStartTrial?: () => void
  onWatchDemo?: () => void
  /** Focus rings, live dots and the selection colour. */
  accent?: string
  fonts?: { sans?: string; serif?: string; mono?: string }
  defaultTheme?: "system" | "light" | "dark"
  onThemeChange?: (theme: "light" | "dark") => void
  maxWidth?: string
  height?: string
  className?: string
}

type Theme = "light" | "dark"

/* ------------------------------------------------------------------ logic */

// #region logic
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function easeOutCubic(t: number): number {
  const c = clamp(t, 0, 1)
  return 1 - Math.pow(1 - c, 3)
}

function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1)
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2
}

// "Smart *Workflow*\nAutomation" → lines of { text, muted } runs. A literal
// backslash-n counts too, since that's what "\n" becomes in a JSX attribute.
function parseTitle(s: string): { text: string; muted: boolean }[][] {
  return s.split(/\n|\\n/).map((line) => {
    const out: { text: string; muted: boolean }[] = []
    line.split("*").forEach((text, i) => {
      if (text) out.push({ text, muted: i % 2 === 1 })
    })
    return out
  })
}

// "38M+" → { prefix: "", value: 38, decimals: 0, suffix: "M+" }
function splitStat(s: string): { prefix: string; value: number; decimals: number; suffix: string } | null {
  const m = s.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/)
  if (!m) return null
  const num = m[2].replace(/,/g, "")
  const dot = num.indexOf(".")
  return { prefix: m[1], value: parseFloat(num), decimals: dot < 0 ? 0 : num.length - dot - 1, suffix: m[3] }
}

function formatStat(s: string, t: number): string {
  const p = splitStat(s)
  if (!p) return s
  const v = p.value * easeOutCubic(t)
  const grouped = p.value >= 10000 && p.decimals === 0
  const body = grouped ? Math.round(v).toLocaleString("es-MX") : v.toFixed(p.decimals)
  return p.prefix + body + p.suffix
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim()
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  const n = parseInt(h.slice(0, 6), 16)
  if (!/^[0-9a-f]{6}/i.test(h) || isNaN(n)) return [0, 0, 0]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  const k = clamp(t, 0, 1)
  return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",") + ")"
}

// Smooth line + closed area through values, inside a w×h box.
function chartPaths(values: number[], w: number, h: number, pad: number) {
  const n = values.length
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const pts = values.map((v, i) => [
    pad + (n < 2 ? 0 : (i / (n - 1)) * (w - pad * 2)),
    h - pad - ((v - lo) / span) * (h - pad * 2),
  ] as [number, number])
  let line = ""
  pts.forEach(([x, y], i) => {
    if (i === 0) {
      line = "M" + x.toFixed(1) + "," + y.toFixed(1)
      return
    }
    const [px, py] = pts[i - 1]
    const cx = (px + x) / 2
    line += " C" + cx.toFixed(1) + "," + py.toFixed(1) + " " + cx.toFixed(1) + "," + y.toFixed(1) + " " + x.toFixed(1) + "," + y.toFixed(1)
  })
  const area = n ? line + " L" + pts[n - 1][0].toFixed(1) + "," + (h - pad) + " L" + pts[0][0].toFixed(1) + "," + (h - pad) + " Z" : ""
  return { line, area, points: pts }
}

function nearestIndex(xs: number[], x: number): number {
  let best = 0
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i
  return best
}

/* the sculpture: ink loops + bridges, sampled to a fixed-size point cloud so
   any two seeds can morph grain-for-grain */
type Cloud = { core: Float32Array; grain: Float32Array; spikes: Float32Array }
/* global grain budget (1 = the original 18.800 points). Lower = cheaper per
   frame; keep the silhouette dense enough that the ink texture survives. */
const SCULPTURE_DENSITY = 0.3
const CORE_N = Math.round(2800 * SCULPTURE_DENSITY)
const GRAIN_N = Math.round(16000 * SCULPTURE_DENSITY)
const SPIKE_N = 16
const SPHERE_R = 0.3

function buildCloud(seed: number, coreN = CORE_N, grainN = GRAIN_N, spikeN = SPIKE_N): Cloud {
  const rand = mulberry32(seed * 2654435761 + 1)
  const unit = (): [number, number, number] => {
    const z = rand() * 2 - 1
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(1 - z * z)
    return [r * Math.cos(a), r * Math.sin(a), z]
  }
  const cross = (a: number[], b: number[]): [number, number, number] => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
  const norm = (v: number[]): [number, number, number] => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1
    return [v[0] / l, v[1] / l, v[2] / l]
  }
  // polylines: x,y,z,width per vertex
  const curves: number[][] = []
  const loops = 3 + Math.floor(rand() * 2)
  const W = 0.092
  for (let k = 0; k < loops; k++) {
    const n = unit()
    const u = norm(cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]))
    const v = cross(n, u)
    const p = Array.from({ length: 8 }, () => rand() * Math.PI * 2)
    const R = 0.9 + rand() * 0.16
    const pts: number[] = []
    const RES = 220
    for (let i = 0; i <= RES; i++) {
      const t = (i / RES) * Math.PI * 2
      const r = R * (1 + 0.15 * Math.sin(2 * t + p[0]) + 0.07 * Math.sin(3 * t + p[1]) + 0.04 * Math.sin(5 * t + p[2]))
      const h = R * (0.24 * Math.sin(2 * t + p[3]) + 0.08 * Math.sin(3 * t + p[4]))
      const c = Math.cos(t) * r
      const s = Math.sin(t) * r
      const w = W * (0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(3 * t + p[5]), 1.5)) * (0.72 + 0.28 * Math.sin(7 * t + p[6]))
      pts.push(u[0] * c + v[0] * s + n[0] * h, u[1] * c + v[1] * s + n[1] * h, u[2] * c + v[2] * s + n[2] * h, Math.max(0.018, w))
    }
    curves.push(pts)
  }
  // bridges: bowed tubes between two loops, thick in the middle
  for (let b = 0; b < 3; b++) {
    const A = curves[Math.floor(rand() * loops)]
    const B = curves[Math.floor(rand() * loops)]
    const ia = Math.floor(rand() * (A.length / 4)) * 4
    const ib = Math.floor(rand() * (B.length / 4)) * 4
    const a = [A[ia], A[ia + 1], A[ia + 2]]
    const c = [B[ib], B[ib + 1], B[ib + 2]]
    const mid = norm([(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2])
    const lift = 1.08 + rand() * 0.18
    const m = [mid[0] * lift, mid[1] * lift, mid[2] * lift]
    const pts: number[] = []
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const q = 1 - t
      pts.push(
        q * q * a[0] + 2 * q * t * m[0] + t * t * c[0],
        q * q * a[1] + 2 * q * t * m[1] + t * t * c[1],
        q * q * a[2] + 2 * q * t * m[2] + t * t * c[2],
        W * (0.16 + 0.42 * Math.sin(Math.PI * t)),
      )
    }
    curves.push(pts)
  }
  // resample everything by arc length into exactly coreN cores
  const segs: { c: number[]; i: number; len: number }[] = []
  let total = 0
  for (const c of curves) {
    for (let i = 0; i + 4 < c.length; i += 4) {
      const len = Math.hypot(c[i + 4] - c[i], c[i + 5] - c[i + 1], c[i + 6] - c[i + 2])
      segs.push({ c, i, len })
      total += len
    }
  }
  const core = new Float32Array(coreN * 4)
  const tan = new Float32Array(coreN * 3)
  let si = 0
  let acc = 0
  for (let k = 0; k < coreN; k++) {
    const target = ((k + 0.5) / coreN) * total
    while (si < segs.length - 1 && acc + segs[si].len < target) acc += segs[si++].len
    const { c, i, len } = segs[si]
    const f = len ? clamp((target - acc) / len, 0, 1) : 0
    for (let d = 0; d < 4; d++) core[k * 4 + d] = c[i + d] + (c[i + 4 + d] - c[i + d]) * f
    const t = norm([c[i + 4] - c[i], c[i + 5] - c[i + 1], c[i + 6] - c[i + 2]])
    tan.set(t, k * 3)
  }
  // grain: inside and just past each tube's skin, plus a little loose dust
  const grain = new Float32Array(grainN * 3)
  for (let g = 0; g < grainN; g++) {
    const k = Math.floor(rand() * coreN)
    const T = [tan[k * 3], tan[k * 3 + 1], tan[k * 3 + 2]]
    const d = unit()
    const dot = d[0] * T[0] + d[1] * T[1] + d[2] * T[2]
    const o = norm([d[0] - dot * T[0], d[1] - dot * T[1], d[2] - dot * T[2]])
    const w = core[k * 4 + 3]
    const dust = rand() < 0.05
    const r = dust ? w * (1.3 + rand() * 1.6) : w * (0.35 + 0.82 * Math.sqrt(rand()))
    for (let a = 0; a < 3; a++) grain[g * 3 + a] = core[k * 4 + a] + o[a] * r
  }
  // spikes: thin needles bristling outward
  const spikes = new Float32Array(spikeN * 6)
  for (let s = 0; s < spikeN; s++) {
    const k = Math.floor(rand() * coreN)
    const p = [core[k * 4], core[k * 4 + 1], core[k * 4 + 2]]
    const j = unit()
    const dir = norm([p[0] + j[0] * 0.45, p[1] + j[1] * 0.45, p[2] + j[2] * 0.45])
    const len = 0.18 + rand() * 0.42
    spikes.set([p[0], p[1], p[2], p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len], s * 6)
  }
  return { core, grain, spikes }
}

// yaw about Y, then pitch about X; returns screen x, y, depth and scale
function project(x: number, y: number, z: number, yaw: number, pitch: number, f: number): [number, number, number, number] {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const y2 = y * cp - z1 * sp
  const z2 = y * sp + z1 * cp
  const s = f / (f - z2)
  return [x1 * s, y2 * s, z2, s]
}
// #endregion logic

/* --------------------------------------------------------------- defaults */

const CONTACT_URL = "https://innova-tech.com.mx/contacto.html"
const SITE_URL = "https://innova-tech.com.mx"

// Nav literal del sitio (navbar/footer de index.html). Sin "Inicio": el sitio
// no lo tiene y la sección home ya está cubierta por el logo.
const D_NAV: InkNavLink[] = [
  { label: "Cómo trabajamos", target: "about" },
  { label: "Servicios", target: "features" },
  { label: "Casos reales", target: SITE_URL + "/#expediciones" },
  { label: "Proyectos", target: SITE_URL + "/#laboratorio" },
  { label: "Capacitaciones", target: SITE_URL + "/capacitaciones.html" },
  { label: "Cursos Online", target: SITE_URL + "/cursos.html" },
]
// Defaults: contenido literal del sitio Innova-Tech (/tmp/landing-content.md).
// La plantilla NO arrastra copy propio de SaaS: cifras, precios, descuentos,
// SLA, tiempos de configuración y testimonios están prohibidos. Los arrays
// sin datos verificables se dejan vacíos (about.stats, faq, footerColumns).
const D_HERO: InkHero = {
  titleTop: "De la tecnología emergente a su ventaja operativa",
  titleAccent: ["Inteligencia Artificial Privada", "Ciberseguridad de Defensa", "Infraestructura Crítica"],
  description:
    "La convertimos en sistemas que operan todos los días. Construimos, desplegamos y damos mantenimiento.",
  primaryCta: "Agendar diagnóstico",
  secondaryCta: "Ver cómo trabajamos",
  sculptureHint: "Arrastra para girar · Haz clic para recrear",
}
const D_FEATURES: InkFeatures = {
  tag: "Servicios",
  title: "Sistemas que operan\n*todos los días.*",
  // DOM-01 // IA
  collaboration: {
    title: "Inteligencia Artificial Privada",
    description:
      "IA desplegada dentro de su perímetro: sus datos no salen de sus servidores. Modelos, agentes y automatización con control total.",
  },
  // DOM-02 // DEFENSA
  reports: {
    title: "Ciberseguridad de Defensa",
    description:
      "Protección en profundidad, monitoreo permanente y respuesta ante incidentes. Su información es el activo que blindamos.",
  },
  // DOM-04 // AUTOMATIZACIÓN
  integrations: {
    title: "Software y Automatización",
    description:
      "Herramientas a la medida que convierten procesos manuales en sistemas que trabajan mientras usted duerme.",
    tools: ["Open WebUI", "Arch-Credential", "FerrePOS", "Jarvis"],
  },
  // DOM-03 // INFRAESTRUCTURA
  insights: {
    title: "Infraestructura Crítica",
    description:
      "Redes, servidores y plataformas de alta disponibilidad diseñadas para mantenerse en pie cuando todo depende de ellas.",
    // DECORATIVO: serie neutra para la gráfica, no es un dato real.
    values: [24, 28, 26, 33, 31, 38, 36, 42, 40, 47, 51, 56],
    forecastFrom: 8,
  },
}
const D_ABOUT: InkAbout = {
  tag: "Cómo trabajamos",
  title: "Convertimos promesa en\n*operación.*",
  body:
    "Exploramos antes que el mercado: Evaluamos tecnologías emergentes con rigor metodológico y científico, no con entusiasmo de marketing. Probamos bajo presión: Cada solución se valida en los entornos más exigentes: alta seguridad, misión crítica, cero margen de error. Convertimos promesa en operación: Lo que otros llaman proyecto de innovación, nosotros lo entregamos como servicio garantizado y documentado.",
  // Vacío: no hay cifras verificadas más allá de 1998/15 (viven en content.ts).
  stats: [],
}
// Vacío: sin FAQ de plantilla (la FAQ real vive en content.ts).
const D_FAQ: InkFaq[] = []
const D_CTA: InkCta = {
  title: "¿Listo para *cruzar la frontera?*",
  description:
    "El primer paso es una conversación. Agende una consulta estratégica sin costo y permítanos entender su desafío.",
  button: "Contacto",
}
// Pasos del diálogo: fases derivadas del manifiesto real (mismos textos que
// content.ts). La plantilla no trae fases propias con cifras ni tiempos.
const D_STEPS: InkDemoStep[] = [
  {
    label: "Exploramos",
    detail: "Evaluamos tecnologías emergentes con rigor metodológico y científico, no con entusiasmo de marketing.",
  },
  {
    label: "Probamos",
    detail: "Cada solución se valida en los entornos más exigentes: alta seguridad, misión crítica, cero margen de error.",
  },
  { label: "Desplegamos", detail: "Construimos, desplegamos y damos mantenimiento." },
  {
    label: "Convertimos",
    detail: "Lo que otros llaman proyecto de innovación, nosotros lo entregamos como servicio garantizado y documentado.",
  },
]

/* ------------------------------------------------------------------ styles */

const NF_CSS = `
.nf-root{--nf-accent:#22D3EE;--nf-z-nav:30;--nf-z-modal:200;--nf-page:#EEF1FB;--nf-hatch:rgba(17,23,48,.05);--nf-paper:#F7F9FF;--nf-card:#EDF1FC;--nf-raise:#FDFEFF;--nf-ink:#0A0E1E;--nf-soft:#2A3352;--nf-muted:#4A5578;--nf-faint:#5F6B96;--nf-line:rgba(17,23,48,.13);--nf-line-strong:rgba(17,23,48,.26);--nf-bracket:#9AA8CC;--nf-band:#E4E9FA;--nf-inv:#111730;--nf-inv-ink:#E8EEFF;--nf-inv-muted:#9AA8CC;--nf-shadow:0 1px 2px rgba(10,14,30,.06),0 8px 24px -12px rgba(10,14,30,.18);--nf-sans:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--nf-display:"Space Grotesk","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--nf-serif:"Newsreader","Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,"Times New Roman",serif;--nf-mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;position:relative;width:100%;box-sizing:border-box;background-color:var(--nf-page);background-image:repeating-linear-gradient(135deg,var(--nf-hatch) 0 1px,transparent 1px 10px);color:var(--nf-ink);font-family:var(--nf-sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;padding:12px clamp(10px,2.4vw,28px) 28px;transition:background-color .45s ease,color .45s ease}
.nf-root[data-theme="dark"]{--nf-accent:#22D3EE;--nf-page:#05070F;--nf-hatch:rgba(139,168,224,.045);--nf-paper:#0A0E1E;--nf-card:#131B2E;--nf-raise:#1B2540;--nf-ink:#E8EEFF;--nf-soft:#C3CEEC;--nf-muted:#9AA8CC;--nf-faint:#7E8CBA;--nf-line:rgba(139,168,224,.14);--nf-line-strong:rgba(139,168,224,.32);--nf-bracket:rgba(139,168,224,.45);--nf-band:#111730;--nf-inv:#1B2540;--nf-inv-ink:#E8EEFF;--nf-inv-muted:#9AA8CC;--nf-shadow:0 1px 2px rgba(0,0,0,.45),0 14px 34px -18px rgba(0,0,0,.85)}
.nf-root :where(*){box-sizing:border-box}
.nf-root ::selection{background:var(--nf-accent);color:#05070F}
.nf-root :focus-visible{outline:2px solid var(--nf-accent);outline-offset:2px}
.nf-root[data-theme="light"] :focus-visible{outline-color:#0E7490}
.nf-root[data-theme="dark"] :focus-visible{outline-color:#22D3EE}
.nf-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit;letter-spacing:inherit}
.nf-root :where(a){color:inherit;text-decoration:none}
.nf-root :where(a[href]){cursor:pointer}
.nf-root :where(svg){display:block;max-width:none;flex:none}
.nf-root :where(img){display:block;max-width:none}
.nf-root :where(h1,h2,h3,h4,p,ul,ol,li,figure,blockquote,dl,dd){margin:0;padding:0;font-size:inherit;font-weight:inherit;list-style:none}
.nf-root :where(input){font:inherit;color:inherit;margin:0}
.nf-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.nf-shell{width:100%;max-width:var(--nf-max,1180px);margin:0 auto;container-type:inline-size;display:flex;flex-direction:column;gap:clamp(18px,3cqw,32px)}

.nf-frame{position:relative}
.nf-c{position:absolute;width:12px;height:12px;border-color:var(--nf-bracket);border-style:solid;border-width:0;pointer-events:none;transition:border-color .3s,transform .35s cubic-bezier(.2,.8,.2,1)}
.nf-c-tl{top:-6px;left:-6px;border-top-width:1.5px;border-left-width:1.5px}
.nf-c-tr{top:-6px;right:-6px;border-top-width:1.5px;border-right-width:1.5px}
.nf-c-bl{bottom:-6px;left:-6px;border-bottom-width:1.5px;border-left-width:1.5px}
.nf-c-br{bottom:-6px;right:-6px;border-bottom-width:1.5px;border-right-width:1.5px}
.nf-frame-hover:hover>.nf-c{border-color:var(--nf-ink)}
.nf-frame-hover:hover>.nf-c-tl{transform:translate(-3px,-3px)}
.nf-frame-hover:hover>.nf-c-tr{transform:translate(3px,-3px)}
.nf-frame-hover:hover>.nf-c-bl{transform:translate(-3px,3px)}
.nf-frame-hover:hover>.nf-c-br{transform:translate(3px,3px)}

/* nav */
.nf-nav{position:sticky;top:10px;z-index:var(--nf-z-nav)}
.nf-navbar{display:flex;align-items:center;gap:16px;height:58px;padding:0 14px 0 18px;background:var(--nf-paper);border:1px solid var(--nf-line);box-shadow:var(--nf-shadow);transition:background-color .45s,border-color .45s}
.nf-brand{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:15px;letter-spacing:-.01em;white-space:nowrap;font-family:var(--nf-display)}
.nf-brand svg{transition:transform .6s cubic-bezier(.2,.8,.2,1)}
.nf-brand:hover svg{transform:rotate(-180deg)}
.nf-links{position:relative;display:none;align-items:center;gap:2px;margin:0 auto}
.nf-link{position:relative;padding:8px 12px;font-size:13.5px;color:var(--nf-soft);transition:color .2s}
.nf-link:hover,.nf-link[aria-current="true"]{color:var(--nf-ink)}
.nf-caret{position:absolute;bottom:2px;left:0;width:10px;height:6px;color:var(--nf-ink);transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .3s}
.nf-nav-end{display:flex;align-items:center;gap:8px;margin-left:auto}
.nf-icon-btn{display:inline-grid;place-items:center;width:34px;height:34px;color:var(--nf-muted);border:1px solid transparent;transition:color .2s,border-color .2s}
.nf-icon-btn:hover{color:var(--nf-ink);border-color:var(--nf-line)}
.nf-menu-btn{display:inline-grid}
.nf-mobile{position:absolute;left:0;right:0;top:calc(100% + 8px);display:grid;gap:2px;padding:8px;background:var(--nf-paper);border:1px solid var(--nf-line);box-shadow:var(--nf-shadow);transform-origin:top;animation:nf-drop .28s cubic-bezier(.2,.8,.2,1) both}
.nf-mobile .nf-link{padding:11px 12px;font-size:15px}
.nf-mobile .nf-link[aria-current="true"]{background:var(--nf-card)}
@container (min-width:820px){.nf-links{display:flex}.nf-menu-btn{display:none}.nf-mobile{display:none}.nf-nav-end{margin-left:0}}

.nf-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;font-size:13.5px;font-weight:500;line-height:1;white-space:nowrap;border-radius:2px;transition:background-color .2s,color .2s,box-shadow .25s,transform .2s cubic-bezier(.2,.8,.2,1)}
.nf-btn-dark{background:var(--nf-inv);color:var(--nf-inv-ink);box-shadow:0 0 0 3px var(--nf-paper),0 0 0 4px var(--nf-line-strong),0 6px 16px -8px rgba(0,0,0,.5)}
.nf-btn-dark:hover{box-shadow:0 0 0 3px var(--nf-paper),0 0 0 4px var(--nf-ink),0 10px 22px -10px rgba(0,0,0,.6);transform:translateY(-1px)}
.nf-btn-ghost{background:var(--nf-raise);color:var(--nf-ink);border:1px solid var(--nf-line-strong)}
.nf-btn-ghost:hover{border-color:var(--nf-ink)}
.nf-btn:active{transform:translateY(0) scale(.98)}
.nf-btn .nf-arr{transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.nf-btn:hover .nf-arr{transform:translateX(3px)}
.nf-btn[disabled]{opacity:.6;cursor:default}
.nf-root[data-theme="dark"] .nf-btn-dark{background:var(--nf-accent);color:#05070F;box-shadow:0 0 0 3px var(--nf-paper),0 0 0 4px color-mix(in srgb,var(--nf-accent) 55%,transparent),0 8px 22px -10px rgba(0,0,0,.55)}
.nf-root[data-theme="dark"] .nf-btn-dark:hover{box-shadow:0 0 0 3px var(--nf-paper),0 0 0 4px var(--nf-ink),0 12px 26px -12px rgba(0,0,0,.55)}

/* sections */
.nf-sec{position:relative;background:var(--nf-paper);border:1px solid var(--nf-line);scroll-margin-top:84px;transition:background-color .45s,border-color .45s}
.nf-sec-pad{padding:clamp(36px,6cqw,72px) clamp(16px,4cqw,48px)}
.nf-reveal{opacity:0;transform:translateY(18px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
.nf-reveal[data-in="true"]{opacity:1;transform:none}
.nf-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;margin-bottom:clamp(28px,4.5cqw,52px)}
.nf-tag{position:relative;display:inline-block;padding:4px 10px;font-size:11.5px;letter-spacing:.02em;color:var(--nf-soft);background:var(--nf-card);border:1px solid var(--nf-line)}
.nf-h2{font-size:clamp(28px,4.4cqw,44px);line-height:1.08;letter-spacing:-.025em;font-weight:500;font-family:var(--nf-display)}
.nf-h2>span{display:block}
.nf-muted{color:var(--nf-faint)}
.nf-sub{color:var(--nf-muted);font-size:15px;max-width:52ch}

/* hero */
.nf-hero{display:grid;grid-template-columns:minmax(0,1fr);min-height:min(620px,calc(var(--nf-h,100svh) - 110px))}
@container (min-width:860px){.nf-hero{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.nf-hero-copy{display:flex;flex-direction:column;justify-content:center;padding:clamp(40px,7cqw,80px) 0 clamp(36px,6cqw,64px)}
.nf-band{position:relative;padding:clamp(18px,2.6cqw,28px) clamp(16px,3cqw,32px);background:linear-gradient(90deg,var(--nf-band) 0%,var(--nf-band) 55%,transparent 100%);border-top:1px solid var(--nf-line);border-bottom:1px solid var(--nf-line)}
.nf-h1{font-size:clamp(34px,5.2cqw,58px);line-height:1.04;letter-spacing:-.03em;font-weight:400;font-family:var(--nf-display)}
.nf-h1-top{display:block;animation:nf-blur-in 1s cubic-bezier(.2,.7,.2,1) both}
.nf-h1-acc{display:block;font-family:var(--nf-serif);font-stretch:condensed;letter-spacing:-.02em;color:var(--nf-soft);min-height:1.1em}
.nf-word{display:inline-block;animation:nf-blur-in .9s cubic-bezier(.2,.7,.2,1) both}
.nf-word-out{animation:nf-blur-out .45s ease both}
.nf-hero-body{padding:22px clamp(16px,3cqw,32px) 0}
.nf-lede{font-size:clamp(14px,1.35cqw,15.5px);line-height:1.6;color:var(--nf-soft);max-width:48ch;animation:nf-rise .9s .15s cubic-bezier(.2,.7,.2,1) both}
.nf-hero-ctas{display:flex;flex-wrap:wrap;gap:16px;margin-top:26px;animation:nf-rise .9s .28s cubic-bezier(.2,.7,.2,1) both}
.nf-hero-ctas .nf-frame>.nf-c{width:7px;height:7px;top:-4px;left:-4px}
.nf-hero-ctas .nf-frame>.nf-c-tr{left:auto;right:-4px}
.nf-hero-ctas .nf-frame>.nf-c-bl{top:auto;bottom:-4px}
.nf-hero-ctas .nf-frame>.nf-c-br{top:auto;left:auto;bottom:-4px;right:-4px}
.nf-proof{display:flex;align-items:center;gap:10px;margin-top:30px;font-size:12.5px;color:var(--nf-muted);animation:nf-rise .9s .4s cubic-bezier(.2,.7,.2,1) both}
.nf-proof-faces{display:flex}
.nf-proof-faces>*{margin-left:-7px;border:2px solid var(--nf-paper);border-radius:999px;overflow:hidden}
.nf-proof-faces>*:first-child{margin-left:0}
.nf-art{position:relative;min-height:360px;border-top:1px solid var(--nf-line);overflow:hidden;background:radial-gradient(60% 55% at 50% 50%,var(--nf-raise),var(--nf-paper))}
@container (min-width:860px){.nf-art{border-top:0;border-left:1px solid var(--nf-line);min-height:0}}
.nf-art canvas{position:absolute;inset:0;width:100%;height:100%;display:block;max-width:none;touch-action:pan-y;cursor:grab;animation:nf-fade 1.4s .1s ease both}
.nf-art canvas:active{cursor:grabbing}
.nf-art-hint{position:absolute;left:14px;bottom:12px;font-family:var(--nf-mono);font-size:10.5px;letter-spacing:.04em;color:var(--nf-faint);pointer-events:none}
.nf-art-seed{position:absolute;right:14px;bottom:12px;font-family:var(--nf-mono);font-size:10.5px;color:var(--nf-faint);pointer-events:none}
.nf-ticks{position:absolute;top:12px;left:14px;right:14px;display:flex;justify-content:space-between;font-family:var(--nf-mono);font-size:10px;color:var(--nf-faint);pointer-events:none}

/* features */
.nf-bento{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(22px,3cqw,34px)}
@container (min-width:720px){.nf-bento{grid-template-columns:repeat(2,minmax(0,1fr))}.nf-wide{grid-column:1 / -1;width:min(100%,820px);justify-self:center}}
.nf-card{background:linear-gradient(180deg,var(--nf-raise),var(--nf-card));border:1px solid var(--nf-line);padding:clamp(14px,2cqw,22px);display:flex;flex-direction:column;gap:14px;transition:border-color .3s,box-shadow .35s,background-color .45s}
.nf-card:hover{border-color:var(--nf-line-strong);box-shadow:var(--nf-shadow)}
.nf-card h3{font-size:13.5px;font-weight:600;letter-spacing:-.005em}
.nf-card p{font-size:12.5px;line-height:1.55;color:var(--nf-muted);max-width:40ch}
.nf-diagram{width:100%;height:auto;overflow:visible}
.nf-wide-copy{display:grid;grid-template-columns:1fr;gap:16px}
@container (min-width:560px){.nf-wide-copy{grid-template-columns:1fr 1fr}.nf-wide-copy>div:last-child{justify-self:end;text-align:left}}
.nf-flow{stroke:var(--nf-line-strong);fill:none;stroke-width:1.2;transition:stroke .3s}
.nf-flow-on{stroke:var(--nf-ink)}
.nf-dash{stroke-dasharray:3 4;animation:nf-dash 1.2s linear infinite}
.nf-pkt{fill:var(--nf-ink)}
.nf-node{fill:var(--nf-raise);stroke:var(--nf-line-strong);transition:stroke .3s,transform .3s}
.nf-av{cursor:pointer;transition:transform .35s cubic-bezier(.2,.8,.2,1);transform-box:fill-box;transform-origin:center}
.nf-av:hover,.nf-av:focus-visible{transform:scale(1.18)}
.nf-av-tip{opacity:0;transition:opacity .2s;pointer-events:none}
.nf-av:hover .nf-av-tip,.nf-av:focus .nf-av-tip{opacity:1}
.nf-presence{animation:nf-pulse 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.nf-sheet{transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .7s}
.nf-sheet-new{animation:nf-sheet-in .7s cubic-bezier(.2,.8,.2,1) both}
.nf-tool{cursor:pointer;transition:transform .3s cubic-bezier(.2,.8,.2,1);transform-box:fill-box;transform-origin:center}
.nf-tool:hover,.nf-tool-on{transform:translateY(-2px)}
.nf-tool rect{transition:stroke .3s}
.nf-tool-on rect.nf-node{stroke:var(--nf-ink)}
.nf-chart{cursor:crosshair}
.nf-line-draw{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.8s cubic-bezier(.4,.1,.2,1)}
[data-in="true"] .nf-line-draw{stroke-dashoffset:0}
.nf-glow{animation:nf-pulse 2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}

/* about + faq */
.nf-about{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(28px,5cqw,64px)}
@container (min-width:860px){.nf-about{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr)}}
.nf-about .nf-head{align-items:flex-start;text-align:left;margin-bottom:18px}
.nf-about-body{color:var(--nf-soft);font-size:15px;line-height:1.7;max-width:56ch}
.nf-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--nf-line);border:1px solid var(--nf-line);margin-top:30px}
.nf-stat{background:var(--nf-paper);padding:18px 16px;transition:background-color .3s}
.nf-stat:hover{background:var(--nf-card)}
.nf-stat-v{font-size:clamp(26px,3.2cqw,34px);font-weight:500;letter-spacing:-.035em;line-height:1.1;font-variant-numeric:tabular-nums;font-family:var(--nf-display)}
.nf-stat-l{font-size:12px;color:var(--nf-muted);margin-top:4px}
.nf-stat-n{display:inline-block}
.nf-stat-n-in{animation:nf-stat-in .7s cubic-bezier(.2,.7,.2,1) both}
.nf-faq{border-top:1px solid var(--nf-line)}
.nf-faq-item{border-bottom:1px solid var(--nf-line)}
.nf-faq-q{display:flex;width:100%;align-items:center;justify-content:space-between;gap:16px;padding:18px 2px;font-size:15px;font-weight:500;letter-spacing:-.01em}
.nf-faq-q svg{transition:transform .4s cubic-bezier(.2,.8,.2,1);color:var(--nf-muted)}
.nf-faq-q[aria-expanded="true"] svg{transform:rotate(45deg);color:var(--nf-ink)}
.nf-faq-a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s cubic-bezier(.2,.8,.2,1)}
.nf-faq-a[data-open="true"]{grid-template-rows:1fr}
.nf-faq-a>div{overflow:hidden}
.nf-faq-a p{padding:0 30px 18px 2px;font-size:13.5px;line-height:1.65;color:var(--nf-muted)}
.nf-faq-label{font-family:var(--nf-mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--nf-faint);margin-bottom:6px}

/* cta + footer */
.nf-cta{position:relative;overflow:hidden;background:var(--nf-inv);color:var(--nf-inv-ink);border-color:var(--nf-inv);text-align:center}
.nf-cta::after{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,var(--nf-accent),transparent)}
.nf-cta-grid{position:absolute;inset:0;background-image:linear-gradient(color-mix(in srgb,var(--nf-inv-ink) 7%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--nf-inv-ink) 7%,transparent) 1px,transparent 1px);background-size:36px 36px;-webkit-mask-image:radial-gradient(60% 70% at 50% 50%,#000,transparent);mask-image:radial-gradient(60% 70% at 50% 50%,#000,transparent);pointer-events:none}
.nf-cta .nf-h2 .nf-muted{color:var(--nf-inv-muted);font-family:var(--nf-serif);font-style:italic}
.nf-cta p{color:var(--nf-inv-muted);margin-top:12px}
.nf-cta-actions{position:relative;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;margin-top:28px}
.nf-cta .nf-btn{height:44px;padding:0 24px;background:var(--nf-accent);color:#05070F;box-shadow:0 14px 32px -14px rgba(0,0,0,.6)}
.nf-cta .nf-btn:hover{transform:translateY(-1px)}
.nf-spin{width:14px;height:14px;border-radius:99px;border:2px solid currentColor;border-right-color:transparent;animation:nf-spin .7s linear infinite}
.nf-foot{display:grid;grid-template-columns:minmax(0,1fr);gap:28px;padding:clamp(28px,4cqw,44px) clamp(16px,4cqw,48px) 22px}
@container (min-width:760px){.nf-foot{grid-template-columns:1.4fr repeat(3,minmax(0,1fr))}}
.nf-foot h4{font-size:12px;font-weight:600;margin-bottom:12px}
.nf-foot ul{display:grid;gap:8px;font-size:13px;color:var(--nf-muted)}
.nf-foot ul a{transition:color .2s}
.nf-foot ul a:hover{color:var(--nf-ink)}
.nf-foot-tag{font-size:13px;color:var(--nf-muted);margin-top:12px;max-width:34ch;line-height:1.6}
.nf-foot-bar{grid-column:1 / -1;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding-top:18px;border-top:1px solid var(--nf-line);font-size:12px;color:var(--nf-muted)}
.nf-status{display:inline-flex;align-items:center;gap:7px}
.nf-live{width:7px;height:7px;border-radius:99px;background:var(--nf-accent)}
.nf-theme{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--nf-line);transition:border-color .2s,color .2s}
.nf-theme:hover{border-color:var(--nf-ink);color:var(--nf-ink)}

/* demo dialog */
.nf-modal{position:fixed;inset:0;z-index:var(--nf-z-modal);display:grid;place-items:center;padding:16px;background:rgba(5,7,15,.72);animation:nf-fade .25s ease both}
.nf-dialog{position:relative;width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--nf-paper);color:var(--nf-ink);border:1px solid var(--nf-line-strong);box-shadow:0 30px 80px -20px rgba(0,0,0,.45);animation:nf-pop .4s cubic-bezier(.2,.8,.2,1) both;font-family:var(--nf-sans)}
.nf-dialog-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--nf-line);font-size:13px}
.nf-dialog-head span{display:inline-flex;align-items:center;gap:8px;font-family:var(--nf-mono);font-size:11.5px;color:var(--nf-muted)}
.nf-steps{display:grid;gap:4px;padding:16px}
.nf-step{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:12px;padding:10px 12px;border:1px solid transparent;transition:background-color .3s,border-color .3s,opacity .3s;opacity:.45}
.nf-step[data-state="run"]{opacity:1;background:var(--nf-card);border-color:var(--nf-line)}
.nf-step[data-state="done"]{opacity:1}
.nf-step b{font-size:13.5px;font-weight:600;display:block}
.nf-step small{font-size:12px;color:var(--nf-muted)}
.nf-step-ix{display:grid;place-items:center;width:26px;height:26px;border:1px solid var(--nf-line-strong);font-family:var(--nf-mono);font-size:11px}
.nf-step[data-state="done"] .nf-step-ix{background:var(--nf-inv);color:var(--nf-inv-ink);border-color:var(--nf-inv)}
.nf-step-t{font-family:var(--nf-mono);font-size:11px;color:var(--nf-faint)}
.nf-bar{height:2px;margin:0 16px;background:var(--nf-line)}
.nf-bar>i{display:block;height:2px;background:var(--nf-ink);transition:width .3s linear}
.nf-dialog-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;font-size:12.5px;color:var(--nf-muted)}

@keyframes nf-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes nf-stat-in{from{opacity:0;transform:translateY(.35em)}to{opacity:1;transform:none}}
@keyframes nf-fade{from{opacity:0}to{opacity:1}}
@keyframes nf-blur-in{from{opacity:0;filter:blur(8px);transform:translateY(10px)}to{opacity:1;filter:blur(0);transform:none}}
@keyframes nf-blur-out{from{opacity:1;filter:blur(0)}to{opacity:0;filter:blur(8px);transform:translateY(-8px)}}
@keyframes nf-drop{from{opacity:0;transform:scaleY(.92) translateY(-6px)}to{opacity:1;transform:none}}
@keyframes nf-pop{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
@keyframes nf-dash{to{stroke-dashoffset:-14}}
@keyframes nf-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(1.35)}}
@keyframes nf-sheet-in{from{opacity:0;transform:translate(14px,-10px) rotate(4deg)}to{opacity:1;transform:none}}
@keyframes nf-spin{to{transform:rotate(360deg)}}

@media (prefers-reduced-motion:reduce){
.nf-root *,.nf-modal *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}
.nf-reveal{opacity:1;transform:none}
}
/* Sin JS nadie cambia data-in a "true": el reveal se quedaria en opacity:0 y
   la linea de la grafica en stroke-dashoffset:1 (contenido invisible para los
   navegadores sin script). El <noscript> de index.html cubre el parser; esta
   media query cubre los navegadores donde la ejecucion esta desactivada. */
@media (scripting: none){
.nf-reveal{opacity:1;transform:none}
.nf-line-draw{stroke-dashoffset:0}
}
`

/* ---------------------------------------------------------------- helpers */

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener?.("change", on)
    return () => mq.removeEventListener?.("change", on)
  }, [])
  return reduced
}

// true once the element has been on screen
function useInView(threshold = 0.2) {
  const ref = React.useRef(null as HTMLElement | null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver !== "function") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, threshold])
  return [ref, inView] as const
}

function Brackets() {
  return (
    <>
      <span className="nf-c nf-c-tl" aria-hidden="true" />
      <span className="nf-c nf-c-tr" aria-hidden="true" />
      <span className="nf-c nf-c-bl" aria-hidden="true" />
      <span className="nf-c nf-c-br" aria-hidden="true" />
    </>
  )
}

function Title({ text, className = "nf-h2", as = "h2" }: { text: string; className?: string; as?: "h2" | "h3" }) {
  const Tag = as
  return (
    <Tag className={className}>
      {parseTitle(text).map((line, i) => (
        <span key={i}>
          {line.map((run, j) => (
            <React.Fragment key={j}>{run.muted ? <span className="nf-muted" style={{ display: "inline" }}>{run.text}</span> : run.text}</React.Fragment>
          ))}
        </span>
      ))}
    </Tag>
  )
}

function Mark({ size = 18 }: { size?: number }) {
  // the brand glyph: a folded N
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 21V3h4.2l9.6 12.2V3H21v18h-4.2L7.2 8.8V21z" fill="currentColor" />
    </svg>
  )
}

function Arrow({ size = 14 }: { size?: number }) {
  return (
    <svg className="nf-arr" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 6.4 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* drawn portraits — greyscale, so they sit in the palette */
const PORTRAITS = [
  { hair: "short", beard: true, glasses: false, skin: "#b9b4ae", hairC: "#2b2a29", shirt: "#3a3a3a", bg: "#d9d6d2" },
  { hair: "long", beard: false, glasses: false, skin: "#d6d0c9", hairC: "#8d7f6c", shirt: "#7b7b7b", bg: "#e6e3df" },
  { hair: "buzz", beard: false, glasses: true, skin: "#a7a19a", hairC: "#3d3c3a", shirt: "#1f1f1f", bg: "#cfcfcf" },
  { hair: "bun", beard: false, glasses: true, skin: "#9a8f84", hairC: "#1e1d1c", shirt: "#5a5a5a", bg: "#dedbd6" },
  { hair: "curly", beard: false, glasses: false, skin: "#7f746a", hairC: "#1a1918", shirt: "#8a8a8a", bg: "#d3d0cb" },
  { hair: "side", beard: true, glasses: true, skin: "#c7c0b8", hairC: "#5b5650", shirt: "#2c2c2c", bg: "#e1ded9" },
]

function Portrait({ index, size = 38, uid }: { index: number; size?: number; uid: string }) {
  const p = PORTRAITS[((index % PORTRAITS.length) + PORTRAITS.length) % PORTRAITS.length]
  const id = uid + "pt" + index
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.bg} />
          <stop offset="1" stopColor="#9d9a96" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={"url(#" + id + ")"} />
      {p.hair === "long" && <path d="M18 30c0-12 6-19 14-19s14 7 14 19v20H18z" fill={p.hairC} />}
      {p.hair === "curly" &&
        [[22, 20], [28, 15], [36, 15], [42, 20], [45, 28], [19, 28]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill={p.hairC} />)}
      <path d="M8 64c2-12 12-18 24-18s22 6 24 18z" fill={p.shirt} />
      <rect x="27.5" y="36" width="9" height="11" rx="3" fill={p.skin} />
      <path d="M27.5 44c3 2.5 6 2.5 9 0v3h-9z" fill="#000" opacity=".12" />
      <ellipse cx="32" cy="28" rx="11" ry="13" fill={p.skin} />
      {p.hair === "short" && <path d="M21 25c0-9 5-13 11-13s11 4 11 13c-2-4-6-6-11-6s-9 2-11 6z" fill={p.hairC} />}
      {p.hair === "buzz" && <path d="M21.5 24c.5-8 5-11.5 10.5-11.5S42 16 42.5 24c-3-3-6.5-4-10.5-4s-7.5 1-10.5 4z" fill={p.hairC} opacity=".85" />}
      {p.hair === "bun" && (
        <>
          <circle cx="32" cy="11" r="6" fill={p.hairC} />
          <path d="M21 26c0-10 5-14 11-14s11 4 11 14c-2-5-6-7.5-11-7.5S23 21 21 26z" fill={p.hairC} />
        </>
      )}
      {p.hair === "long" && <path d="M21 27c0-10 5-15 11-15s11 5 11 15c-3-6-8-8-14-7-3 .5-6 3-8 7z" fill={p.hairC} />}
      {p.hair === "side" && <path d="M21 26c-1-9 5-14 12-14 6 0 11 4 10 12-4-5-10-6-17-3-2 1-4 3-5 5z" fill={p.hairC} />}
      {p.beard && <path d="M21.5 30c1 9 5 12 10.5 12s9.5-3 10.5-12c-2 4-5 5-10.5 5s-8.5-1-10.5-5z" fill={p.hairC} opacity=".9" />}
      <circle cx="27.5" cy="28" r="1.2" fill="#1a1a1a" />
      <circle cx="36.5" cy="28" r="1.2" fill="#1a1a1a" />
      {p.glasses && (
        <g fill="none" stroke="#1a1a1a" strokeWidth="1.1">
          <circle cx="27.5" cy="28" r="3.6" />
          <circle cx="36.5" cy="28" r="3.6" />
          <path d="M31.1 28h1.8" />
        </g>
      )}
      <path d="M29 34.5c1.8 1.2 4.2 1.2 6 0" fill="none" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}

function ToolGlyph({ index }: { index: number }) {
  const k = index % 4
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {k === 0 && (
        <>
          <rect x="-6" y="-6" width="12" height="12" rx="1.5" />
          <path d="M-6 -2h12M-6 2h12M-1.5 -6v12" />
        </>
      )}
      {k === 1 && <path d="M-6.5 4 -2 -5h4l4.5 9zm2.4 0h9.2M-2 -5l4.5 9" />}
      {k === 2 && (
        <>
          <path d="M-4.5 -6.5h6l3 3v10h-9z" />
          <path d="M-2 0h4.5M-2 3h4.5" />
        </>
      )}
      {k === 3 && (
        <>
          <circle cx="-1" cy="-1" r="4.5" />
          <path d="M2.4 2.4 6 6" />
        </>
      )}
    </g>
  )
}

/* ------------------------------------------------------------- sculpture */

type ArtColors = { ink: string; bg: string }

function InkSculpture({
  seed,
  colors,
  reduced,
  onReforge,
}: {
  seed: number
  colors: ArtColors
  reduced: boolean
  onReforge: () => void
}) {
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const st = React.useRef({
    yaw: 0.6,
    pitch: 0.18,
    vyaw: 0,
    tPitch: 0.18,
    tYaw: 0,
    yawLean: 0,
    drag: false,
    lastX: 0,
    downX: 0,
    downY: 0,
    lastT: 0,
    from: null as Cloud | null,
    to: buildCloud(seed),
    morphT: 1,
    dirty: true,
    visible: true,
    colors,
    reduced,
  })
  st.current.colors = colors
  st.current.reduced = reduced
  st.current.dirty = true

  // a new seed morphs every grain from where it is now to where it's going
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const s = st.current
    s.from = s.to
    s.to = buildCloud(seed)
    s.morphT = s.reduced ? 1 : 0
    s.dirty = true
  }, [seed])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const lens = document.createElement("canvas")
    const lctx = lens.getContext("2d")
    const s = st.current
    let W = 0
    let H = 0
    let dpr = 1
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = Math.max(1, Math.round(canvas.clientWidth * dpr))
      H = Math.max(1, Math.round(canvas.clientHeight * dpr))
      canvas.width = W
      canvas.height = H
      s.dirty = true
    }
    resize()
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null
    ro?.observe(canvas)
    const io =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver((es) => {
            s.visible = es.some((e) => e.isIntersecting)
            s.dirty = true
          })
        : null
    io?.observe(canvas)

    const NB = 7
    const px = new Float32Array(CORE_N + GRAIN_N)
    const py = new Float32Array(CORE_N + GRAIN_N)
    const pr = new Float32Array(CORE_N)
    const bin = new Uint8Array(CORE_N + GRAIN_N)
    let raf = 0

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = s.lastT ? Math.min(0.05, (now - s.lastT) / 1000) : 0.016
      s.lastT = now
      if (!s.visible) return
      // motion
      if (!s.drag) {
        const base = s.reduced ? 0 : 0.16
        s.vyaw += (base - s.vyaw) * Math.min(1, dt * 1.6)
        s.yaw += s.vyaw * dt
      }
      s.yawLean += (s.tYaw - s.yawLean) * Math.min(1, dt * 3)
      s.pitch += (s.tPitch - s.pitch) * Math.min(1, dt * 3)
      if (s.morphT < 1) s.morphT = Math.min(1, s.morphT + dt / 1.3)
      const moving = !s.reduced || s.drag || Math.abs(s.vyaw) > 0.002 || s.morphT < 1 || Math.abs(s.tPitch - s.pitch) > 0.001
      if (!moving && !s.dirty) return
      s.dirty = false

      const { ink, bg } = s.colors
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const cx = W / 2
      const cy = H / 2
      const scale = Math.min(W, H) * 0.34
      const f = 3.4
      const yaw = s.yaw + s.yawLean
      const pitch = s.pitch
      const m = easeInOutCubic(s.morphT)
      const A = s.from
      const B = s.to
      const mixP = (arrB: Float32Array, arrA: Float32Array | undefined, i: number) => (arrA && m < 1 ? arrA[i] + (arrB[i] - arrA[i]) * m : arrB[i])

      // crosshair behind everything
      const reach = scale * 1.38
      const grad = (x1: number, y1: number, x2: number, y2: number) => {
        const g = ctx.createLinearGradient(x1, y1, x2, y2)
        g.addColorStop(0, mixHex(ink, bg, 1))
        g.addColorStop(0.5, mixHex(ink, bg, 0.35))
        g.addColorStop(1, mixHex(ink, bg, 1))
        return g
      }
      ctx.lineWidth = Math.max(1, dpr)
      ctx.strokeStyle = grad(cx, cy - reach, cx, cy + reach)
      ctx.beginPath()
      ctx.moveTo(cx, cy - reach)
      ctx.lineTo(cx, cy + reach)
      ctx.stroke()
      ctx.strokeStyle = grad(cx - reach, cy, cx + reach, cy)
      ctx.beginPath()
      ctx.moveTo(cx - reach, cy)
      ctx.lineTo(cx + reach, cy)
      ctx.stroke()

      // project — yaw/pitch trig is hoisted out of the point loops (the same
      // math as project(), just not recomputing 4 cos/sin per grain)
      const cyw = Math.cos(yaw)
      const syw = Math.sin(yaw)
      const cpt = Math.cos(pitch)
      const spt = Math.sin(pitch)
      const mix = A != null && m < 1
      for (let i = 0; i < CORE_N; i++) {
        const o = i * 4
        const bx = B.core[o]
        const by = B.core[o + 1]
        const bz = B.core[o + 2]
        const br = B.core[o + 3]
        let x = bx
        let y = by
        let z = bz
        let r = br
        if (mix) {
          x = A.core[o] + (bx - A.core[o]) * m
          y = A.core[o + 1] + (by - A.core[o + 1]) * m
          z = A.core[o + 2] + (bz - A.core[o + 2]) * m
          r = A.core[o + 3] + (br - A.core[o + 3]) * m
        }
        const x1 = x * cyw + z * syw
        const z1 = -x * syw + z * cyw
        const y2 = y * cpt - z1 * spt
        const z2 = y * spt + z1 * cpt
        const sc = f / (f - z2)
        px[i] = cx + x1 * sc * scale
        py[i] = cy + y2 * sc * scale
        pr[i] = r * scale * sc * 0.78
        bin[i] = clamp(Math.floor(((z2 + 1.25) / 2.5) * NB), 0, NB - 1)
      }
      for (let g = 0; g < GRAIN_N; g++) {
        const o = g * 3
        const bx = B.grain[o]
        const by = B.grain[o + 1]
        const bz = B.grain[o + 2]
        let x = bx
        let y = by
        let z = bz
        if (mix) {
          x = A.grain[o] + (bx - A.grain[o]) * m
          y = A.grain[o + 1] + (by - A.grain[o + 1]) * m
          z = A.grain[o + 2] + (bz - A.grain[o + 2]) * m
        }
        const i = CORE_N + g
        const x1 = x * cyw + z * syw
        const z1 = -x * syw + z * cyw
        const y2 = y * cpt - z1 * spt
        const z2 = y * spt + z1 * cpt
        const sc = f / (f - z2)
        px[i] = cx + x1 * sc * scale
        py[i] = cy + y2 * sc * scale
        bin[i] = clamp(Math.floor(((z2 + 1.25) / 2.5) * NB), 0, NB - 1)
      }
      const gs = Math.max(1, 1.15 * dpr)
      const pass = (b: number) => {
        const fade = 0.62 * (1 - b / (NB - 1))
        ctx.fillStyle = mixHex(ink, bg, fade)
        ctx.beginPath()
        let drew = false
        for (let i = 0; i < CORE_N; i++) {
          if (bin[i] !== b) continue
          drew = true
          ctx.moveTo(px[i] + pr[i], py[i])
          ctx.arc(px[i], py[i], pr[i], 0, Math.PI * 2)
        }
        if (drew) ctx.fill()
        ctx.fillStyle = mixHex(ink, bg, Math.min(0.85, fade + 0.12))
        for (let i = CORE_N; i < CORE_N + GRAIN_N; i++) if (bin[i] === b) ctx.fillRect(px[i], py[i], gs, gs)
      }
      const spikes = (front: boolean) => {
        ctx.lineWidth = Math.max(0.75, 0.8 * dpr)
        for (let k = 0; k < SPIKE_N; k++) {
          const o = k * 6
          const a = project(mixP(B.spikes, A?.spikes, o), mixP(B.spikes, A?.spikes, o + 1), mixP(B.spikes, A?.spikes, o + 2), yaw, pitch, f)
          const e = project(mixP(B.spikes, A?.spikes, o + 3), mixP(B.spikes, A?.spikes, o + 4), mixP(B.spikes, A?.spikes, o + 5), yaw, pitch, f)
          if (a[2] >= 0 !== front) continue
          const g = ctx.createLinearGradient(cx + a[0] * scale, cy + a[1] * scale, cx + e[0] * scale, cy + e[1] * scale)
          g.addColorStop(0, mixHex(ink, bg, front ? 0.1 : 0.5))
          g.addColorStop(1, mixHex(ink, bg, 1))
          ctx.strokeStyle = g
          ctx.beginPath()
          ctx.moveTo(cx + a[0] * scale, cy + a[1] * scale)
          ctx.lineTo(cx + e[0] * scale, cy + e[1] * scale)
          ctx.stroke()
        }
      }

      spikes(false)
      for (let b = 0; b < Math.floor(NB / 2) + 1; b++) pass(b)

      // the glass sphere: an inverted, shrunken copy of what's behind it
      const rs = SPHERE_R * scale * (f / (f - 0))
      const span = rs * 3.1
      if (lctx) {
        const ls = Math.max(1, Math.ceil(rs * 2))
        if (lens.width !== ls) {
          lens.width = ls
          lens.height = ls
        }
        lctx.setTransform(1, 0, 0, 1, 0, 0)
        lctx.fillStyle = bg
        lctx.fillRect(0, 0, ls, ls)
        lctx.drawImage(canvas, cx - span, cy - span, span * 2, span * 2, 0, 0, ls, ls)
      }
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, rs, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = bg
      ctx.fillRect(cx - rs, cy - rs, rs * 2, rs * 2)
      if (lctx) {
        ctx.translate(cx, cy)
        ctx.rotate(Math.PI + yaw * 0.15)
        ctx.globalAlpha = 0.85
        ctx.drawImage(lens, -rs, -rs, rs * 2, rs * 2)
        ctx.globalAlpha = 1
        ctx.setTransform(1, 0, 0, 1, 0, 0)
      }
      // rim darkening + soft fill
      const rim = ctx.createRadialGradient(cx - rs * 0.25, cy - rs * 0.3, rs * 0.1, cx, cy, rs)
      rim.addColorStop(0, "rgba(255,255,255,.55)")
      rim.addColorStop(0.55, "rgba(255,255,255,.12)")
      rim.addColorStop(0.86, mixHex(ink, bg, 0.82).replace("rgb", "rgba").replace(")", ",.25)"))
      rim.addColorStop(1, mixHex(ink, bg, 0.3).replace("rgb", "rgba").replace(")", ",.7)"))
      ctx.fillStyle = rim
      ctx.fillRect(cx - rs, cy - rs, rs * 2, rs * 2)
      // inner rings + the seed-flower at the core
      ctx.strokeStyle = mixHex(ink, bg, 0.6)
      ctx.lineWidth = Math.max(0.6, 0.7 * dpr)
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath()
        ctx.ellipse(cx, cy, rs * (0.28 + r * 0.17), rs * (0.12 + r * 0.08), yaw * 0.6 + r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.strokeStyle = mixHex(ink, bg, 0.15)
      const petals = 6
      for (let k = 0; k < petals; k++) {
        const a = (k / petals) * Math.PI * 2 + yaw * 0.9
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.quadraticCurveTo(cx + Math.cos(a + 0.5) * rs * 0.34, cy + Math.sin(a + 0.5) * rs * 0.34, cx + Math.cos(a) * rs * 0.5, cy + Math.sin(a) * rs * 0.5)
        ctx.stroke()
      }
      // a tiny figure for scale
      ctx.fillStyle = mixHex(ink, bg, 0.05)
      const fh = rs * 0.2
      ctx.beginPath()
      ctx.arc(cx, cy + rs * 0.36, fh * 0.16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(cx - fh * 0.12, cy + rs * 0.36 + fh * 0.18, fh * 0.24, fh * 0.55)
      // highlight
      const hl = ctx.createRadialGradient(cx - rs * 0.38, cy - rs * 0.42, 0, cx - rs * 0.38, cy - rs * 0.42, rs * 0.42)
      hl.addColorStop(0, "rgba(255,255,255,.9)")
      hl.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = hl
      ctx.fillRect(cx - rs, cy - rs, rs * 2, rs * 2)
      ctx.restore()
      ctx.strokeStyle = mixHex(ink, bg, 0.45)
      ctx.lineWidth = Math.max(1, dpr)
      ctx.beginPath()
      ctx.arc(cx, cy, rs, 0, Math.PI * 2)
      ctx.stroke()

      for (let b = Math.floor(NB / 2) + 1; b < NB; b++) pass(b)
      spikes(true)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      io?.disconnect()
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = st.current
    s.drag = true
    s.lastX = e.clientX
    s.downX = e.clientX
    s.downY = e.clientY
    s.vyaw = 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = st.current
    const r = e.currentTarget.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width - 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5
    s.tPitch = 0.18 + ny * 0.7
    if (s.drag) {
      const dx = e.clientX - s.lastX
      s.lastX = e.clientX
      s.yaw += dx * 0.01
      s.vyaw = dx * 0.6
    } else s.tYaw = nx * 0.5
    s.dirty = true
  }
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = st.current
    if (!s.drag) return
    s.drag = false
    s.vyaw = clamp(s.vyaw, -6, 6)
    if (Math.hypot(e.clientX - s.downX, e.clientY - s.downY) < 4) onReforge()
  }
  const onLeave = () => {
    st.current.tPitch = 0.18
    st.current.tYaw = 0
  }
  const onKey = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const s = st.current
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      s.vyaw = e.key === "ArrowLeft" ? -2.4 : 2.4
      s.dirty = true
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onReforge()
    }
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      tabIndex={0}
      aria-label="Escultura de tinta. Arrastra o usa las flechas del teclado para rotarla; pulsa Intro para recrearla."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onLeave}
      onKeyDown={onKey}
    />
  )
}

/* ---------------------------------------------------------------- features */

function FlowCard({ brand, features, uid, reduced, inView }: { brand: string; features: InkFeatures; uid: string; reduced: boolean; inView: boolean }) {
  const [reports, setReports] = React.useState(128)
  const [side, setSide] = React.useState("" as "" | "left" | "right")
  React.useEffect(() => {
    if (reduced || !inView) return
    const t = setInterval(() => setReports((n) => n + 1), 2800)
    return () => clearInterval(t)
  }, [reduced, inView])
  const team = [
    { x: 58, y: 38, name: "Operaciones · editando" },
    { x: 104, y: 22, name: "Soporte · revisando" },
    { x: 150, y: 40, name: "Infraestructura · publicando" },
    { x: 46, y: 92, name: "Equipo · en panel" },
    { x: 146, y: 114, name: "Equipo · inactivo" },
  ]
  const L1 = "M117,67 C196,67 210,100 262,100" // out of the team node …
  const L2 = "M117,73 C186,73 206,120 262,120" // … into the hub chip
  const R1 = "M378,100 C412,100 418,86 450,86" // hub → front report sheet
  const R2 = "M378,120 C412,120 418,134 450,134"
  const chip = brand.split(" ")[0].toUpperCase()
  const chipLong = chip.length * 6.7 > 58 // ~6.7px per char at 8.5px + 1.4 tracking
  const rays = uid + "rays"
  const glow = uid + "glow"
  return (
    <div className="nf-frame nf-frame-hover nf-wide">
      <Brackets />
      <div className="nf-card" style={{ padding: 0, overflow: "hidden" }}>
        <svg className="nf-diagram" viewBox="0 0 640 178" role="img" aria-label={"Los cambios de tu equipo fluyen a través de " + brand + " hasta los informes finales"}>
          <defs>
            <radialGradient id={glow} cx="320" cy="110" r="190" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--nf-raise)" stopOpacity="1" />
              <stop offset="1" stopColor="var(--nf-raise)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={rays} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--nf-line-strong)" stopOpacity=".55" />
              <stop offset="1" stopColor="var(--nf-line-strong)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="640" height="178" fill={"url(#" + glow + ")"} />
          {[-62, -38, -14, 14, 38, 62].map((a, i) => (
            <path key={i} d={"M320,110 L" + (320 + Math.sin((a * Math.PI) / 180) * 260) + "," + (110 - Math.cos((a * Math.PI) / 180) * 260) + " L" + (320 + Math.sin(((a + 7) * Math.PI) / 180) * 260) + "," + (110 - Math.cos(((a + 7) * Math.PI) / 180) * 260) + "Z"} fill={"url(#" + rays + ")"} opacity=".5" />
          ))}

          {/* team cluster */}
          <g onMouseEnter={() => setSide("left")} onMouseLeave={() => setSide("")}>
            <rect x="20" y="8" width="170" height="130" fill="transparent" />
            {team.map((m, i) => (
              <line key={"l" + i} x1={m.x} y1={m.y} x2="104" y2="70" stroke="var(--nf-line-strong)" strokeDasharray="2 3" />
            ))}
            <g transform="translate(91,57)">
              <rect width="26" height="26" rx="5" className="nf-node" />
              <g transform="translate(5,5)" style={{ color: "var(--nf-ink)" }}>
                <Mark size={16} />
              </g>
            </g>
            {team.map((m, i) => (
              <g key={i} className="nf-av" tabIndex={0} role="img" aria-label={m.name}>
                <svg x={m.x - 11} y={m.y - 11} width="22" height="22" viewBox="0 0 22 22" overflow="visible">
                  <clipPath id={uid + "avc" + i}>
                    <circle cx="11" cy="11" r="11" />
                  </clipPath>
                  <g clipPath={"url(#" + uid + "avc" + i + ")"}>
                    <Portrait index={i} size={22} uid={uid + "f"} />
                  </g>
                  <circle cx="11" cy="11" r="10.5" fill="none" stroke="var(--nf-paper)" strokeWidth="1.5" />
                </svg>
                <circle cx={m.x + 8} cy={m.y + 8} r="2.6" fill={i === 4 ? "var(--nf-faint)" : "var(--nf-accent)"} stroke="var(--nf-paper)" className={i === 4 ? undefined : "nf-presence"} />
                <g className="nf-av-tip" transform={"translate(" + m.x + "," + (m.y - 18) + ")"}>
                  <rect x={-m.name.length * 2.45 - 6} y="-9" width={m.name.length * 4.9 + 12} height="14" rx="2" fill="var(--nf-inv)" />
                  <text x="0" y="1" textAnchor="middle" fontSize="7.5" fill="var(--nf-inv-ink)" fontFamily="var(--nf-sans)">
                    {m.name}
                  </text>
                </g>
              </g>
            ))}
          </g>

          {/* connectors */}
          {[L1, L2].map((d, i) => (
            <path key={d} d={d} className={"nf-flow" + (side === "left" ? " nf-flow-on" : "") + (i ? " nf-dash" : "")} />
          ))}
          {[R1, R2].map((d, i) => (
            <path key={d} d={d} className={"nf-flow" + (side === "right" ? " nf-flow-on" : "") + (i ? " nf-dash" : "")} />
          ))}
          {!reduced &&
            [L1, L2, R1, R2].map((d, i) => (
              <circle key={"p" + i} r="2.2" className="nf-pkt">
                <animateMotion dur={2.2 + (i % 2) * 0.6 + "s"} begin={i * 0.35 + "s"} repeatCount="indefinite" path={d} />
              </circle>
            ))}

          {/* the hub chip */}
          <g transform="translate(262,88)">
            <rect x="-4" y="-4" width="124" height="52" rx="8" fill="none" stroke="var(--nf-line)" className={reduced ? undefined : "nf-glow"} />
            <rect width="116" height="44" rx="6" className="nf-node" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,.08))" }} />
            <g transform="translate(13,14)" style={{ color: "var(--nf-ink)" }}>
              <Mark size={16} />
            </g>
            {/* 36→94 is all the room before the chevron; a long name is squeezed rather than run into it */}
            <text x="36" y="26" fontSize="8.5" letterSpacing="1.4" fontWeight="600" fill="var(--nf-soft)" fontFamily="var(--nf-sans)" textLength={chipLong ? 58 : undefined} lengthAdjust={chipLong ? "spacingAndGlyphs" : undefined}>
              {chip}
            </text>
            <path d="M100 18l4 4-4 4" fill="none" stroke="var(--nf-muted)" strokeWidth="1.3" />
          </g>

          {/* the report stack */}
          <g onMouseEnter={() => setSide("right")} onMouseLeave={() => setSide("")}>
            {[2, 1, 0].map((k) => (
              <g key={reports - k} transform={"translate(" + (450 + k * 12) + "," + (40 - k * 10) + ")"} opacity={1 - k * 0.25}>
                <g className={"nf-sheet" + (k === 0 ? " nf-sheet-new" : "")}>
                <rect width="138" height="102" rx="3" fill="var(--nf-raise)" stroke="var(--nf-line-strong)" />
                {k === 0 && (
                  <>
                    <text x="10" y="16" fontSize="7" fill="var(--nf-muted)" fontFamily="var(--nf-mono)">
                      {"INFORME #" + reports}
                    </text>
                    <rect x="10" y="24" width="64" height="5" rx="1" fill="var(--nf-ink)" opacity=".75" />
                    <rect x="10" y="33" width="92" height="3" rx="1" fill="var(--nf-line-strong)" />
                    <rect x="10" y="39" width="80" height="3" rx="1" fill="var(--nf-line-strong)" />
                    {[18, 26, 14, 30, 22, 34].map((h, j) => (
                      <rect key={j} x={12 + j * 13} y={92 - h} width="8" height={h} fill="var(--nf-ink)" opacity={0.25 + j * 0.12} />
                    ))}
                    <path d="M92 64h34M92 72h28M92 80h32" stroke="var(--nf-line-strong)" strokeWidth="2.5" />
                  </>
                )}
                </g>
              </g>
            ))}
          </g>
        </svg>
        <div className="nf-wide-copy" style={{ padding: "0 22px 20px" }}>
          <div>
            <h3>{features.collaboration.title}</h3>
            <p>{features.collaboration.description}</p>
          </div>
          <div>
            <h3>{features.reports.title}</h3>
            <p>{features.reports.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function IntegrationsCard({ copy, reduced }: { copy: InkFeatures["integrations"]; reduced: boolean }) {
  const [hover, setHover] = React.useState(-1)
  const [auto, setAuto] = React.useState(0)
  React.useEffect(() => {
    if (reduced || hover >= 0) return
    const t = setInterval(() => setAuto((a) => (a + 1) % 4), 1700)
    return () => clearInterval(t)
  }, [reduced, hover])
  const on = hover >= 0 ? hover : reduced ? -1 : auto
  const tiles = [
    { x: 66, y: 34 },
    { x: 66, y: 116 },
    { x: 234, y: 34 },
    { x: 234, y: 116 },
  ]
  const path = (i: number) => {
    const t = tiles[i]
    const dir = t.x < 150 ? -1 : 1
    return "M" + (150 + dir * 17) + ",75 H" + (150 + dir * 42) + " V" + t.y + " H" + (t.x - dir * 15)
  }
  return (
    <div className="nf-frame nf-frame-hover">
      <Brackets />
      <div className="nf-card" style={{ height: "100%" }}>
        <svg className="nf-diagram" viewBox="0 0 300 150" role="group" aria-label="Integraciones">
          {tiles.map((_, i) => (
            <path key={i} d={path(i)} className={"nf-flow" + (on === i ? " nf-flow-on" : "")} />
          ))}
          {!reduced && on >= 0 && (
            <circle key={on} r="2.2" className="nf-pkt">
              <animateMotion dur="1.1s" repeatCount="indefinite" path={path(on)} />
            </circle>
          )}
          <g transform="translate(133,58)">
            <rect width="34" height="34" rx="7" className="nf-node" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,.08))" }} />
            <g transform="translate(8,8)" style={{ color: "var(--nf-ink)" }}>
              <Mark size={18} />
            </g>
          </g>
          {tiles.map((t, i) => (
            <g
              key={i}
              className={"nf-tool" + (on === i ? " nf-tool-on" : "")}
              tabIndex={0}
              role="img"
              aria-label={copy.tools[i] ?? "Herramienta"}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(-1)}
            >
              <rect x={t.x - 15} y={t.y - 15} width="30" height="30" rx="6" className="nf-node" />
              <g transform={"translate(" + t.x + "," + t.y + ")"} style={{ color: "var(--nf-ink)" }}>
                <ToolGlyph index={i} />
              </g>
              <text x={t.x} y={t.y + (t.y < 75 ? -21 : 28)} textAnchor="middle" fontSize="8" fill="var(--nf-muted)" fontFamily="var(--nf-sans)" opacity={on === i ? 1 : 0} style={{ transition: "opacity .25s" }}>
                {copy.tools[i] ?? ""}
              </text>
            </g>
          ))}
          <text x="150" y="112" textAnchor="middle" fontSize="7" fill="var(--nf-faint)" fontFamily="var(--nf-mono)">
            {on >= 0 ? "sincronizando · " + (copy.tools[on] ?? "").toLowerCase() : "4 conectadas"}
          </text>
        </svg>
        <div style={{ marginTop: "auto" }}>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
      </div>
    </div>
  )
}

function InsightsCard({ copy, uid, reduced }: { copy: InkFeatures["insights"]; uid: string; reduced: boolean }) {
  // Sin badge de delta: `copy.values` es una serie DECORATIVA (ver content.ts),
  // no un dato real de Innova-Tech, y de ella salía un "+N%" inventado en
  // pantalla. La gráfica solo conserva su forma y la marca "PRONÓSTICO".
  const [ref, inView] = useInView(0.3)
  const [hover, setHover] = React.useState(-1)
  const W = 300
  const H = 130
  const vals = copy.values.length > 1 ? copy.values : [1, 2]
  const { line, area, points } = chartPaths(vals, W, H, 14)
  const split = clamp(copy.forecastFrom, 1, vals.length - 1)
  const fill = uid + "area"
  const last = points[points.length - 1]
  const i = hover >= 0 ? hover : points.length - 1
  const p = points[i]
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setHover(nearestIndex(points.map((q) => q[0]), ((e.clientX - r.left) / r.width) * W))
  }
  return (
    <div className="nf-frame nf-frame-hover" ref={ref as React.Ref<HTMLDivElement>} data-in={inView}>
      <Brackets />
      <div className="nf-card" style={{ height: "100%" }}>
        <svg className="nf-diagram nf-chart" viewBox={"0 0 " + W + " " + (H + 6)} onPointerMove={onMove} onPointerLeave={() => setHover(-1)} role="img" aria-label={copy.title + " (gráfico)"}>
          <defs>
            <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--nf-ink)" stopOpacity=".12" />
              <stop offset="1" stopColor="var(--nf-ink)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="14" x2={W - 14} y1={H * g} y2={H * g} stroke="var(--nf-line)" />
          ))}
          <path d={area} fill={"url(#" + fill + ")"} />
          <path d={line} fill="none" stroke="var(--nf-ink)" strokeWidth="1.4" pathLength={1} className="nf-line-draw" opacity=".85" />
          <line x1={points[split][0]} x2={points[split][0]} y1="10" y2={H - 14} stroke="var(--nf-line-strong)" strokeDasharray="2 3" />
          <text x={points[split][0] - 4} y={H - 18} textAnchor="end" fontSize="7" fill="var(--nf-faint)" fontFamily="var(--nf-mono)">
            PRONÓSTICO
          </text>
          {hover >= 0 && <line x1={p[0]} x2={p[0]} y1="8" y2={H - 14} stroke="var(--nf-ink)" strokeOpacity=".35" />}
          {!reduced && hover < 0 && <circle cx={last[0]} cy={last[1]} r="7" fill="var(--nf-ink)" opacity=".15" className="nf-glow" />}
          <circle cx={p[0]} cy={p[1]} r="3.2" fill="var(--nf-raise)" stroke="var(--nf-ink)" strokeWidth="1.5" />
        </svg>
        <div style={{ marginTop: "auto" }}>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
      </div>
    </div>
  )
}

// El stat dice SIEMPRE el valor final: `renderToString` escribe exactamente
// este string en landing/index.html, markup que leen los crawlers y ve un
// navegador sin JS. El count-up anterior arrancaba en t=0, así que ese HTML
// prerenderizado decía "Operando desde 0" / "Sistemas en producción 0" y, con
// JS, la cifra volvía a 0 al entrar en viewport (flash de contenido falso).
// La cifra ya no cambia nunca: lo único que se anima al entrar en pantalla es
// la presentación del valor (opacity/translate), y con prefers-reduced-motion
// ni eso.
function StatValue({ value, run, reduced }: { value: string; run: boolean; reduced: boolean }) {
  const enter = run && !reduced
  return <span className={"nf-stat-n" + (enter ? " nf-stat-n-in" : "")}>{formatStat(value, 1)}</span>
}

/* -------------------------------------------------------------- demo dialog */

function DemoDialog({ steps, onClose, reduced }: { steps: InkDemoStep[]; onClose: () => void; reduced: boolean }) {
  const [elapsed, setElapsed] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const closeRef = React.useRef(null as HTMLButtonElement | null)
  const per = 1.6
  const total = steps.length * per
  React.useEffect(() => {
    closeRef.current?.focus()
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    addEventListener("keydown", onKey)
    return () => {
      removeEventListener("keydown", onKey)
      prev?.focus?.()
    }
  }, [onClose])
  React.useEffect(() => {
    setElapsed(reduced ? total : 0)
    if (reduced) return
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const e = (now - t0) / 1000
      setElapsed(Math.min(total, e))
      if (e < total) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, total, reduced])
  const done = elapsed >= total
  // Cabecera sin cronómetro: la walkthrough es metodológica, no una ejecución
  // cronometrada de un flujo automatizado.
  const stepNo = Math.min(steps.length, Math.floor(elapsed / per) + 1)
  return (
    <div className="nf-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="nf-dialog" role="dialog" aria-modal="true" aria-label="Metodología de trabajo">
        <div className="nf-dialog-head">
          <span>
            <i className="nf-live" />
            {done ? "Metodología de entrega" : "Fase " + stepNo + " de " + steps.length}
          </span>
          <button ref={closeRef} type="button" className="nf-icon-btn" onClick={onClose} aria-label="Cerrar metodología">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ol className="nf-steps" aria-live="polite">
          {steps.map((s, i) => {
            const state = elapsed >= (i + 1) * per ? "done" : elapsed >= i * per ? "run" : "wait"
            return (
              <li key={i} className="nf-step" data-state={state}>
                <span className="nf-step-ix">{state === "done" ? <Check /> : state === "run" ? <i className="nf-spin" /> : String(i + 1).padStart(2, "0")}</span>
                <span>
                  <b>{s.label}</b>
                  <small>{s.detail}</small>
                </span>
                <span className="nf-step-t">{state === "run" ? "…" : ""}</span>
              </li>
            )
          })}
        </ol>
        <div className="nf-bar">
          <i style={{ width: (total > 0 ? elapsed / total : 1) * 100 + "%" }} />
        </div>
        <div className="nf-dialog-foot">
          <span>Cada fase queda documentada y entregada.</span>
          <button type="button" className="nf-btn nf-btn-ghost" onClick={() => setRun((r) => r + 1)} disabled={!done}>
            Repetir
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- component */

export default function InkOrbitSaasTemplate({
  brand = "Innova-Tech",
  nav = D_NAV,
  navCta = "Contacto",
  hero,
  features,
  about,
  faq = D_FAQ,
  cta,
  footerTagline = "El dominio de las tecnologías emergentes. Operando desde 1998.",
  // Sin columnas por defecto: la plantilla traía enlaces inventados ("Empleo",
  // "Blog", "Novedades", "Términos") apuntando a "#". Las reales va en content.ts.
  footerColumns = [],
  demoSteps = D_STEPS,
  sculptureSeed = 7,
  onReforge,
  onGetStarted,
  onStartTrial,
  onWatchDemo,
  accent = "#22D3EE",
  fonts,
  defaultTheme = "light",
  onThemeChange,
  maxWidth = "1180px",
  height = "100svh",
  className = "",
}: InkOrbitSaasTemplateProps) {
  const uid = "nf" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const reduced = useReducedMotion()
  const H = { ...D_HERO, ...hero }
  const F = {
    ...D_FEATURES,
    ...features,
    collaboration: { ...D_FEATURES.collaboration, ...features?.collaboration },
    reports: { ...D_FEATURES.reports, ...features?.reports },
    integrations: { ...D_FEATURES.integrations, ...features?.integrations },
    insights: { ...D_FEATURES.insights, ...features?.insights },
  }
  const A = { ...D_ABOUT, ...about }
  const C = { ...D_CTA, ...cta }
  const accents = H.titleAccent.length ? H.titleAccent : [""]

  /* theme: "system" follows the host's .dark class first, then the OS */
  const [theme, setTheme] = React.useState((defaultTheme === "dark" ? "dark" : "light") as Theme)
  const [themeTouched, setThemeTouched] = React.useState(false)
  React.useEffect(() => {
    if (defaultTheme !== "system" || themeTouched) return
    const read = () =>
      setTheme(
        document.documentElement.classList.contains("dark") ||
          (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches)
          ? "dark"
          : "light",
      )
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null
    mq?.addEventListener?.("change", read)
    return () => {
      mo.disconnect()
      mq?.removeEventListener?.("change", read)
    }
  }, [defaultTheme, themeTouched])
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    setThemeTouched(true)
    setTheme(next)
    onThemeChange?.(next)
  }

  /* sections + nav */
  const sections = React.useRef({} as Record<string, HTMLElement | null>)
  const setSection = (key: string) => (el: HTMLElement | null) => {
    sections.current[key] = el
  }
  const [active, setActive] = React.useState(nav[0]?.target ?? "home")
  const [menu, setMenu] = React.useState(false)
  React.useEffect(() => {
    if (typeof IntersectionObserver !== "function") return
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.section ?? "")
      },
      { rootMargin: "-40% 0px -55% 0px" },
    )
    Object.values(sections.current).forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])
  const go = (target: string) => (e: React.MouseEvent) => {
    const el = sections.current[target]
    setMenu(false)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
    setActive(target)
  }
  const linksRef = React.useRef(null as HTMLDivElement | null)
  const [caret, setCaret] = React.useState({ x: 0, on: false })
  useIsoLayoutEffect(() => {
    const box = linksRef.current
    if (!box) return
    const place = () => {
      const el = box.querySelector('[aria-current="true"]') as HTMLElement | null
      setCaret(el ? { x: el.offsetLeft + el.offsetWidth / 2 - 5, on: true } : { x: 0, on: false })
    }
    place()
    if (typeof ResizeObserver !== "function") return
    const ro = new ResizeObserver(place)
    ro.observe(box)
    return () => ro.disconnect()
  }, [active, nav.length])

  /* hero */
  const [wordIx, setWordIx] = React.useState(0)
  const [wordOut, setWordOut] = React.useState(false)
  React.useEffect(() => {
    if (accents.length < 2 || reduced) return
    let out = 0
    const t = setInterval(() => {
      setWordOut(true)
      out = window.setTimeout(() => {
        setWordIx((i) => (i + 1) % accents.length)
        setWordOut(false)
      }, 420)
    }, 3600)
    return () => {
      clearInterval(t)
      clearTimeout(out)
    }
  }, [accents.length, reduced])
  const [seed, setSeed] = React.useState(sculptureSeed)
  React.useEffect(() => setSeed(sculptureSeed), [sculptureSeed])
  const reforge = () => {
    const next = (seed * 48271 + 11) % 2147483647 % 100000
    setSeed(next)
    onReforge?.(next)
  }
  const [demo, setDemo] = React.useState(false)
  const closeDemo = React.useCallback(() => setDemo(false), [])
  const artColors: ArtColors = theme === "dark" ? { ink: "#E8EEFF", bg: "#0A0E1E" } : { ink: "#10162E", bg: "#F7F9FF" }

  /* reveals */
  const [featRef, featIn] = useInView(0.12)
  const [aboutRef, aboutIn] = useInView(0.2)

  /* faq */
  const [open, setOpen] = React.useState(0)

  const style = {
    minHeight: height,
    "--nf-accent": accent,
    "--nf-max": maxWidth,
    "--nf-h": height,
    ...(fonts?.sans ? { "--nf-sans": fonts.sans } : {}),
    ...(fonts?.serif ? { "--nf-serif": fonts.serif } : {}),
    ...(fonts?.mono ? { "--nf-mono": fonts.mono } : {}),
  } as React.CSSProperties

  const navLink = (l: InkNavLink, i: number) => {
    const internal = !/[/:#.]/.test(l.target)
    return (
      <a
        key={i}
        className="nf-link"
        href={internal ? "#" + l.target : l.target}
        aria-current={internal && active === l.target ? "true" : undefined}
        onClick={internal ? go(l.target) : undefined}
      >
        {l.label}
      </a>
    )
  }
  // an anchor that opens CONTACT_URL unless a caller supplied its own handler
  const linkClick = (fn?: () => void) =>
    fn
      ? (e: React.MouseEvent) => {
          e.preventDefault()
          fn()
        }
      : undefined
  const year = new Date().getFullYear()

  return (
    <div className={"nf-root " + className} data-theme={theme} style={style}>
      <style>{NF_CSS}</style>
      <div className="nf-shell">
        {/* ---------------- nav */}
        <header className="nf-nav">
          <div className="nf-frame">
            <Brackets />
            <nav className="nf-navbar" aria-label="Principal">
              <a className="nf-brand" href="#home" onClick={go("home")}>
                <Mark size={18} />
                {brand}
              </a>
              <div className="nf-links" ref={linksRef}>
                {nav.map(navLink)}
                <svg className="nf-caret" viewBox="0 0 10 6" aria-hidden="true" style={{ transform: "translateX(" + caret.x + "px)", opacity: caret.on ? 1 : 0 }}>
                  <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </div>
              <div className="nf-nav-end">
                <button type="button" className="nf-icon-btn" onClick={toggleTheme} aria-label={"Cambiar al tema " + (theme === "dark" ? "claro" : "oscuro")}>
                  <ThemeIcon dark={theme === "dark"} />
                </button>
                <span className="nf-frame">
                  <a className="nf-btn nf-btn-ghost" href={CONTACT_URL} onClick={linkClick(onGetStarted)}>
                    {navCta}
                  </a>
                </span>
                <button type="button" className="nf-icon-btn nf-menu-btn" aria-expanded={menu} aria-label="Menú" onClick={() => setMenu((m) => !m)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d={menu ? "M3.5 3.5l9 9M12.5 3.5l-9 9" : "M2 5h12M2 11h12"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </nav>
            {menu && <div className="nf-mobile">{nav.map(navLink)}</div>}
          </div>
        </header>

        {/* ---------------- hero */}
        <section className="nf-sec nf-hero" id="home" ref={setSection("home")} data-section="home" aria-label="Introducción">
          <div className="nf-hero-copy">
            <div className="nf-band">
              <h1 className="nf-h1">
                <span className="nf-h1-top">{H.titleTop}</span>
                <span className="nf-h1-acc" aria-live="polite">
                  <span key={wordIx} className={"nf-word" + (wordOut ? " nf-word-out" : "")}>
                    {accents[wordIx % accents.length]}
                  </span>
                </span>
              </h1>
            </div>
            <div className="nf-hero-body">
              <p className="nf-lede">{H.description}</p>
              <div className="nf-hero-ctas">
                <a className="nf-btn nf-btn-dark" href={CONTACT_URL} onClick={linkClick(onStartTrial)}>
                  {H.primaryCta}
                  <Arrow />
                </a>
                <span className="nf-frame nf-frame-hover">
                  <Brackets />
                  <button
                    type="button"
                    className="nf-btn nf-btn-ghost"
                    onClick={() => {
                      setDemo(true)
                      onWatchDemo?.()
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M3 1.8v8.4L10 6z" fill="currentColor" />
                    </svg>
                    {H.secondaryCta}
                  </button>
                </span>
              </div>
              <div className="nf-proof">
                <span className="nf-proof-faces">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i}>
                      <Portrait index={i} size={24} uid={uid + "h"} />
                    </span>
                  ))}
                </span>
                <span>Sistemas en producción desde 1998</span>
              </div>
            </div>
          </div>
          <div className="nf-art">
            <div className="nf-ticks" aria-hidden="true">
              <span>N 00°</span>
              <span>FORJA · 3D</span>
            </div>
            <InkSculpture seed={seed} colors={artColors} reduced={reduced} onReforge={reforge} />
            {H.sculptureHint && <span className="nf-art-hint">{H.sculptureHint}</span>}
            <span className="nf-art-seed">{"semilla " + String(seed).padStart(5, "0")}</span>
          </div>
        </section>

        {/* ---------------- features */}
        <section className="nf-sec nf-sec-pad" id="features" ref={setSection("features")} data-section="features" aria-labelledby={uid + "feat"}>
          <div className="nf-reveal" ref={featRef as React.Ref<HTMLDivElement>} data-in={featIn}>
            <div className="nf-head" id={uid + "feat"}>
              <span className="nf-tag">{F.tag}</span>
              <Title text={F.title} />
            </div>
            <div className="nf-bento">
              <FlowCard brand={brand} features={F} uid={uid} reduced={reduced} inView={featIn} />
              <IntegrationsCard copy={F.integrations} reduced={reduced} />
              <InsightsCard copy={F.insights} uid={uid} reduced={reduced} />
            </div>
          </div>
        </section>

        {/* ---------------- about + faq */}
        <section className="nf-sec nf-sec-pad" id="about" ref={setSection("about")} data-section="about" aria-labelledby={uid + "about"}>
          <div className="nf-reveal nf-about" ref={aboutRef as React.Ref<HTMLDivElement>} data-in={aboutIn}>
            <div>
              <div className="nf-head" id={uid + "about"}>
                <span className="nf-tag">{A.tag}</span>
                <Title text={A.title} />
              </div>
              <p className="nf-about-body">{A.body}</p>
              {A.stats.length > 0 && (
                <dl className="nf-stats">
                  {A.stats.map((s) => (
                    <div key={s.label} className="nf-stat">
                      <dd className="nf-stat-v">
                        <StatValue value={s.value} run={aboutIn} reduced={reduced} />
                      </dd>
                      <dt className="nf-stat-l">{s.label}</dt>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            {faq.length > 0 && (
              <div>
                <p className="nf-faq-label">Preguntas frecuentes</p>
                <div className="nf-faq">
                  {faq.map((q, i) => (
                    <div key={i} className="nf-faq-item">
                      <button type="button" className="nf-faq-q" aria-expanded={open === i} aria-controls={uid + "faq" + i} onClick={() => setOpen(open === i ? -1 : i)}>
                        {q.question}
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                      <div className="nf-faq-a" id={uid + "faq" + i} data-open={open === i} role="region">
                        <div>
                          <p>{q.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ---------------- cta */}
        <section className="nf-sec nf-sec-pad nf-cta" aria-labelledby={uid + "cta"}>
          <div className="nf-cta-grid" aria-hidden="true" />
          <div style={{ position: "relative" }}>
            <div id={uid + "cta"}>
              <Title text={C.title} />
            </div>
            <p>{C.description}</p>
            <div className="nf-cta-actions">
              <a className="nf-btn" href={CONTACT_URL}>
                {C.button}
                <Arrow />
              </a>
            </div>
          </div>
        </section>

        {/* ---------------- footer */}
        <footer className="nf-sec">
          <div className="nf-foot">
            <div>
              <a className="nf-brand" href="#home" onClick={go("home")}>
                <Mark size={18} />
                {brand}
              </a>
              <p className="nf-foot-tag">{footerTagline}</p>
            </div>
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4>{col.title}</h4>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="nf-foot-bar">
              <span>
                © {year} {brand}. Todos los derechos reservados.
              </span>
              <button type="button" className="nf-theme" onClick={toggleTheme} aria-label={"Cambiar al tema " + (theme === "dark" ? "claro" : "oscuro")}>
                <ThemeIcon dark={theme === "dark"} />
                {theme === "dark" ? "Oscuro" : "Claro"}
              </button>
            </div>
          </div>
        </footer>
      </div>
      {demo && <DemoDialog steps={demoSteps} onClose={closeDemo} reduced={reduced} />}
    </div>
  )
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" style={{ transition: "transform .5s cubic-bezier(.2,.8,.2,1)", transform: dark ? "rotate(180deg)" : "none" }}>
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor" />
    </svg>
  )
}

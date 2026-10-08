// Contenido real de la landing Innova-Tech — Cableado contra
// `InkOrbitSaasTemplateProps` (ver src/InkOrbitLanding.tsx).
// Fuente de verdad: /tmp/landing-content.md (extracción del sitio estático).
// Regla de oro: nada inventado. Lo marcado con "// PROPUESTA" o "// DECORATIVO"
// se detalla en el bloque de ADVERTENCIAS del final del archivo.
//
// Nota de tipado: el objeto se anota como `InkOrbitSaasTemplateProps` (sin
// `as const`), así los arrays salen mutables y `defaultTheme` se infiere como
// el union literal correcto.

import type { InkOrbitSaasTemplateProps } from "./InkOrbitLanding"

const SITE = "https://innova-tech.com.mx"
const CONTACT_URL = SITE + "/contacto.html"
const CALENDLY_URL = "https://calendly.com/delao1212/llamada-de-diagnostico-estrategico"
// Ruta verificada en el sitio real: /root/innova-tech/site/privacy/innova-tech/index.html
const PRIVACY_URL = SITE + "/privacy/innova-tech/index.html"

export const landingProps: InkOrbitSaasTemplateProps = {
  /* ----------------------------------------------------------------- brand */
  brand: "Innova-Tech",

  /* ------------------------------------------------------------------- nav */
  // Labels literales del navbar/footer del sitio. Internas a la landing
  // (secciones reales: home/features/about); el resto con URL absoluta.
  nav: [
    { label: "Cómo trabajamos", target: "about" },
    { label: "Servicios", target: "features" },
    { label: "Casos reales", target: SITE + "/#expediciones" },
    { label: "Proyectos", target: SITE + "/#laboratorio" },
    { label: "Capacitaciones", target: SITE + "/capacitaciones.html" },
    { label: "Cursos Online", target: SITE + "/cursos.html" },
  ],

  /* ----------------------------------------------------------------- navCta */
  // Literal del botón de acción del navbar del sitio (navbar__actions
  // -> "Contacto" -> contacto.html). Sin handler: el componente ya apunta
  // el href a CONTACT_URL.
  navCta: "Contacto",

  /* ------------------------------------------------------------------ hero */
  hero: {
    // Titular literal de la portada (h1 de index.html).
    titleTop: "De la tecnología emergente a su ventaja operativa",
    // Línea serif rotativa: títulos literales de dominios de servicio
    // (DOM-01…DOM-03), frases cortas sin inventar.
    titleAccent: [
      "Inteligencia Artificial Privada",
      "Ciberseguridad de Defensa",
      "Infraestructura Crítica",
    ],
    // Subtítulo literal de la portada.
    description:
      "La convertimos en sistemas que operan todos los días. Construimos, desplegamos y damos mantenimiento.",
    // Literal del sitio: el CTA primario de la portada apunta a Calendly
    // (ver onStartTrial más abajo).
    primaryCta: "Agendar diagnóstico",
    // Literal del secundario de la portada ("Ver cómo trabajamos ↓"),
    // sin la flecha decorativa. Abre el diálogo de metodología.
    secondaryCta: "Ver cómo trabajamos",
    // sculptureHint: se deja el literal de la plantilla por defecto.
  },
  // El componente fija href=CONTACT_URL en el CTA primario salvo que se
  // pase handler; aquí se redirige al Calendly real del sitio.
  onStartTrial: () => {
    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer")
  },

  /* -------------------------------------------------------------- features */
  // La plantilla tiene 4 bloques de copy y el sitio tiene 5 dominios
  // (DOM-01…DOM-05). DOM-05 no cabe aquí: su descripción literal vive
  // en el FAQ propuesto de abajo.
  features: {
    tag: "Servicios", // literal del navbar del sitio (#dominios)
    // PROPUESTA — composición sobre el subtítulo literal de portada
    // ("sistemas que operan todos los días"); no hay un h2 literal corto
    // equivalente en el contenido extraído.
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
    // DOM-04 // AUTOMATIZACIÓN — los 4 tiles son productos/proyectos
    // reales del sitio.
    integrations: {
      title: "Software y Automatización",
      description:
        "Herramientas a la medida que convierten procesos manuales en sistemas que trabajan mientras usted duerme.",
      // La tarjeta dibuja exactamente 4 tiles ("4 conectadas" hardcodeado).
      tools: ["Open WebUI", "Arch-Credential", "FerrePOS", "Jarvis"],
    },
    // DOM-03 // INFRAESTRUCTURA
    insights: {
      title: "Infraestructura Crítica",
      description:
        "Redes, servidores y plataformas de alta disponibilidad diseñadas para mantenerse en pie cuando todo depende de ellas.",
      // DECORATIVO: serie neutra para la gráfica, no es un dato real
      // de Innova-Tech (la tarjeta calcula un % a partir de ella).
      values: [24, 28, 26, 33, 31, 38, 36, 42, 40, 47, 51, 56],
      // DECORATIVO: punto donde la gráfica pasa a "pronóstico".
      forecastFrom: 8,
    },
  },

  /* ----------------------------------------------------------------- about */
  about: {
    tag: "Cómo trabajamos", // literal del navbar del sitio (#manifiesto)
    // Literal del manifiesto (tarjeta 03).
    title: "Convertimos promesa en\n*operación.*",
    // Los tres puntos del manifiesto, literales y en su orden de aparición.
    body:
      "Exploramos antes que el mercado: Evaluamos tecnologías emergentes con rigor metodológico y científico, no con entusiasmo de marketing. Probamos bajo presión: Cada solución se valida en los entornos más exigentes: alta seguridad, misión crítica, cero margen de error. Convertimos promesa en operación: Lo que otros llaman proyecto de innovación, nosotros lo entregamos como servicio garantizado y documentado.",
    // SOLO cifras verificables (telemetría de portada y JSON-LD).
    // Sin "Toda la República Mexicana": no encaja como cifra en la rejilla.
    stats: [
      { value: "1998", label: "Operando desde" },
      { value: "15", label: "Sistemas en producción" },
    ],
  },

  /* ------------------------------------------------------------------- faq */
  faq: [
    // --- CITADAS literalmente (FAQPage JSON-LD de capacitaciones.html) ---
    // Pregunta y respuesta literales del sitio.
    {
      question: "¿Cómo funcionan las capacitaciones?",
      answer:
        "Elegimos el formato según su equipo: online en vivo, presencial o a medida. Cada programa arranca con un micro-workshop de 30 minutos sin costo para evaluar necesidades.",
    },
    {
      question: "¿Emiten constancia o certificado?",
      answer:
        "Sí. Cada participante recibe una constancia con la marca Innova-Tech, con validez interna para su organización.",
    },
    {
      question: "¿Capacitan a equipos del sector público?",
      answer:
        "Sí. Contamos con programas específicos para entidades públicas en LGCG, sistema de armonización contable y planeación gubernamental.",
    },

    // --- PROPUESTA: preguntas derivadas (no citadas como FAQ en el sitio) ---
    // PROPUESTA — respuesta: literal DOM-01 + intervención literal del CASO-03.
    {
      question: "¿Qué significa que la IA esté desplegada dentro de su perímetro?",
      answer:
        "IA desplegada dentro de su perímetro: sus datos no salen de sus servidores. Modelos, agentes y automatización con control total. Desplegamos Open WebUI en infraestructura propia, con modelos y datos bajo control del cliente.",
    },
    // PROPUESTA — respuesta: literales de telemetría de portada.
    {
      question: "¿Desde cuándo opera Innova-Tech y cuál es su cobertura?",
      answer: "Operando desde 1998. Cobertura en toda la República Mexicana.",
    },
    // PROPUESTA — recupera DOM-05, que no cabe en el bento de features.
    // Respuesta literal: descripción del dominio de vigilancia.
    {
      question: "¿Ofrecen videovigilancia IP y control de acceso?",
      answer:
        "Seguridad física inteligente: instalaciones, activos y personas protegidas por sistemas que también generan datos útiles.",
    },
    // PROPUESTA — enlace a un producto real (CASO-03).
    {
      question: "¿Puedo probar la IA privada en vivo?",
      answer:
        "Desplegamos Open WebUI en infraestructura propia, con modelos y datos bajo control del cliente. Operando en producción: la conversación no sale de la infraestructura. Probar la IA privada en vivo: https://chat.innova-tech.com.mx",
    },
  ],

  /* -------------------------------------------------------------------- cta */
  cta: {
    // Literal de la banda final de index.html (#contacto).
    title: "¿Listo para *cruzar la frontera?*",
    // Literal de la banda final de index.html (ya no hay formulario aquí;
    // el componente pone un único botón con href a contacto.html).
    description:
      "El primer paso es una conversación. Agende una consulta estratégica sin costo y permítanos entender su desafío.",
    // Literal del botón primario de esa banda.
    button: "Contacto",
  },

  /* ------------------------------------------------------------- demoSteps */
  // PROPUESTA — el sitio no publica fases numeradas; se derivan del
  // manifiesto real. Labels y detalles sí son literales.
  demoSteps: [
    {
      label: "Exploramos",
      detail:
        "Evaluamos tecnologías emergentes con rigor metodológico y científico, no con entusiasmo de marketing.",
    },
    {
      label: "Probamos",
      detail:
        "Cada solución se valida en los entornos más exigentes: alta seguridad, misión crítica, cero margen de error.",
    },
    {
      label: "Desplegamos",
      detail: "Construimos, desplegamos y damos mantenimiento.",
    },
    {
      label: "Convertimos",
      detail:
        "Lo que otros llaman proyecto de innovación, nosotros lo entregamos como servicio garantizado y documentado.",
    },
  ],

  /* ----------------------------------------------------------------- footer */
  // Literal del bloque de marca del footer real de index.html.
  footerTagline: "El dominio de las tecnologías emergentes. Operando desde 1998.",

  footerColumns: [
    {
      title: "Navegación", // literal (grupo "Navegación" del footer real)
      links: [
        // Secciones que existen en esta landing -> anclas internas.
        { label: "Cómo trabajamos", href: "#about" },
        { label: "Servicios", href: "#features" },
        // Secciones que sólo existen en el sitio principal -> URL absoluta.
        { label: "Casos reales", href: SITE + "/#expediciones" },
        { label: "Proyectos", href: SITE + "/#laboratorio" },
        { label: "Capacitaciones", href: SITE + "/capacitaciones.html" },
        { label: "Cursos Online", href: SITE + "/cursos.html" },
        { label: "Perspectiva", href: SITE + "/#senales" },
        { label: "Contacto", href: CONTACT_URL },
      ],
    },
    {
      // Títulos de caso literales; hrefs = subdominios/productos reales.
      title: "Proyectos",
      links: [
        { label: "Asistente IA — Open WebUI", href: "https://chat.innova-tech.com.mx" },
        { label: "Credencial Universitaria — ID UPM", href: "https://id.upm.edu.mx/social/" },
        { label: "Sistema contable — SCG UPM", href: "https://scg.upm.edu.mx" },
        { label: "FerrePOS", href: "https://ferrepos.innova-tech.com.mx" },
        { label: "Jarvis", href: "https://jarvis.innova-tech.com.mx" },
        { label: "Mundial 2026 — Predictor", href: "https://mundial2026.upm.edu.mx" },
      ],
    },
    {
      title: "Contacto", // literal (grupo "Contacto" del footer real)
      links: [
        { label: "Escríbanos por el formulario", href: CONTACT_URL },
        { label: "admin@innova-tech.com.mx", href: "mailto:admin@innova-tech.com.mx" },
        { label: "Agendar diagnóstico", href: CALENDLY_URL },
        // Ruta verificada en el sitio real (footer -> Aviso de privacidad).
        { label: "Aviso de privacidad", href: PRIVACY_URL },
      ],
    },
  ],

  /* --------------------------------------------------------------- apariencia */
  accent: "#22D3EE", // --cyan real del sitio
  defaultTheme: "dark",
  sculptureSeed: 4211,
  fonts: {
    sans: "'Space Grotesk', 'Inter', system-ui, sans-serif", // --font-display + --font-body reales
    serif: "'Newsreader', Georgia, serif",
    mono: "'JetBrains Mono', ui-monospace, monospace", // --font-mono real
  },
  maxWidth: "1180px",
}

/* ADVERTENCIAS
   DATOS QUE SE VERIFICARON FUERA DE /tmp/landing-content.md
   - FAQ citadas: el .md sólo traía las preguntas ("respuesta NO disponible").
     Las 3 respuestas son literales del JSON-LD FAQPage de capacitaciones.html
     (misma fuente de la que salieron las preguntas). No están inventadas.
   - cta.title/description/button: literales de la banda #contacto de
     index.html ("¿Listo para cruzar la frontera?" / "El primer paso es una
     conversación…" / botón "Contacto"), no en el .md pero sí en el sitio.
   - footerTagline: literal del bloque de marca del footer de index.html.
   - Aviso de privacidad: el .md no tenía href; la ruta real del sitio es
     privacy/innova-tech/index.html (existe en /root/innova-tech/site/).

   DATOS QUE SE DEJARON VACÍOS / FUERA POR NO ESTAR VERIFICADOS
   - Ninguna cifra más allá de 1998 y 15 (clientes, proyectos, porcentajes,
     SLA, precios): no existen en el contenido. about.stats queda con 2
     entradas; la cobertura ("toda la República Mexicana") no se usa como
     stat porque no es una cifra (va en FAQ y en el footer).
   - Bloque legal del footer real (Proveedor DAVID SALOMON DE LA O HIDALGO /
     Nombre comercial) sin representar: la plantilla sólo admite columnas
     de enlaces, no texto suelto. El email y el aviso de privacidad sí van.
   - hero.sculptureHint: se deja el literal de la plantilla (UI genérica,
     sin equivalente en el sitio).
   - Correo admin@innova-tech.com.mx verificado en el footer real.

   DECORATIVO (NO son datos reales)
   - features.insights.values / forecastFrom: serie numérica neutra para la
     gráfica; el % que muestra la tarjeta se calcula de ella.
   - Dentro de la plantilla (no es prop, no se cambia desde aquí): los
     rótulos del diagrama (Operaciones, Soporte, Infraestructura, Equipo —
     antes traían nombres ficticios y se neutralizaron a roles genéricos),
     "INFORME #n", "4 conectadas", "semilla n", las caras del hero y la
     frase del pie del diálogo de demostración.

   QUÉ ES PROPUESTA (derivado, no citado)
   - features.title "Sistemas que operan todos los días": composición sobre
     el subtítulo literal de portada.
   - demoSteps: fases numeradas derivadas del manifiesto (labels y detalles
     literales; el sitio no las publica numeradas).
   - FAQ marcadas "// PROPUESTA" (4): preguntas derivadas; sus respuestas
     son literales (DOM-01/05, telemetría, CASO-03).
   - nav: no existe "Inicio" (el logo ya lleva al home); todos los labels
     sí son literales del sitio.
   - hero.secondaryCta "Ver cómo trabajamos": literal del secundario de
     portada sin la flecha "↓" decorativa.

   CONTENIDO QUE NO CABE EN LA PLANTILLA
   - features admite 4 bloques y hay 5 dominios: DOM-05 "Videovigilancia IP
     y Acceso" queda fuera del bento y se conserva en el FAQ.
   - integrations.tools admite exactamente 4 nombres: Open WebUI,
     Arch-Credential, FerrePOS y Jarvis. Alternativos reales no usados:
     SCG (scg.upm.edu.mx), Predictor Mundial 2026, plataforma de cursos.
   - hero.titleAccent: 3 de los 5 dominios (rotación corta).

   DISCREPANCIAS RESUELTAS RESPECTO AL BORRADOR /tmp/landing-props.ts
   - El borrador traía `as const` global (arrays readonly -> TS2322): aquí
     se tipa el objeto como InkOrbitSaasTemplateProps y no hace falta.
   - Borrador: cta.placeholder y cta.success -> ya no existen en el tipo.
   - Borrador: navCta "Agendar diagnóstico" con handler pendiente -> aquí
     navCta = "Contacto" (literal del navbar, href ya correcto) y el
     Calendly vive en hero.primaryCta vía onStartTrial.
   - Borrador: third stat "Toda la República Mexicana" -> fuera (no es cifra).
   - Borrador: privacidad href "" -> resuelta con la ruta real.
   - Borrador marcaba hero.secondaryCta y cta.title como composiciones ->
     ahora cta.* es literal de la banda #contacto; secondaryCta sí es literal.
   - Sin handlers onGetStarted/onWatchDemo/onReforge: no aportan nada
     (el href por defecto ya es contacto.html y el diálogo ya se abre solo).
*/

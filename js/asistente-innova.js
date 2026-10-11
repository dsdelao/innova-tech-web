/**
 * Asistente Innova — bot calificador guiado (Fase 1).
 * Determinista: botones, sin LLM, sin backend. Cero alucinación.
 * Contrato del diseño "Fase 1" (2026-10-10). Namespace: .ain-
 *
 * Se auto-inyecta: basta con <script src="js/asistente-innova.js" defer></script>.
 */
(function () {
    'use strict';

    if (window.__ainLoaded) return;
    window.__ainLoaded = true;

    /* ============================================================
       CONFIGURACIÓN
       ============================================================ */
    var CONFIG = {
        name: 'Asistente Innova',
        // Idiomas donde se activa. Hoy solo español (el copy es es-MX).
        locales: ['es'],
        calendly: 'https://calendly.com/delao1212/llamada-de-diagnostico-estrategico',
        email: 'admin@innova-tech.com.mx',
        // Número de WhatsApp SOLO dígitos con lada país (ej. '5219341234567').
        // Mientras sea null, la derivación "crítica" usa correo como respaldo.
        whatsapp: null,
        // Sello de privacidad acotado y verificable.
        privacy: 'Tu conversación con el asistente no se envía a ninguna IA externa.',
        privacyPath: 'privacy/innova-tech/index.html',
        office: { days: [1, 2, 3, 4, 5], start: 9, end: 18, tz: 'America/Mexico_City' },
        utm: { utm_source: 'chatbot', utm_medium: 'widget', utm_campaign: 'asistente_innova' },
        greetingDelay: 8000
    };

    /* ============================================================
       Gate por idioma + base de rutas (derivada del <script>)
       ============================================================ */
    var htmlLang = (document.documentElement.getAttribute('lang') || 'es').slice(0, 2).toLowerCase();
    if (CONFIG.locales.indexOf(htmlLang) === -1) return;

    var base = '';
    try {
        var cs = document.currentScript;
        if (!cs) {
            var all = document.getElementsByTagName('script');
            cs = all[all.length - 1];
        }
        if (cs && cs.src) base = cs.src.replace(/js\/asistente-innova\.js.*$/, '');
    } catch (e) { base = ''; }

    function abs(p) { return base + p; }

    // Inyecta el CSS una sola vez.
    if (!document.getElementById('ain-style')) {
        var link = document.createElement('link');
        link.id = 'ain-style';
        link.rel = 'stylesheet';
        link.href = abs('css/asistente-innova.css');
        document.head.appendChild(link);
    }

    /* ============================================================
       Utilidades
       ============================================================ */
    function track(event, params) {
        var data = { campaign: CONFIG.utm.utm_campaign };
        if (params) { for (var k in params) { if (params.hasOwnProperty(k)) data[k] = params[k]; } }
        if (typeof window.gtag === 'function') { try { window.gtag('event', event, data); } catch (e) { /* noop */ } }
    }

    function timestamp() {
        try {
            return new Date().toLocaleString('es-MX', { timeZone: CONFIG.office.tz, hour12: false });
        } catch (e) { return new Date().toISOString(); }
    }

    function calendlyURL() {
        var q = Object.keys(CONFIG.utm).map(function (k) { return k + '=' + encodeURIComponent(CONFIG.utm[k]); }).join('&');
        return CONFIG.calendly + (CONFIG.calendly.indexOf('?') === -1 ? '?' : '&') + q;
    }

    function isOfficeHours() {
        try {
            var o = CONFIG.office;
            var parts = new Intl.DateTimeFormat('en-US', { timeZone: o.tz, weekday: 'short', hour: '2-digit', hour12: false }).formatToParts(new Date());
            var wd = '', hr = 0;
            parts.forEach(function (p) { if (p.type === 'weekday') wd = p.value; if (p.type === 'hour') hr = parseInt(p.value, 10); });
            var map = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
            hr = hr % 24;
            return o.days.indexOf(map[wd]) !== -1 && hr >= o.start && hr < o.end;
        } catch (e) { return true; }
    }

    /* ============================================================
       Estado y resumen de derivación (SIN datos personales)
       ============================================================ */
    var state = { route: '', area: '', urgency: '', build: '', stage: '', who: '', topic: '', message: '' };

    function summaryText() {
        var lines = ['🤖 Asistente del sitio — ' + timestamp()];
        lines.push('Ruta: ' + (state.route || '—'));
        var detail = [];
        if (state.area) detail.push('Área: ' + state.area);
        if (state.build) detail.push('Qué: ' + state.build);
        if (state.stage) detail.push('Etapa: ' + state.stage);
        if (state.who) detail.push('Dirigido a: ' + state.who);
        if (state.topic) detail.push('Tema: ' + state.topic);
        if (detail.length) lines.push('Detalle: ' + detail.join(' · '));
        if (state.urgency) lines.push('Urgencia: ' + state.urgency);
        if (state.message) lines.push('Mensaje: ' + state.message.slice(0, 300));
        return lines.join('\n');
    }

    /* ============================================================
       Árbol determinista
       ============================================================ */
    var AREAS = [
        { label: '💻 Sistemas / software', value: 'Sistemas / software' },
        { label: '🌐 Red o infraestructura', value: 'Red o infraestructura' },
        { label: '🔒 Seguridad', value: 'Seguridad' },
        { label: '📹 Videovigilancia', value: 'Videovigilancia' },
        { label: '❓ Otro', value: 'Otro' }
    ];

    var NODES = {
        start: {
            say: ['Hola 👋 Soy el asistente de Innova-Tech.', '¿En qué te ayudo hoy?'],
            choices: [
                { label: '🔧 Algo me está fallando', next: 'r1_area', route: 'Algo me está fallando' },
                { label: '🚀 Quiero construir algo', next: 'r2_what', route: 'Quiero construir algo' },
                { label: '🎓 Capacitación', next: 'r3_who', route: 'Capacitación' },
                { label: '👀 Solo exploro', next: 'r4_pitch', route: 'Solo exploro' }
            ]
        },

        /* Ruta 1 — Algo me está fallando */
        r1_area: {
            say: ['Vamos a ubicarlo rápido. ¿En qué área está el problema?'],
            choices: AREAS.map(function (a) { return { label: a.label, value: a.value, set: { area: a.value }, step: 'area', next: 'r1_urgency' }; })
        },
        r1_urgency: {
            say: ['¿Qué tan urgente es?'],
            choices: [
                { label: '🔴 Crítico — la operación está afectada', value: 'Crítico', set: { urgency: 'Crítico' }, step: 'urgencia', next: 'r1_critical' },
                { label: '🟡 Pronto — esta semana', value: 'Pronto', set: { urgency: 'Pronto (esta semana)' }, step: 'urgencia', next: 'r1_consult' },
                { label: '🟢 Lo estoy evaluando', value: 'Evaluando', set: { urgency: 'Lo estoy evaluando' }, step: 'urgencia', next: 'r1_consult' }
            ]
        },
        r1_critical: {
            say: ['Esto suena urgente. Te conecto directo con el equipo:'],
            handoff: { channels: ['whatsapp', 'email'], label: 'contacto' }
        },
        r1_consult: {
            say: ['Te recomiendo el diagnóstico gratis: 30 minutos, sin costo y sin letras chiquitas.'],
            handoff: { channels: ['calendly'], label: 'diagnóstico' }
        },

        /* Ruta 2 — Quiero construir algo */
        r2_what: {
            say: ['Buena decisión. ¿Qué quieres construir?'],
            choices: [
                { label: '🤖 IA privada', value: 'IA privada', set: { build: 'IA privada' }, step: 'qué', next: 'r2_stage' },
                { label: '⚙️ Automatización', value: 'Automatización', set: { build: 'Automatización' }, step: 'qué', next: 'r2_stage' },
                { label: '🧩 Software a medida', value: 'Software a medida', set: { build: 'Software a medida' }, step: 'qué', next: 'r2_stage' },
                { label: '🏗️ Infraestructura', value: 'Infraestructura', set: { build: 'Infraestructura' }, step: 'qué', next: 'r2_stage' }
            ]
        },
        r2_stage: {
            say: ['¿En qué etapa estás?'],
            choices: [
                { label: '💡 Solo tengo la idea', value: 'Solo la idea', set: { stage: 'Solo la idea' }, step: 'etapa', next: 'r2_handoff' },
                { label: '📋 Tengo requisitos claros', value: 'Requisitos claros', set: { stage: 'Requisitos claros' }, step: 'etapa', next: 'r2_handoff' },
                { label: '🔄 Ya tengo algo y quiero mejorarlo', value: 'Ya tengo algo', set: { stage: 'Ya tengo algo y quiero mejorarlo' }, step: 'etapa', next: 'r2_handoff' }
            ]
        },
        r2_handoff: {
            say: ['El primer paso es una conversación: agenda tu diagnóstico gratis y llegamos con tu resumen ya leído.'],
            handoff: { channels: ['calendly'], label: 'diagnóstico' }
        },

        /* Ruta 3 — Capacitación */
        r3_who: {
            say: ['¿La capacitación es para tu empresa o para ti?'],
            choices: [
                { label: '🏢 Mi empresa', value: 'Mi empresa', set: { who: 'Mi empresa' }, step: 'para quién', next: 'r3_topic' },
                { label: '🧑 Para mí', value: 'Para mí', set: { who: 'Para mí' }, step: 'para quién', next: 'r3_topic' }
            ]
        },
        r3_topic: {
            say: ['¿Qué tema te interesa?'],
            choices: [
                { label: '🤖 IA', value: 'IA', set: { topic: 'IA' }, step: 'tema', next: 'r3_handoff' },
                { label: '🔒 Ciberseguridad', value: 'Ciberseguridad', set: { topic: 'Ciberseguridad' }, step: 'tema', next: 'r3_handoff' },
                { label: '💻 Otro tema', value: 'Otro tema', set: { topic: 'Otro tema' }, step: 'tema', next: 'r3_handoff' }
            ]
        },
        r3_handoff: {
            say: ['Te dejo el catálogo y, si quieres un programa a medida, agenda una llamada:'],
            handoff: { channels: ['linkTrainings', 'calendly'], label: 'capacitación' }
        },

        /* Ruta 4 — Solo exploro */
        r4_pitch: {
            say: ['Construimos y operamos los sistemas que tu organización no puede dejar de usar: IA privada, ciberseguridad, infraestructura y automatización. No entregamos y desaparecemos.'],
            handoff: { channels: ['calendly', 'linkServices', 'human'], label: 'exploro' }
        },

        /* Handoff genérico (hablar con humano) */
        human: {
            say: ['Claro. Te conecto con el equipo para no darte una respuesta a medias.'],
            handoff: { channels: ['whatsapp', 'email'], label: 'humano' }
        }
    };

    /* ============================================================
       DOM
       ============================================================ */
    var root = document.createElement('div');
    root.className = 'ain-root';
    root.innerHTML = [
        '<button type="button" class="ain-launcher" aria-expanded="false" aria-controls="ain-panel">',
        '  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm-3 11H7v-2h10v2Zm0-3H7V8h10v2Zm0-3H7V5h10v2Z"/></svg>',
        '  <span class="ain-launcher__label">Asistente</span>',
        '  <span class="ain-launcher__dot" aria-hidden="true"></span>',
        '</button>',
        '<div class="ain-teaser" role="button" tabindex="0">¿Necesitas ayuda? Soy el asistente de Innova-Tech.</div>',
        '<section class="ain-panel" id="ain-panel" role="dialog" aria-modal="true" aria-labelledby="ain-title" hidden>',
        '  <header class="ain-header">',
        '    <span class="ain-avatar" aria-hidden="true">IN</span>',
        '    <div class="ain-headtext"><h2 class="ain-title" id="ain-title">' + CONFIG.name + '</h2><p class="ain-sub">En línea</p></div>',
        '    <button type="button" class="ain-close" aria-label="Cerrar asistente">&times;</button>',
        '  </header>',
        '  <div class="ain-privacy"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8Z"/></svg><span>' + CONFIG.privacy + '</span></div>',
        '  <div class="ain-log" role="log" aria-live="polite" aria-relevant="additions"></div>',
        '  <form class="ain-form"><input class="ain-input" type="text" maxlength="600" placeholder="Escribe tu pregunta…" aria-label="Tu pregunta" autocomplete="off"><button type="submit" class="ain-send">Enviar</button></form>',
        '  <div class="ain-foot">Las respuestas son informativas y no constituyen una cotización. <a href="' + abs(CONFIG.privacyPath) + '">Aviso de privacidad</a> · <button type="button" class="ain-human" style="background:none;border:0;padding:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit">Hablar con un humano</button></div>',
        '</section>'
    ].join('');
    document.body.appendChild(root);

    var launcher = root.querySelector('.ain-launcher');
    var teaser = root.querySelector('.ain-teaser');
    var panel = root.querySelector('.ain-panel');
    var log = root.querySelector('.ain-log');
    var form = root.querySelector('.ain-form');
    var input = root.querySelector('.ain-input');
    var closeBtn = root.querySelector('.ain-close');
    var humanBtn = root.querySelector('.ain-human');
    var started = false;
    var lastFocus = null;

    /* ============================================================
       Render
       ============================================================ */
    function addMsg(text, kind) {
        var el = document.createElement('div');
        el.className = 'ain-msg ain-msg--' + kind;
        el.textContent = text;
        log.appendChild(el);
        log.scrollTop = log.scrollHeight;
        return el;
    }

    function addChoices(choices) {
        var wrap = document.createElement('div');
        wrap.className = 'ain-choices';
        choices.forEach(function (c) {
            if (c.label === '—separador—') {
                var hr = document.createElement('div');
                hr.className = 'ain-choice ain-choice--ghost';
                hr.textContent = c.value;
                return;
            }
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ain-choice' + (c.ghost ? ' ain-choice--ghost' : '');
            btn.textContent = c.label;
            btn.addEventListener('click', function () {
                wrap.remove();
                addMsg(c.label.replace(/^[^\wÁÉÍÓÚÑ]+/, ''), 'user');
                if (c.set) { for (var k in c.set) { if (c.set.hasOwnProperty(k)) state[k] = c.set[k]; } }
                if (c.route) state.route = c.route;
                track('chatbot_step', { route: state.route, step: c.step || c.route || '', answer: c.value || c.label });
                if (c.then) c.then();
                else render(c.next);
            });
            wrap.appendChild(btn);
        });
        log.appendChild(wrap);
        log.scrollTop = log.scrollHeight;
        return wrap;
    }

    function channelButton(ch) {
        if (ch === 'calendly') {
            var a = document.createElement('a');
            a.className = 'ain-cta ain-cta--accent';
            a.href = calendlyURL();
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 18H5V9h14v12Z"/></svg>Agendar diagnóstico gratis';
            a.addEventListener('click', function () { track('chatbot_handoff', { route: state.route, channel: 'calendly' }); });
            return a;
        }
        if (ch === 'whatsapp' && CONFIG.whatsapp) {
            var w = document.createElement('a');
            w.className = 'ain-cta';
            w.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(summaryText());
            w.target = '_blank';
            w.rel = 'noopener noreferrer';
            w.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2a.4.4 0 0 0 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.8 11.8 0 0 0 4.5 4c1.6.6 1.6.4 1.9.4a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z"/></svg>WhatsApp';
            w.addEventListener('click', function () { track('chatbot_handoff', { route: state.route, channel: 'whatsapp' }); });
            return w;
        }
        if (ch === 'email') {
            var subj = 'Contacto desde el asistente del sitio — ' + (state.route || 'Innova-Tech');
            var m = document.createElement('a');
            m.className = 'ain-cta ain-cta--ghost';
            m.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(summaryText() + '\n\n');
            m.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>' + CONFIG.email;
            m.addEventListener('click', function () { track('chatbot_handoff', { route: state.route, channel: 'email' }); });
            return m;
        }
        if (ch === 'linkTrainings') {
            var lt = document.createElement('a');
            var companyPath = state.who === 'Mi empresa' ? 'capacitaciones.html' : 'cursos.html';
            lt.className = 'ain-cta ain-cta--ghost';
            lt.href = abs(companyPath);
            lt.textContent = state.who === 'Mi empresa' ? 'Ver capacitaciones' : 'Ver cursos online';
            lt.addEventListener('click', function () { track('chatbot_handoff', { route: state.route, channel: 'catalogo' }); });
            return lt;
        }
        if (ch === 'linkServices') {
            var ls = document.createElement('a');
            ls.className = 'ain-cta ain-cta--ghost';
            ls.href = abs('index.html#features');
            ls.textContent = 'Ver servicios';
            ls.addEventListener('click', function () { track('chatbot_handoff', { route: state.route, channel: 'servicios' }); });
            return ls;
        }
        if (ch === 'human') {
            var h = document.createElement('button');
            h.type = 'button';
            h.className = 'ain-cta ain-cta--ghost';
            h.textContent = '👤 Hablar con un humano';
            h.addEventListener('click', function () { render('human'); });
            return h;
        }
        return null;
    }

    function render(nodeId) {
        var node = NODES[nodeId];
        if (!node) return;

        (node.say || []).forEach(function (line) { addMsg(line, 'bot'); });

        if (node.choices) addChoices(node.choices);

        if (node.handoff) {
            var wrap = document.createElement('div');
            wrap.className = 'ain-handoff';

            var summary = document.createElement('div');
            summary.className = 'ain-summary';
            summary.textContent = summaryText();
            log.appendChild(summary);

            node.handoff.channels.forEach(function (ch) {
                var b = channelButton(ch);
                if (b) wrap.appendChild(b);
            });

            if (node.handoff.channels.indexOf('human') !== -1 && !isOfficeHours()) {
                addMsg('Te leemos en horario de oficina (lun–vie, 9:00–18:00, hora de México) y te respondemos en cuanto abramos.', 'note');
            }

            log.appendChild(wrap);
            log.scrollTop = log.scrollHeight;
            track('chatbot_handoff', { route: state.route, channel: (node.handoff.channels || []).join('+'), view: node.handoff.label });
        }
    }

    /* Texto libre → siempre deriva a humano (nunca improvisa) */
    function handleFreeText(text) {
        var clean = String(text || '').trim();
        if (!clean) return;
        state.message = clean;
        addMsg(clean, 'user');
        input.value = '';

        var pending = document.createElement('div');
        pending.className = 'ain-msg ain-msg--bot';
        pending.innerHTML = '<span class="ain-typing"><span></span><span></span><span></span></span>';
        log.appendChild(pending);
        log.scrollTop = log.scrollHeight;

        window.setTimeout(function () {
            pending.remove();
            state.route = state.route || 'Texto libre';
            track('chatbot_freetext', { route: state.route });
            render('human');
        }, 600);
    }

    /* ============================================================
       Abrir / cerrar
       ============================================================ */
    function open() {
        lastFocus = document.activeElement;
        panel.hidden = false;
        // fuerza reflow para la transición
        void panel.offsetWidth;
        panel.classList.add('is-open');
        launcher.setAttribute('aria-expanded', 'true');
        teaser.classList.remove('is-on');
        if (!started) { started = true; render('start'); track('chatbot_open', {}); }
        window.setTimeout(function () { input.focus(); }, 0);
    }

    function close() {
        panel.classList.remove('is-open');
        launcher.setAttribute('aria-expanded', 'false');
        window.setTimeout(function () { panel.hidden = true; }, 200);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    launcher.addEventListener('click', function () { panel.hidden ? open() : close(); });
    closeBtn.addEventListener('click', close);
    teaser.addEventListener('click', open);
    teaser.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    humanBtn.addEventListener('click', function () { if (!started) { started = true; render('start'); } render('human'); });

    form.addEventListener('submit', function (e) { e.preventDefault(); handleFreeText(input.value); });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !panel.hidden) close();
    });

    if (CONFIG.greetingDelay >= 0) {
        window.setTimeout(function () { if (panel.hidden) teaser.classList.add('is-on'); }, CONFIG.greetingDelay);
    }
})();

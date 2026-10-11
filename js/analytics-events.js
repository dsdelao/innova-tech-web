/**
 * Medicion de conversion de Innova-Tech (GA4 G-GWN8LD8PZK).
 *
 * Mide los CTA que antes no dejaban rastro: clics a Calendly, WhatsApp,
 * correo y telefono, esten donde esten de la pagina. Es delegado (un solo
 * listener en document, en fase de captura) para que cubra tambien los
 * elementos que inyectan otros scripts.
 *
 * Los handoffs del widget flotante (Asistente Innova) ya se miden aparte
 * como `chatbot_handoff`; por eso se ignoran los clics dentro de `.ain-root`
 * y no se cuentan dos veces.
 *
 * Los eventos del propio widget viven en js/asistente-innova.js; el exito de
 * los formularios (`generate_lead`) se emite en js/form-endpoint.js.
 */
(function () {
    'use strict';

    function track(name, params) {
        if (typeof window.gtag === 'function') {
            try { window.gtag('event', name, params || {}); } catch (e) { /* noop */ }
        }
    }

    /* Clasifica un href por el destino que representa. */
    function tipoDeEnlace(href) {
        if (!href) return null;
        var h = href.toLowerCase();
        if (h.indexOf('calendly.com') !== -1) return 'calendly';
        if (h.indexOf('wa.me') !== -1 ||
            h.indexOf('api.whatsapp.com') !== -1 ||
            h.indexOf('//whatsapp') !== -1) return 'whatsapp';
        if (h.indexOf('mailto:') === 0) return 'email';
        if (h.indexOf('tel:') === 0) return 'phone';
        return null;
    }

    function texto(el) {
        return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    }

    var EVENTO = {
        calendly: 'calendly_click',
        whatsapp: 'whatsapp_click',
        email: 'email_click',
        phone: 'phone_click'
    };

    document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;

        /* El widget mide su propio handoff: no duplicar. */
        if (a.closest('.ain-root')) return;

        var tipo = tipoDeEnlace(a.getAttribute('href'));
        if (!tipo) return;

        track(EVENTO[tipo], {
            link_url: a.href,
            link_text: texto(a),
            page_location: window.location.pathname
        });
    }, true);

    /* Reusable por otros scripts (p. ej. form-endpoint.js) si lo necesitan. */
    window.innovaTrack = track;
})();

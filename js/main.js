/**
 * Conocimiento Frontera — JavaScript principal
 * Constelación animada (canvas), reveal on scroll, menú móvil y año.
 */
document.addEventListener('DOMContentLoaded', function () {
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    var header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function () {
            header.classList.toggle('scrolled', window.scrollY > 24);
        }, { passive: true });
    }

    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('nav-menu');
    if (toggle && menu) {
        var labelOpen = toggle.getAttribute('data-label-open');
        var labelClose = toggle.getAttribute('data-label-close');

        function setMenu(open) {
            menu.classList.toggle('active', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            // el nombre accesible tiene que cambiar con el estado, no solo aria-expanded
            if (labelOpen && labelClose) {
                toggle.setAttribute('aria-label', open ? labelClose : labelOpen);
            }
        }

        toggle.addEventListener('click', function () {
            setMenu(!menu.classList.contains('active'));
        });
        menu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                setMenu(false);
            });
        });
    }

    initReveal();
    initScrollProgress();

    var params = new URLSearchParams(window.location.search);
    var interes = params.get('interes');
    if (interes) {
        var interesSelect = document.getElementById('interes');
        var prefillMap = {
            'LAB-01': 'Inteligencia Artificial Privada',
            'LAB-14': 'Inteligencia Artificial Privada',
            'LAB-15': 'Inteligencia Artificial Privada',
            'LAB-02': 'Software y Automatización',
            'LAB-03': 'Software y Automatización',
            'LAB-04': 'Software y Automatización',
            'LAB-05': 'Software y Automatización',
            'LAB-06': 'Software y Automatización',
            'LAB-07': 'Software y Automatización',
            'LAB-08': 'Software y Automatización',
            'LAB-09': 'Software y Automatización',
            'LAB-10': 'Software y Automatización',
            'LAB-11': 'Software y Automatización',
            'LAB-12': 'Software y Automatización',
            'LAB-13': 'Software y Automatización'
        };
        if (interesSelect && prefillMap[interes]) {
            interesSelect.value = prefillMap[interes];
        }
        var mensaje = document.getElementById('mensaje');
        if (mensaje) {
            if (interes.indexOf('Capacitación:') === 0) {
                mensaje.value = 'Me interesa la capacitación: ' + interes.replace('Capacitación: ', '') + '.';
            } else {
                mensaje.value = 'Me interesa una demostración de ' + interes + '.';
            }
        }
        var contactForm = document.getElementById('contact-form');
        if (contactForm) contactForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    drawConstellation();
});

function drawConstellation() {
    var canvas = document.getElementById('constellation');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var dots = [];
    var mouse = { x: -9999, y: -9999 };
    var COLORS = ['#22D3EE', '#8B5CF6', '#EC4899'];
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        var count = Math.min(90, Math.floor(canvas.width * canvas.height / 16000));
        dots = [];
        for (var i = 0; i < count; i++) {
            dots.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: Math.random() * 1.8 + 0.6,
                c: COLORS[Math.floor(Math.random() * COLORS.length)]
            });
        }
    }

    function step() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < dots.length; i++) {
            var d = dots[i];
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
            if (d.y < 0 || d.y > canvas.height) d.vy *= -1;

            ctx.globalAlpha = 0.9;
            ctx.fillStyle = d.c;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
        }

        var LINK = 120;
        ctx.globalAlpha = 1;
        for (var i = 0; i < dots.length; i++) {
            var a = dots[i];
            for (var j = i + 1; j < dots.length; j++) {
                var b = dots[j];
                var dx = a.x - b.x;
                var dy = a.y - b.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < LINK) {
                    ctx.strokeStyle = 'rgba(139, 168, 224, ' + (0.28 * (1 - dist / LINK)) + ')';
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
            var dMouse = Math.sqrt((a.x - mouse.x) * (a.x - mouse.x) + (a.y - mouse.y) * (a.y - mouse.y));
            if (dMouse < LINK) {
                ctx.strokeStyle = 'rgba(34, 211, 238, ' + (0.5 * (1 - dMouse / LINK)) + ')';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }

        if (!reduced) requestAnimationFrame(step);
    }

    window.addEventListener('resize', function () {
        resize();
        if (reduced) step();
    });
    canvas.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', function () { mouse.x = -9999; mouse.y = -9999; });

    resize();
    step();
}

function initReveal() {
    var reveals = document.querySelectorAll('[data-reveal]');
    if (!reveals.length) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!window.Motion || reduced) {
        Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-visible'); });
        return;
    }

    var animate = window.Motion.animate;
    var inView = window.Motion.inView;
    var EASE = [0.16, 1, 0.3, 1];

    function show(el, delay) {
        animate(el, { opacity: [0, 1], y: [26, 0] }, {
            duration: 0.6,
            delay: delay,
            ease: EASE,
            onComplete: function () { el.classList.add('is-visible'); }
        });
    }

    // Se agrupa por padre directo (no por selector): hay varios .container en la
    // pagina y mezclarlos en un solo grupo romperia el escalonado.
    var groups = [];
    Array.prototype.forEach.call(reveals, function (el) {
        var parent = el.parentElement;
        if (!parent) { show(el, 0); return; }
        var g = null;
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].parent === parent) { g = groups[i]; break; }
        }
        if (!g) { g = { parent: parent, els: [] }; groups.push(g); }
        g.els.push(el);
    });

    groups.forEach(function (g) {
        // Un bloque mas alto que la pantalla escalonaria casos que aun no se ven,
        // que quedarian ya revelados al llegar: ahi cada hijo entra por su cuenta.
        var stacked = g.parent.getBoundingClientRect().height > window.innerHeight * 1.15;

        if (stacked || g.els.length === 1) {
            g.els.forEach(function (el) {
                inView(el, function () { show(el, 0); }, { amount: 0.15 });
            });
        } else {
            inView(g.parent, function () {
                g.els.forEach(function (el, i) { show(el, i * 0.075); });
            }, { amount: 0.15 });
        }
    });
}

function initScrollProgress() {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!window.Motion || reduced || !document.body) return;

    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    window.Motion.scroll(window.Motion.animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
}

// Language selector dropdown
//
// Los href de cada item ya vienen correctos en el HTML (misma pagina, otro
// idioma), asi que este script no calcula rutas: sin JS el selector sigue
// funcionando. Aqui solo se controla la apertura.
(function () {
    var toggle = document.getElementById('lang-toggle');
    var menu = document.getElementById('lang-menu');
    if (!toggle || !menu) return;

    function isOpen() {
        return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open) {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function close(refocus) {
        if (!isOpen()) return;
        setOpen(false);
        if (refocus) toggle.focus();
    }

    toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!isOpen());
    });

    // click fuera: cierra sin mover el foco
    document.addEventListener('click', function (e) {
        if (menu.contains(e.target) || toggle.contains(e.target)) return;
        close(false);
    });

    // Escape cierra y devuelve el foco al boton: sin esto el teclado pierde
    // el contexto y tabula desde el inicio del documento
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') close(true);
    });

    // al navegar con el teclado dentro del menu, Esc tambien lo cierra
    menu.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            e.stopPropagation();
            close(true);
        }
    });

    // cambiar de idioma cierra el panel movil si esta abierto
    menu.addEventListener('click', function (e) {
        var link = e.target.closest ? e.target.closest('.lang-item') : null;
        if (!link) return;
        close(false);
        var nav = document.getElementById('nav-toggle');
        var panel = document.getElementById('nav-menu');
        if (nav && panel && panel.classList.contains('active')) {
            nav.setAttribute('aria-expanded', 'false');
            panel.classList.remove('active');
        }
    });
})();


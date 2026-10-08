/**
 * Envio real de los formularios de Innova-Tech.
 *
 * Antes esto no existia y ningun formulario hacia nada:
 *   - #contact-form  tenia action="#" sin handler: el POST se iba a la misma
 *     pagina y el dato se descartaba en silencio.
 *   - #cap-form     multiplicaba por CAP_LIST_UUID vacio y mostraba
 *     "Registro recibido. Le contactaremos" sin haber guardado nada.
 *
 * Ahora ambos formularios hacen POST a form.php, que es lo unico que entrega
 * el correo. Sin terceros: por eso el aviso de privacidad puede afirmar, en los
 * cuatro idiomas, que no se transfieren datos sin consentimiento.
 *
 * El endpoint se lee de <body data-form-endpoint> porque el mismo archivo lo
 * usan las paginas de raiz (form.php) y las de en/ ru/ zh/ (../form.php).
 */
(function () {
    'use strict';

    var MIN_SEGUNDOS = 3;

    function endpoint() {
        return document.body.getAttribute('data-form-endpoint') || 'form.php';
    }

    function estado(el, clase, texto) {
        if (!el) return;
        el.className = 'form-status ' + clase;
        el.textContent = texto;
    }

    function statusId(formId) {
        return formId === 'cap-form' ? 'cap-form-status' : 'contact-status';
    }

    /* Un humano tarda mas de 3 s en llenar el formulario. Un bot, no. */
    function marcar(form) {
        var t = form.querySelector('input[name="t"]');
        if (t && !t.value) t.value = String(Math.floor(Date.now() / 1000));
    }

    function rearmar(form, btn) {
        if (!btn) return;
        btn.disabled = false;
        if (btn.dataset.txt) btn.textContent = btn.dataset.txt;
        var t = form.querySelector('input[name="t"]');
        if (t) t.value = String(Math.floor(Date.now() / 1000));
    }

    function campo(form, name) {
        var el = form.querySelector('[name="' + name + '"]');
        return el ? el.value.trim() : '';
    }

    function enviar(form, origen, alOk) {
        var st = document.getElementById(statusId(form.id));
        var btn = form.querySelector('button[type="submit"]');
        var cuerpo = new URLSearchParams();

        cuerpo.set('form', origen);
        cuerpo.set('t', campo(form, 't') || '0');
        cuerpo.set('website', campo(form, 'website'));

        Array.prototype.forEach.call(
            form.querySelectorAll('input[name], select[name], textarea[name]'),
            function (el) {
                if (el.name === 't' || el.name === 'website') return;
                if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
                cuerpo.set(el.name, el.value.trim());
            }
        );

        if (btn) {
            btn.disabled = true;
            btn.dataset.txt = btn.textContent;
            btn.textContent = 'Enviando…';
        }
        estado(st, '', '');

        fetch(endpoint(), {
            method: 'POST',
            body: cuerpo,
            headers: { 'Accept': 'application/json' }
        })
            .then(function (r) {
                return r.json().catch(function () {
                    return { ok: false, msg: 'El servidor no devolvio una respuesta valida.' };
                });
            })
            .then(function (j) {
                if (j && j.ok) {
                    estado(st, 'ok', j.msg);
                    form.reset();
                    if (alOk) alOk();
                } else {
                    estado(st, 'err', (j && j.msg) || 'No pudimos enviar el mensaje.');
                }
            })
            .catch(function () {
                estado(st, 'err', 'No pudimos enviar el mensaje. Revise su conexion e intente de nuevo.');
            })
            .then(function () { rearmar(form, btn); });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var cf = document.getElementById('contact-form');
        if (cf) {
            marcar(cf);
            cf.addEventListener('submit', function (e) {
                e.preventDefault();
                if (!campo(cf, 'nombre') || !campo(cf, 'email')) return;
                enviar(cf, 'contacto');
            });
        }

        var cap = document.getElementById('cap-form');
        if (cap) {
            marcar(cap);
            cap.addEventListener('submit', function (e) {
                e.preventDefault();
                if (!campo(cap, 'nombre') || !campo(cap, 'email')) return;
                enviar(cap, 'capacitaciones', function () {
                    setTimeout(function () {
                        window.open('https://calendly.com/delao1212/llamada-de-diagnostico-estrategico', '_blank');
                    }, 900);
                });
            });
        }

        /* El honeypot se oculta sin display:none, que algunos bots saltan. */
        var hp = document.querySelectorAll('.hp');
        Array.prototype.forEach.call(hp, function (el) {
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            el.style.opacity = '0';
            el.setAttribute('aria-hidden', 'true');
            el.setAttribute('tabindex', '-1');
            el.setAttribute('autocomplete', 'off');
        });
    });
})();

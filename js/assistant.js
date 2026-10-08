/**
 * Asistente de Diagnóstico Innova-Tech
 * Chat de decisión en JS vanilla (sin CDN ni backend).
 * Mismo árbol de decisión que la API original /api/diagnostico.php.
 */
(function () {
    var CALENDLY_URL = 'https://calendly.com/delao1212/llamada-de-diagnostico-estrategico';

    var RESPUESTAS = {
        contratista: {
            sla: 'Entendido. Nuestra especialidad es actuar como su brazo ejecutor local para cumplir con los SLAs más exigentes. Hemos realizado despliegues y mantenimientos en infraestructuras críticas. Le garantizamos el cumplimiento y le proveemos los reportes que necesita para su cliente final. Agende una llamada estratégica para analizar los alcances de su contrato.',
            continuidad: 'Comprendido. Ofrecemos servicio de "manos remotas" y soporte en sitio representando su marca con total profesionalismo. Damos servicio a cadenas nacionales en toda la región, garantizando la continuidad operativa que usted le prometió a su cliente. Agende una llamada para conocer nuestros esquemas de partnership.'
        },
        local: {
            cumplimiento: 'Comprendido. Ayudamos a las empresas de la región a cumplir con las normativas más estrictas. Nuestra experiencia incluye desde la validación de redes de telecomunicaciones hasta el mantenimiento de sistemas de CCTV en puntos de alta seguridad. Agende una llamada y asegure su cumplimiento.',
            modernizacion: 'Excelente. Apoyamos la modernización de empresas locales asegurando la infraestructura tecnológica para su crecimiento. Hemos realizado instalaciones críticas donde la conectividad es clave. Agende una llamada para discutir cómo podemos habilitar su expansión.',
            falla_critica: 'Entendido. La continuidad operativa es nuestro fuerte. Resolvemos fallas críticas y damos mantenimiento preventivo para evitar futuras interrupciones. Damos soporte a las principales cadenas y negocios de la región. Agende una llamada para estabilizar su operación.'
        },
        empresa: {
            ia: 'Excelente. Desplegamos IA privada dentro de su perímetro: sus datos no salen de sus servidores. Puede probarla en vivo ahora mismo en https://chat.innova-tech.com.mx y después agendamos su caso de uso concreto.',
            capacitacion: 'Perfecto. Nuestras capacitaciones operan en la frontera: IA privada y automatización, infraestructura y redes, y cumplimiento para el sector público (LGCG, armonización contable y planeación gubernamental). Revise el catálogo en https://innova-tech.com.mx/capacitaciones.html y agende una evaluación de necesidades sin costo.',
            infra: 'Entendido. Diseñamos y operamos infraestructura crítica de alta disponibilidad: redes, servidores y plataformas que se mantienen en pie cuando todo depende de ellas. Agende una llamada para analizar su entorno.'
        }
    };

    var NEEDS = {
        contratista: [
            { text: 'Cumplir con un SLA exigente', value: 'sla' },
            { text: 'Soporte en sitio ("manos remotas")', value: 'continuidad' }
        ],
        local: [
            { text: 'Cumplir con normativas de seguridad', value: 'cumplimiento' },
            { text: 'Modernizar mi infraestructura', value: 'modernizacion' },
            { text: 'Resolver una falla crítica', value: 'falla_critica' }
        ],
        empresa: [
            { text: 'Adoptar IA privada / agentes', value: 'ia' },
            { text: 'Capacitar a mi equipo', value: 'capacitacion' },
            { text: 'Modernizar infraestructura', value: 'infra' }
        ]
    };

    document.addEventListener('DOMContentLoaded', function () {
        var chat = document.getElementById('assistant-chat');
        if (!chat) return;

        var bot = 'bot';
        var human = 'human';
        var typing = false;

        function addBubble(role, text, delay) {
            return new Promise(function (resolve) {
                setTimeout(function () {
                    var b = document.createElement('div');
                    b.className = 'assistant-bubble assistant-bubble--' + role;
                    b.textContent = text;
                    chat.appendChild(b);
                    chat.scrollTop = chat.scrollHeight;
                    resolve();
                }, delay || 0);
            });
        }

        function showTyping() {
            typing = true;
            var t = document.createElement('div');
            t.className = 'assistant-bubble assistant-bubble--bot assistant-bubble--typing';
            t.innerHTML = '<span></span><span></span><span></span>';
            t.id = 'assistant-typing';
            chat.appendChild(t);
            chat.scrollTop = chat.scrollHeight;
            return t;
        }

        function hideTyping() {
            var t = document.getElementById('assistant-typing');
            if (t) t.remove();
            typing = false;
        }

        function addActions(options, onPick) {
            var wrap = document.createElement('div');
            wrap.className = 'assistant-actions';
            options.forEach(function (opt) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn assistant-actions__btn';
                btn.textContent = opt.text;
                btn.addEventListener('click', function () {
                    wrap.innerHTML = '';
                    onPick(opt);
                });
                wrap.appendChild(btn);
            });
            chat.appendChild(wrap);
            chat.scrollTop = chat.scrollHeight;
        }

        function endWithCalendly() {
            addActions([{ text: 'Agendar Diagnóstico Estratégico', value: 'agendar' }], function () {
                window.open(CALENDLY_URL, '_blank');
            });
        }

        function askSecond(role) {
            addBubble(bot, 'Entendido. Ahora, ¿cuál es su necesidad principal?', 300).then(function () {
                addActions(NEEDS[role], function (opt) {
                    addBubble(human, opt.text, 0).then(function () {
                        var t = showTyping();
                        setTimeout(function () {
                            hideTyping();
                            addBubble(bot, RESPUESTAS[role][opt.value], 200).then(function () {
                                endWithCalendly();
                            });
                        }, 900);
                    });
                });
            });
        }

        function start() {
            addBubble(bot, '¡Bienvenido! Soy el Asistente de Diagnóstico de INNOVA-TECH.', 300)
                .then(function () {
                    return addBubble(bot, 'Para darle una recomendación precisa, por favor, cuéntenos sobre su rol.', 500);
                })
                .then(function () {
                    addActions([
                        { text: 'Soy Contratista / Empresa Nacional', value: 'contratista' },
                        { text: 'Soy una Empresa Local del Sureste', value: 'local' },
                        { text: 'Soy Empresa / Institución / Gobierno', value: 'empresa' }
                    ], function (opt) {
                        addBubble(human, opt.text, 0).then(function () {
                            askSecond(opt.value);
                        });
                    });
                });
        }

        start();
    });
})();

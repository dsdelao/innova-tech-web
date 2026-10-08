# Innova-Tech — sitio corporativo

Sitio estático en cuatro idiomas (`es/` es la raíz, más `en/`, `ru/` y `zh/`),
sin build: HTML, CSS y JS se editan a mano.

## Estructura

```
index.html            portada (6 casos de la pestaña Proyectos/casos reales)
capacitaciones.html   servicios de capacitación
cursos.html           catálogo de cursos
contacto.html         formularios (contacto y capacitación)
css/style.css         hoja de estilos única
js/                   main, analytics, assistant, form-endpoint
img/                  logotipos, hero y capturas de evidencia
privacy/innova-tech/  aviso de privacidad en los 4 idiomas
form.php              endpoint de los formularios (POST)
robots, sitemap
```

Cada idioma tiene sus 4 páginas; la estructura y los `id` de sección son
idénticos entre los cuatro, así que un cambio de token se replica ×16.

## Formularios

`form.php` no se puede probar con GET: responde `405` en JSON. Acepta solo
`POST` con:

- `form` — origen (`contacto` / `capacitaciones`)
- `nombre`, `email`, `mensaje` (obligatorios)
- `t` — marca de tiempo, **tiene que pasar más de 3 s** desde que se cargó
  la página (trampa de bots)
- `website` — honeypot, **tiene que venir vacío**

Además limita a 5 envíos por hora por IP. El destino son los buzones de la
empresa (`admin@` para ARCO, copia oculta a `info@`), sin terceros, y así se
puede validar una meta con `Content-Type: application/json`.

En desarrollo la raíz es `/var/www/html`; para probarlo sin enviar correo real
usa campos inválidos o llena el honeypot.

## Evidencia visual

Las capturas de los casos (`img/caso-*.webp`) se exportan a **1600×1000** y se
convierten a WebP a calidad 82. Se toma solo la parte superior de la captura de
página completa. `js/capacitaciones.js` no existe: nada lo referencia.

## Verificación

```bash
# HTML balanceado en las 16 páginas
python3 check_html.py .
```

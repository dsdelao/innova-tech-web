<?php
/**
 * Endpoint unico de formularios de Innova-Tech.
 *
 * Recibe los formularios de contacto y de capacitaciones y entrega el correo
 * en el buzon del titular. No hay terceros: por eso el aviso de privacidad
 * puede decir, en los cuatro idiomas, que no se transfieren datos sin
 * consentimiento. Si algun dia se mete un servicio externo tipo Formspree,
 * hay que anadir su clausula al aviso ANTES de activar el formulario.
 *
 * Criterios de seguridad aplicados:
 *  - solo POST
 *  - honeypot: campo invisible que un humano nunca llena
 *  - trampa de tiempo: menos de 3 s entre cargar y enviar = bot
 *  - limite por IP (5 envios/hora) en /tmp, nunca en el docroot
 *  - todo valor pasa por clean(), que elimina CR/LF: sin inyeccion de cabeceras
 *  - la respuesta nunca devuelve lo que el visitante escribio (sin XSS)
 *  - errores al visitante son genericos; el detalle va a error_log()
 */

declare(strict_types=1);

const PARA        = 'admin@innova-tech.com.mx';   // buzon del titular (canal ARCO)
const COPIA_OCULTA = 'info@innova-tech.com.mx';   // separa ARCO de prospectos
const ASUNTO_BASE = '[Innova-Tech]';
const MAX_POR_HORA = 5;
const MIN_SEGUNDOS = 3;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/** Responde y termina. */
function salir(bool $ok, string $msg, int $code = 200): void {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Deja solo lo imprimible y quita CR/LF. El CR/LF es lo que permite
 * inyectar cabeceras de correo o romper lineas en el cuerpo.
 */
function clean($v, int $max = 300): string {
    if (!is_string($v)) {
        return '';
    }
    $v = str_replace(["\r", "\n", "\0", "\x0B", "\x0C"], ' ', $v);
    $v = preg_replace('/[\x00-\x1F\x7F]/u', '', $v) ?? '';
    $v = trim(preg_replace('/\s+/u', ' ', $v) ?? '');
    return mb_substr($v, 0, $max, 'UTF-8');
}

function ip(): string {
    return (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/** Limite por IP. Fichero en sys_get_temp_dir(), fuera del docroot. */
function excede(int $max): bool {
    $f = sys_get_temp_dir() . '/it_form_' . sha1(ip()) . '.cnt';
    $n = 0;
    if (is_file($f) && (time() - filemtime($f) < 3600)) {
        $n = (int)@file_get_contents($f);
    }
    if ($n >= $max) {
        return true;
    }
    @file_put_contents($f, (string)($n + 1), LOCK_EX);
    return false;
}

// ── 1. metodo ──────────────────────────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    salir(false, 'Metodo no permitido.', 405);
}

// ── 2. honeypot: campo invisible, vacio en cualquier envio real ─────────
if (clean($_POST['website'] ?? '', 100) !== '') {
    error_log('[form] honeypot activado desde ' . ip());
    salir(true, 'Mensaje recibido. Le responderemos en breve.');   // mismo texto: no confirma nada
}

// ── 3. trampa de tiempo: un humano tarda mas de 3 s ───────────────────
$t = (int)($_POST['t'] ?? 0);
if ($t > 0 && (time() - $t) < MIN_SEGUNDOS) {
    error_log('[form] tiempo insuficiente desde ' . ip());
    salir(false, 'Ha enviado el formulario demasiado rapido. Intente de nuevo.', 429);
}

// ── 4. limite por IP ──────────────────────────────────────────────────
if (excede(MAX_POR_HORA)) {
    salir(false, 'Ha enviado demasiados mensajes. Intentelo mas tarde.', 429);
}

// ── 5. campos ──────────────────────────────────────────────────────────
$origen   = clean($_POST['form'] ?? 'contacto', 30);
$nombre   = clean($_POST['nombre'] ?? '', 120);
$email    = clean($_POST['email'] ?? '', 180);
$empresa  = clean($_POST['empresa'] ?? '', 150);
$interes  = clean($_POST['interes'] ?? '', 120);
$mensaje  = clean($_POST['mensaje'] ?? '', 2000);
$inst     = clean($_POST['institucion'] ?? '', 150);
$modal    = clean($_POST['modalidad'] ?? '', 60);

if ($origen === '') {
    $origen = 'contacto';
}

if ($nombre === '' || $email === '') {
    salir(false, 'Nombre y correo son obligatorios.', 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email, 'UTF-8') > 180) {
    salir(false, 'El correo no tiene un formato valido.', 400);
}

// ── 6. armamos el correo ───────────────────────────────────────────────
$etiquetas = ['contacto' => 'Contacto', 'capacitaciones' => 'Capacitaciones'];
$asunto = ASUNTO_BASE . ' ' . ($etiquetas[$origen] ?? $origen) . ' - ' . $nombre;

$filas = [
    'Origen'      => $origen,
    'Nombre'      => $nombre,
    'Correo'      => $email,
];
if ($empresa !== '') { $filas['Empresa / Institucion'] = $empresa; }
if ($interes  !== '') { $filas['Area de interes'] = $interes; }
if ($inst    !== '') { $filas['Institucion'] = $inst; }
if ($modal   !== '') { $filas['Modalidad'] = $modal; }
if ($mensaje !== '') { $filas['Mensaje'] = $mensaje; }

$lineas = ['Mensaje recibido desde el sitio web.'];
$lineas[] = str_repeat('-', 46);
foreach ($filas as $k => $v) {
    $lineas[] = $k . ': ' . $v;
}
$lineas[] = str_repeat('-', 46);
$lineas[] = 'Enviado: ' . date('Y-m-d H:i:s T');
$lineas[] = 'IP: ' . ip();
$cuerpo = implode("\r\n", $lineas) . "\r\n";

$cab = [];
$cab[] = 'From: "Sitio Innova-Tech" <no-reply@innova-tech.com.mx>';
$cab[] = 'Reply-To: ' . $email;                       // validado y sin CR/LF
$cab[] = 'X-Mailer: innova-tech/form.php';
$cab[] = 'MIME-Version: 1.0';
$cab[] = 'Content-Type: text/plain; charset=UTF-8';
$cab[] = 'Content-Transfer-Encoding: base64';
if (COPIA_OCULTA !== '') {
    $cab[] = 'Bcc: ' . COPIA_OCULTA;
}

$mail = base64_encode(chunk_split($cuerpo, 76, "\r\n"));

// ── 7. envio ───────────────────────────────────────────────────────────
$ok = @mail(PARA, mb_encode_mimeheader($asunto, 'UTF-8', 'B', "\r\n"), $mail, implode("\r\n", $cab));

if (!$ok) {
    error_log('[form] mail() fallo desde ' . ip() . ' origen=' . $origen);
    salir(false, 'No pudimos enviar el mensaje. Escribanos a ' . PARA . '.', 500);
}

error_log('[form] ok origen=' . $origen . ' ip=' . ip());
salir(true, 'Mensaje recibido. Le responderemos en breve.');

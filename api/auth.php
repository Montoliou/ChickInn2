<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/**
 * Derives the value stored in auth_tokens for a password reset code.
 * Keeps the 6-digit code out of the database while staying within VARCHAR(64).
 */
function resetTokenValue(string $code, int $userId): string
{
    return 'reset:' . substr(hash('sha256', $code . '|' . $userId), 0, 58);
}

// POST /api/auth.php?action=register
if ($method === 'POST' && $action === 'register') {
    $data = jsonInput();
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $displayName = trim($data['displayName'] ?? '');

    if (!$email || !$password || !$displayName) {
        jsonResponse(['error' => 'Alle Felder sind Pflicht'], 400);
    }
    if (strlen($password) < 6) {
        jsonResponse(['error' => 'Passwort muss mindestens 6 Zeichen haben'], 400);
    }

    // Check if email already exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'E-Mail bereits registriert'], 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (email, password, display_name) VALUES (?, ?, ?)');
    $stmt->execute([$email, $hash, $displayName]);
    $userId = (int)$pdo->lastInsertId();

    // Create auth token
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ' . (int)$GLOBALS['TOKEN_EXPIRY_DAYS'] . ' DAY))');
    $stmt->execute([$userId, $token]);

    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'displayName' => $displayName,
        ]
    ], 201);
}

// POST /api/auth.php?action=login
if ($method === 'POST' && $action === 'login') {
    $data = jsonInput();
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (!$email || !$password) {
        jsonResponse(['error' => 'E-Mail und Passwort sind Pflicht'], 400);
    }

    $stmt = $pdo->prepare('SELECT id, email, password, display_name FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(['error' => 'Ungültige Anmeldedaten'], 401);
    }

    // Create auth token
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ' . (int)$GLOBALS['TOKEN_EXPIRY_DAYS'] . ' DAY))');
    $stmt->execute([(int)$user['id'], $token]);

    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'displayName' => $user['display_name'],
        ]
    ]);
}

// GET /api/auth.php?action=me
if ($method === 'GET' && $action === 'me') {
    $user = requireAuth($pdo);
    jsonResponse([
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'displayName' => $user['display_name'],
            'farmId' => $user['farm_id'] ? (int)$user['farm_id'] : null,
            'farmName' => $user['farm_name'] ?? null,
            'farmRole' => $user['farm_role'] ?? null,
        ]
    ]);
}

// POST /api/auth.php?action=reset-request
// Generates a 6-digit reset code (valid 15 min), sends via mail() if available
if ($method === 'POST' && $action === 'reset-request') {
    $data = jsonInput();
    $email = trim($data['email'] ?? '');

    if (!$email) {
        jsonResponse(['error' => 'E-Mail ist Pflicht'], 400);
    }

    $stmt = $pdo->prepare('SELECT id, display_name FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Don't reveal whether email exists
        jsonResponse(['ok' => true, 'message' => 'Falls ein Konto existiert, wurde ein Code gesendet.']);
    }

    $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    // Store reset code as a special token with "reset:" prefix.
    // The code itself is never stored in clear text: a 6-digit value would be
    // trivially guessable if it ever reached requireAuth(), and two users could
    // draw the same code and collide on the UNIQUE index. Hashing with the user
    // id mixed in solves both. 6 + 58 = 64 chars, so VARCHAR(64) still fits.
    $tokenValue = resetTokenValue($code, (int)$user['id']);

    $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE user_id = ? AND token LIKE ?');
    $stmt->execute([$user['id'], 'reset:%']);

    // Expiry is computed by MySQL, not PHP: if the two run in different time
    // zones (common on shared hosting) a PHP-generated timestamp compared
    // against NOW() makes every code look expired the moment it is created.
    $stmt = $pdo->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))');
    $stmt->execute([$user['id'], $tokenValue]);

    // Try to send email. The envelope sender (-f) is required by several shared
    // hosts before they accept a From: header at all.
    $from = $GLOBALS['MAIL_FROM'] ?? 'noreply@montolio.de';
    $headers = implode("\r\n", [
        'From: ChickInn <' . $from . '>',
        'Reply-To: ' . $from,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
    ]);

    $sent = @mail(
        $email,
        'ChickInn - Passwort zurücksetzen',
        "Hallo {$user['display_name']},\n\nDein Code zum Zurücksetzen: $code\n\nDer Code ist 15 Minuten gültig.\n\nViele Grüße,\nChickInn",
        $headers,
        '-f' . $from
    );

    if (!$sent) {
        error_log('ChickInn: password reset mail could not be sent (from=' . $from . ')');
    }

    jsonResponse([
        'ok' => true,
        'message' => 'Falls ein Konto existiert, wurde ein Code gesendet.',
        'emailSent' => (bool)$sent,
    ]);
}

// POST /api/auth.php?action=reset-confirm
if ($method === 'POST' && $action === 'reset-confirm') {
    $data = jsonInput();
    $email = trim($data['email'] ?? '');
    $code = trim($data['code'] ?? '');
    $newPassword = $data['newPassword'] ?? '';

    if (!$email || !$code || !$newPassword) {
        jsonResponse(['error' => 'Alle Felder sind Pflicht'], 400);
    }
    if (strlen($newPassword) < 6) {
        jsonResponse(['error' => 'Passwort muss mindestens 6 Zeichen haben'], 400);
    }

    // The stored token is derived from the code *and* the user id, so the user
    // has to be resolved first. A missing account yields the same error as a
    // bad code, so this does not reveal whether the address is registered.
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $found = $stmt->fetch();

    if (!$found) {
        jsonResponse(['error' => 'Code ungültig oder abgelaufen'], 400);
    }

    $stmt = $pdo->prepare('
        SELECT user_id FROM auth_tokens
        WHERE user_id = ? AND token = ? AND expires_at > NOW()
    ');
    $stmt->execute([$found['id'], resetTokenValue($code, (int)$found['id'])]);
    $match = $stmt->fetch();

    if (!$match) {
        jsonResponse(['error' => 'Code ungültig oder abgelaufen'], 400);
    }

    $user = ['id' => (int)$found['id']];

    // Update password
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
    $stmt->execute([$hash, $user['id']]);

    // Remove reset token
    $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE user_id = ? AND token LIKE ?');
    $stmt->execute([$user['id'], 'reset:%']);

    // Auto-login: create new auth token
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ' . (int)$GLOBALS['TOKEN_EXPIRY_DAYS'] . ' DAY))');
    $stmt->execute([$user['id'], $token]);

    $stmt = $pdo->prepare('SELECT email, display_name FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $u = $stmt->fetch();

    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'email' => $u['email'],
            'displayName' => $u['display_name'],
        ]
    ]);
}

// POST /api/auth.php?action=logout
if ($method === 'POST' && $action === 'logout') {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE token = ?');
        $stmt->execute([$m[1]]);
    }
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Unknown action'], 404);

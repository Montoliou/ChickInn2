<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

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
    $expires = date('Y-m-d H:i:s', strtotime("+{$GLOBALS['TOKEN_EXPIRY_DAYS']} days"));
    $stmt = $pdo->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
    $stmt->execute([$userId, $token, $expires]);

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
    $expires = date('Y-m-d H:i:s', strtotime("+{$GLOBALS['TOKEN_EXPIRY_DAYS']} days"));
    $stmt = $pdo->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
    $stmt->execute([(int)$user['id'], $token, $expires]);

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
    $expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    // Store reset code as a special token with "reset:" prefix
    $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE user_id = ? AND token LIKE ?');
    $stmt->execute([$user['id'], 'reset:%']);

    $stmt = $pdo->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
    $stmt->execute([$user['id'], "reset:$code", $expires]);

    // Try to send email
    $sent = @mail(
        $email,
        'ChickInn - Passwort zurücksetzen',
        "Hallo {$user['display_name']},\n\nDein Code zum Zurücksetzen: $code\n\nDer Code ist 15 Minuten gültig.\n\nViele Grüße,\nChickInn",
        "From: noreply@montolio.de\r\nContent-Type: text/plain; charset=utf-8"
    );

    jsonResponse([
        'ok' => true,
        'message' => 'Falls ein Konto existiert, wurde ein Code gesendet.',
        'emailSent' => $sent,
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

    $stmt = $pdo->prepare('
        SELECT u.id FROM users u
        JOIN auth_tokens t ON t.user_id = u.id
        WHERE u.email = ? AND t.token = ? AND t.expires_at > NOW()
    ');
    $stmt->execute([$email, "reset:$code"]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['error' => 'Code ungültig oder abgelaufen'], 400);
    }

    // Update password
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
    $stmt->execute([$hash, $user['id']]);

    // Remove reset token
    $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE user_id = ? AND token LIKE ?');
    $stmt->execute([$user['id'], 'reset:%']);

    // Auto-login: create new auth token
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime("+{$GLOBALS['TOKEN_EXPIRY_DAYS']} days"));
    $stmt = $pdo->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
    $stmt->execute([$user['id'], $token, $expires]);

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

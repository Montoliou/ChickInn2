<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET /api/farm.php — get current farm info + members
if ($method === 'GET' && !$action) {
    $farmId = $user['farm_id'] ?? null;

    if (!$farmId) {
        jsonResponse(['farm' => null]);
    }

    $stmt = $pdo->prepare('SELECT * FROM farms WHERE id = ?');
    $stmt->execute([$farmId]);
    $farm = $stmt->fetch();

    $stmt = $pdo->prepare('
        SELECT u.id, u.display_name, u.email, fm.role, fm.joined_at
        FROM farm_members fm
        JOIN users u ON u.id = fm.user_id
        WHERE fm.farm_id = ?
        ORDER BY fm.role DESC, fm.joined_at ASC
    ');
    $stmt->execute([$farmId]);
    $members = $stmt->fetchAll();

    $isOwner = ($user['farm_role'] ?? '') === 'owner';

    jsonResponse([
        'farm' => [
            'id' => (int)$farm['id'],
            'name' => $farm['name'],
            'inviteCode' => $isOwner ? $farm['invite_code'] : null,
            'createdBy' => (int)$farm['created_by'],
        ],
        'members' => array_map(fn($m) => [
            'id' => (int)$m['id'],
            'displayName' => $m['display_name'],
            'email' => $m['email'],
            'role' => $m['role'],
        ], $members),
    ]);
}

// POST /api/farm.php?action=create — create a new farm
if ($method === 'POST' && $action === 'create') {
    if ($user['farm_id']) {
        jsonResponse(['error' => 'Du bist bereits Mitglied einer Farm'], 400);
    }

    $data = jsonInput();
    $name = trim($data['name'] ?? '') ?: 'Meine Farm';
    $inviteCode = strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));

    $stmt = $pdo->prepare('INSERT INTO farms (name, invite_code, created_by) VALUES (?, ?, ?)');
    $stmt->execute([$name, $inviteCode, $user['id']]);
    $farmId = (int)$pdo->lastInsertId();

    $stmt = $pdo->prepare('INSERT INTO farm_members (farm_id, user_id, role) VALUES (?, ?, ?)');
    $stmt->execute([$farmId, $user['id'], 'owner']);

    // Move existing chickens and eggs to the new farm
    $pdo->prepare('UPDATE chickens SET farm_id = ? WHERE user_id = ? AND farm_id IS NULL')->execute([$farmId, $user['id']]);
    $pdo->prepare('UPDATE eggs SET farm_id = ? WHERE user_id = ? AND farm_id IS NULL')->execute([$farmId, $user['id']]);

    jsonResponse([
        'farm' => [
            'id' => $farmId,
            'name' => $name,
            'inviteCode' => $inviteCode,
        ]
    ], 201);
}

// POST /api/farm.php?action=join — join farm with invite code
if ($method === 'POST' && $action === 'join') {
    $data = jsonInput();
    $code = strtoupper(trim($data['code'] ?? ''));

    if (!$code) jsonResponse(['error' => 'Code ist Pflicht'], 400);

    if ($user['farm_id']) {
        jsonResponse(['error' => 'Du bist bereits Mitglied einer Farm. Verlasse zuerst deine aktuelle Farm.'], 400);
    }

    $stmt = $pdo->prepare('SELECT id, name FROM farms WHERE invite_code = ?');
    $stmt->execute([$code]);
    $farm = $stmt->fetch();

    if (!$farm) {
        jsonResponse(['error' => 'Ungültiger Einladungscode'], 404);
    }

    $stmt = $pdo->prepare('SELECT id FROM farm_members WHERE farm_id = ? AND user_id = ?');
    $stmt->execute([$farm['id'], $user['id']]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Du bist bereits Mitglied dieser Farm'], 400);
    }

    $stmt = $pdo->prepare('INSERT INTO farm_members (farm_id, user_id, role) VALUES (?, ?, ?)');
    $stmt->execute([$farm['id'], $user['id'], 'member']);

    // Move user's existing chickens and eggs to the farm
    $pdo->prepare('UPDATE chickens SET farm_id = ? WHERE user_id = ? AND farm_id IS NULL')->execute([$farm['id'], $user['id']]);
    $pdo->prepare('UPDATE eggs SET farm_id = ? WHERE user_id = ? AND farm_id IS NULL')->execute([$farm['id'], $user['id']]);

    jsonResponse([
        'farm' => [
            'id' => (int)$farm['id'],
            'name' => $farm['name'],
        ]
    ]);
}

// POST /api/farm.php?action=leave — leave current farm
if ($method === 'POST' && $action === 'leave') {
    if (!$user['farm_id']) {
        jsonResponse(['error' => 'Du bist in keiner Farm'], 400);
    }

    $farmId = $user['farm_id'];

    if ($user['farm_role'] === 'owner') {
        // Count other members
        $stmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM farm_members WHERE farm_id = ? AND user_id != ?');
        $stmt->execute([$farmId, $user['id']]);
        $otherCount = (int)$stmt->fetch()['cnt'];

        if ($otherCount > 0) {
            jsonResponse(['error' => 'Übertrage zuerst die Admin-Rechte an ein anderes Mitglied.'], 400);
        }

        // Sole owner: unassign chickens/eggs, delete farm
        $pdo->prepare('UPDATE chickens SET farm_id = NULL WHERE farm_id = ? AND user_id = ?')->execute([$farmId, $user['id']]);
        $pdo->prepare('UPDATE eggs SET farm_id = NULL WHERE farm_id = ? AND user_id = ?')->execute([$farmId, $user['id']]);
        $pdo->prepare('DELETE FROM farm_members WHERE farm_id = ?')->execute([$farmId]);
        $pdo->prepare('DELETE FROM farms WHERE id = ?')->execute([$farmId]);
    } else {
        // Regular member: unassign own chickens/eggs, leave
        $pdo->prepare('UPDATE chickens SET farm_id = NULL WHERE farm_id = ? AND user_id = ?')->execute([$farmId, $user['id']]);
        $pdo->prepare('UPDATE eggs SET farm_id = NULL WHERE farm_id = ? AND user_id = ?')->execute([$farmId, $user['id']]);
        $pdo->prepare('DELETE FROM farm_members WHERE farm_id = ? AND user_id = ?')->execute([$farmId, $user['id']]);
    }

    jsonResponse(['ok' => true]);
}

// POST /api/farm.php?action=transfer — transfer admin to another member (owner only)
if ($method === 'POST' && $action === 'transfer') {
    if (!$user['farm_id'] || $user['farm_role'] !== 'owner') {
        jsonResponse(['error' => 'Nur der Admin kann Rechte übertragen'], 403);
    }

    $data = jsonInput();
    $targetUserId = (int)($data['userId'] ?? 0);
    if (!$targetUserId) jsonResponse(['error' => 'userId ist Pflicht'], 400);

    // Verify target is a member of this farm
    $stmt = $pdo->prepare('SELECT id FROM farm_members WHERE farm_id = ? AND user_id = ?');
    $stmt->execute([$user['farm_id'], $targetUserId]);
    if (!$stmt->fetch()) jsonResponse(['error' => 'Benutzer ist kein Mitglied dieser Farm'], 404);

    // Swap roles
    $pdo->prepare('UPDATE farm_members SET role = ? WHERE farm_id = ? AND user_id = ?')->execute(['member', $user['farm_id'], $user['id']]);
    $pdo->prepare('UPDATE farm_members SET role = ? WHERE farm_id = ? AND user_id = ?')->execute(['owner', $user['farm_id'], $targetUserId]);

    jsonResponse(['ok' => true]);
}

// POST /api/farm.php?action=remove — remove a member (owner only)
if ($method === 'POST' && $action === 'remove') {
    if (!$user['farm_id'] || $user['farm_role'] !== 'owner') {
        jsonResponse(['error' => 'Nur der Admin kann Mitglieder entfernen'], 403);
    }

    $data = jsonInput();
    $targetUserId = (int)($data['userId'] ?? 0);
    if (!$targetUserId) jsonResponse(['error' => 'userId ist Pflicht'], 400);

    if ($targetUserId === (int)$user['id']) {
        jsonResponse(['error' => 'Du kannst dich nicht selbst entfernen'], 400);
    }

    $farmId = $user['farm_id'];

    // Unassign their chickens/eggs
    $pdo->prepare('UPDATE chickens SET farm_id = NULL WHERE farm_id = ? AND user_id = ?')->execute([$farmId, $targetUserId]);
    $pdo->prepare('UPDATE eggs SET farm_id = NULL WHERE farm_id = ? AND user_id = ?')->execute([$farmId, $targetUserId]);
    $pdo->prepare('DELETE FROM farm_members WHERE farm_id = ? AND user_id = ?')->execute([$farmId, $targetUserId]);

    jsonResponse(['ok' => true]);
}

// PUT /api/farm.php — update farm name (owner only)
if ($method === 'PUT') {
    if (!$user['farm_id'] || $user['farm_role'] !== 'owner') {
        jsonResponse(['error' => 'Nur der Admin kann die Farm bearbeiten'], 403);
    }

    $data = jsonInput();
    $name = trim($data['name'] ?? '');
    if (!$name) jsonResponse(['error' => 'Name ist Pflicht'], 400);

    $stmt = $pdo->prepare('UPDATE farms SET name = ? WHERE id = ?');
    $stmt->execute([$name, $user['farm_id']]);

    jsonResponse(['ok' => true]);
}

// POST /api/farm.php?action=new-code — regenerate invite code (owner only)
if ($method === 'POST' && $action === 'new-code') {
    if (!$user['farm_id'] || $user['farm_role'] !== 'owner') {
        jsonResponse(['error' => 'Nur der Admin kann den Code erneuern'], 403);
    }

    $newCode = strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
    $stmt = $pdo->prepare('UPDATE farms SET invite_code = ? WHERE id = ?');
    $stmt->execute([$newCode, $user['farm_id']]);

    jsonResponse(['inviteCode' => $newCode]);
}

jsonResponse(['error' => 'Unknown action'], 404);

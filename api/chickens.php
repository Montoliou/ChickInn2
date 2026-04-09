<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$farmId = $user['farm_id'] ?? null;

function mapChicken(array $c): array {
    return [
        'id' => (int)$c['id'],
        'userId' => (int)$c['user_id'],
        'farmId' => $c['farm_id'] ? (int)$c['farm_id'] : null,
        'name' => $c['name'],
        'breed' => $c['breed'],
        'notes' => $c['notes'],
        'photoUrl' => $c['photo_url'],
        'eggPhotoUrl' => $c['egg_photo_url'] ?? null,
        'hatchedAt' => $c['hatched_at'] ?? null,
        'diedAt' => $c['died_at'] ?? null,
        'createdAt' => (int)$c['created_at'],
    ];
}

// GET /api/chickens.php — list all (by farm or user)
if ($method === 'GET' && !$id) {
    if ($farmId) {
        $stmt = $pdo->prepare('SELECT * FROM chickens WHERE farm_id = ? ORDER BY created_at ASC');
        $stmt->execute([$farmId]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM chickens WHERE user_id = ? AND farm_id IS NULL ORDER BY created_at ASC');
        $stmt->execute([$user['id']]);
    }
    jsonResponse(array_map('mapChicken', $stmt->fetchAll()));
}

// GET /api/chickens.php?id=1 — single
if ($method === 'GET' && $id) {
    if ($farmId) {
        $stmt = $pdo->prepare('SELECT * FROM chickens WHERE id = ? AND farm_id = ?');
        $stmt->execute([$id, $farmId]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM chickens WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
    }
    $c = $stmt->fetch();
    if (!$c) jsonResponse(['error' => 'Not found'], 404);
    jsonResponse(mapChicken($c));
}

// POST /api/chickens.php — create
if ($method === 'POST') {
    $data = jsonInput();
    $name = trim($data['name'] ?? '');
    if (!$name) jsonResponse(['error' => 'Name ist Pflicht'], 400);

    $stmt = $pdo->prepare('
        INSERT INTO chickens (user_id, farm_id, name, breed, notes, photo_url, hatched_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $now = (int)(microtime(true) * 1000);
    $stmt->execute([
        $user['id'],
        $farmId,
        $name,
        trim($data['breed'] ?? '') ?: null,
        trim($data['notes'] ?? '') ?: null,
        $data['photoUrl'] ?? null,
        $data['hatchedAt'] ?? null,
        $now,
    ]);

    $stmt = $pdo->prepare('SELECT * FROM chickens WHERE id = ?');
    $stmt->execute([(int)$pdo->lastInsertId()]);
    jsonResponse(mapChicken($stmt->fetch()), 201);
}

// PUT /api/chickens.php?id=1 — update
if ($method === 'PUT' && $id) {
    if ($farmId) {
        $stmt = $pdo->prepare('SELECT id FROM chickens WHERE id = ? AND farm_id = ?');
        $stmt->execute([$id, $farmId]);
    } else {
        $stmt = $pdo->prepare('SELECT id FROM chickens WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
    }
    if (!$stmt->fetch()) jsonResponse(['error' => 'Not found'], 404);

    $data = jsonInput();
    $fields = [];
    $values = [];

    $fieldMap = [
        'name' => 'name', 'breed' => 'breed', 'notes' => 'notes',
        'photoUrl' => 'photo_url', 'eggPhotoUrl' => 'egg_photo_url',
        'hatchedAt' => 'hatched_at', 'diedAt' => 'died_at',
    ];

    foreach ($fieldMap as $input => $col) {
        if (array_key_exists($input, $data)) {
            $fields[] = "$col = ?";
            $values[] = $data[$input];
        }
    }

    if (empty($fields)) jsonResponse(['error' => 'No fields to update'], 400);

    $values[] = $id;
    $stmt = $pdo->prepare('UPDATE chickens SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($values);

    $stmt = $pdo->prepare('SELECT * FROM chickens WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(mapChicken($stmt->fetch()));
}

// DELETE /api/chickens.php?id=1
if ($method === 'DELETE' && $id) {
    if ($farmId) {
        $stmt = $pdo->prepare('SELECT photo_url, egg_photo_url FROM chickens WHERE id = ? AND farm_id = ?');
        $stmt->execute([$id, $farmId]);
    } else {
        $stmt = $pdo->prepare('SELECT photo_url, egg_photo_url FROM chickens WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
    }
    $c = $stmt->fetch();
    if (!$c) jsonResponse(['error' => 'Not found'], 404);

    foreach (['photo_url', 'egg_photo_url'] as $col) {
        if ($c[$col]) {
            $file = __DIR__ . '/uploads/' . basename($c[$col]);
            if (file_exists($file)) unlink($file);
        }
    }

    $stmt = $pdo->prepare('DELETE FROM chickens WHERE id = ?');
    $stmt->execute([$id]);

    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Invalid request'], 400);

<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

// GET /api/chickens.php — list all
if ($method === 'GET' && !$id) {
    $stmt = $pdo->prepare('SELECT * FROM chickens WHERE user_id = ? ORDER BY created_at ASC');
    $stmt->execute([$user['id']]);
    $chickens = $stmt->fetchAll();

    jsonResponse(array_map(fn($c) => [
        'id' => (int)$c['id'],
        'userId' => (int)$c['user_id'],
        'name' => $c['name'],
        'breed' => $c['breed'],
        'notes' => $c['notes'],
        'photoUrl' => $c['photo_url'],
        'createdAt' => (int)$c['created_at'],
    ], $chickens));
}

// GET /api/chickens.php?id=1 — single
if ($method === 'GET' && $id) {
    $stmt = $pdo->prepare('SELECT * FROM chickens WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);
    $c = $stmt->fetch();
    if (!$c) jsonResponse(['error' => 'Not found'], 404);

    jsonResponse([
        'id' => (int)$c['id'],
        'userId' => (int)$c['user_id'],
        'name' => $c['name'],
        'breed' => $c['breed'],
        'notes' => $c['notes'],
        'photoUrl' => $c['photo_url'],
        'createdAt' => (int)$c['created_at'],
    ]);
}

// POST /api/chickens.php — create
if ($method === 'POST') {
    $data = jsonInput();
    $name = trim($data['name'] ?? '');
    if (!$name) jsonResponse(['error' => 'Name ist Pflicht'], 400);

    $stmt = $pdo->prepare('
        INSERT INTO chickens (user_id, name, breed, notes, photo_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    $now = (int)(microtime(true) * 1000);
    $stmt->execute([
        $user['id'],
        $name,
        trim($data['breed'] ?? '') ?: null,
        trim($data['notes'] ?? '') ?: null,
        $data['photoUrl'] ?? null,
        $now,
    ]);

    jsonResponse([
        'id' => (int)$pdo->lastInsertId(),
        'userId' => (int)$user['id'],
        'name' => $name,
        'breed' => trim($data['breed'] ?? '') ?: null,
        'notes' => trim($data['notes'] ?? '') ?: null,
        'photoUrl' => $data['photoUrl'] ?? null,
        'createdAt' => $now,
    ], 201);
}

// PUT /api/chickens.php?id=1 — update
if ($method === 'PUT' && $id) {
    // Verify ownership
    $stmt = $pdo->prepare('SELECT id FROM chickens WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);
    if (!$stmt->fetch()) jsonResponse(['error' => 'Not found'], 404);

    $data = jsonInput();
    $fields = [];
    $values = [];

    foreach (['name' => 'name', 'breed' => 'breed', 'notes' => 'notes', 'photoUrl' => 'photo_url'] as $input => $col) {
        if (array_key_exists($input, $data)) {
            $fields[] = "$col = ?";
            $values[] = $data[$input];
        }
    }

    if (empty($fields)) jsonResponse(['error' => 'No fields to update'], 400);

    $values[] = $id;
    $values[] = $user['id'];
    $stmt = $pdo->prepare('UPDATE chickens SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?');
    $stmt->execute($values);

    // Return updated chicken
    $stmt = $pdo->prepare('SELECT * FROM chickens WHERE id = ?');
    $stmt->execute([$id]);
    $c = $stmt->fetch();

    jsonResponse([
        'id' => (int)$c['id'],
        'userId' => (int)$c['user_id'],
        'name' => $c['name'],
        'breed' => $c['breed'],
        'notes' => $c['notes'],
        'photoUrl' => $c['photo_url'],
        'createdAt' => (int)$c['created_at'],
    ]);
}

// DELETE /api/chickens.php?id=1
if ($method === 'DELETE' && $id) {
    // Delete associated photo file
    $stmt = $pdo->prepare('SELECT photo_url FROM chickens WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);
    $c = $stmt->fetch();
    if (!$c) jsonResponse(['error' => 'Not found'], 404);

    if ($c['photo_url']) {
        $file = __DIR__ . '/uploads/' . basename($c['photo_url']);
        if (file_exists($file)) unlink($file);
    }

    $stmt = $pdo->prepare('DELETE FROM chickens WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);

    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Invalid request'], 400);

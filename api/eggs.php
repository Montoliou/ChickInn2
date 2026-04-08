<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

// GET /api/eggs.php — list (optional: ?chickenId=1)
if ($method === 'GET' && !$id) {
    $chickenId = isset($_GET['chickenId']) ? (int)$_GET['chickenId'] : null;

    if ($chickenId) {
        $stmt = $pdo->prepare('SELECT * FROM eggs WHERE user_id = ? AND chicken_id = ? ORDER BY laid_at DESC');
        $stmt->execute([$user['id'], $chickenId]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM eggs WHERE user_id = ? ORDER BY laid_at DESC');
        $stmt->execute([$user['id']]);
    }

    $eggs = $stmt->fetchAll();
    jsonResponse(array_map(fn($e) => [
        'id' => (int)$e['id'],
        'chickenId' => (int)$e['chicken_id'],
        'userId' => (int)$e['user_id'],
        'laidAt' => (int)$e['laid_at'],
        'notes' => $e['notes'],
    ], $eggs));
}

// POST /api/eggs.php — create
if ($method === 'POST') {
    $data = jsonInput();
    $chickenId = (int)($data['chickenId'] ?? 0);

    if (!$chickenId) jsonResponse(['error' => 'chickenId ist Pflicht'], 400);

    // Verify chicken belongs to user
    $stmt = $pdo->prepare('SELECT id FROM chickens WHERE id = ? AND user_id = ?');
    $stmt->execute([$chickenId, $user['id']]);
    if (!$stmt->fetch()) jsonResponse(['error' => 'Huhn nicht gefunden'], 404);

    $laidAt = (int)($data['laidAt'] ?? round(microtime(true) * 1000));

    $stmt = $pdo->prepare('INSERT INTO eggs (chicken_id, user_id, laid_at, notes) VALUES (?, ?, ?, ?)');
    $stmt->execute([
        $chickenId,
        $user['id'],
        $laidAt,
        trim($data['notes'] ?? '') ?: null,
    ]);

    jsonResponse([
        'id' => (int)$pdo->lastInsertId(),
        'chickenId' => $chickenId,
        'userId' => (int)$user['id'],
        'laidAt' => $laidAt,
        'notes' => trim($data['notes'] ?? '') ?: null,
    ], 201);
}

// DELETE /api/eggs.php?id=1
if ($method === 'DELETE' && $id) {
    $stmt = $pdo->prepare('DELETE FROM eggs WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);

    if ($stmt->rowCount() === 0) jsonResponse(['error' => 'Not found'], 404);
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Invalid request'], 400);

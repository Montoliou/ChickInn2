<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$farmId = $user['farm_id'] ?? null;

function mapEgg(array $e): array {
    return [
        'id' => (int)$e['id'],
        'chickenId' => (int)$e['chicken_id'],
        'userId' => (int)$e['user_id'],
        'farmId' => $e['farm_id'] ? (int)$e['farm_id'] : null,
        'laidAt' => (int)$e['laid_at'],
        'notes' => $e['notes'],
        'createdAt' => isset($e['created_at']) && $e['created_at'] !== null ? (int)$e['created_at'] : null,
        'createdBy' => $e['created_by_name'] ?? null,
    ];
}

// GET /api/eggs.php — list (optional: ?chickenId=1)
if ($method === 'GET' && !$id) {
    $chickenId = isset($_GET['chickenId']) ? (int)$_GET['chickenId'] : null;
    $base = 'SELECT e.*, u.display_name AS created_by_name FROM eggs e LEFT JOIN users u ON u.id = e.user_id';

    if ($farmId) {
        if ($chickenId) {
            $stmt = $pdo->prepare("$base WHERE e.farm_id = ? AND e.chicken_id = ? ORDER BY e.laid_at DESC");
            $stmt->execute([$farmId, $chickenId]);
        } else {
            $stmt = $pdo->prepare("$base WHERE e.farm_id = ? ORDER BY e.laid_at DESC");
            $stmt->execute([$farmId]);
        }
    } else {
        if ($chickenId) {
            $stmt = $pdo->prepare("$base WHERE e.user_id = ? AND e.chicken_id = ? ORDER BY e.laid_at DESC");
            $stmt->execute([$user['id'], $chickenId]);
        } else {
            $stmt = $pdo->prepare("$base WHERE e.user_id = ? ORDER BY e.laid_at DESC");
            $stmt->execute([$user['id']]);
        }
    }

    $eggs = $stmt->fetchAll();
    jsonResponse(array_map('mapEgg', $eggs));
}

// POST /api/eggs.php — create
if ($method === 'POST') {
    $data = jsonInput();
    $chickenId = (int)($data['chickenId'] ?? 0);

    if (!$chickenId) jsonResponse(['error' => 'chickenId ist Pflicht'], 400);

    // Verify chicken belongs to user's farm (or user)
    if ($farmId) {
        $stmt = $pdo->prepare('SELECT id FROM chickens WHERE id = ? AND farm_id = ?');
        $stmt->execute([$chickenId, $farmId]);
    } else {
        $stmt = $pdo->prepare('SELECT id FROM chickens WHERE id = ? AND user_id = ?');
        $stmt->execute([$chickenId, $user['id']]);
    }
    if (!$stmt->fetch()) jsonResponse(['error' => 'Huhn nicht gefunden'], 404);

    $nowMs = (int)round(microtime(true) * 1000);
    $laidAt = (int)($data['laidAt'] ?? $nowMs);

    $stmt = $pdo->prepare('INSERT INTO eggs (chicken_id, user_id, farm_id, laid_at, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $chickenId,
        $user['id'],
        $farmId,
        $laidAt,
        trim($data['notes'] ?? '') ?: null,
        $nowMs,
    ]);

    jsonResponse([
        'id' => (int)$pdo->lastInsertId(),
        'chickenId' => $chickenId,
        'userId' => (int)$user['id'],
        'farmId' => $farmId ? (int)$farmId : null,
        'laidAt' => $laidAt,
        'notes' => trim($data['notes'] ?? '') ?: null,
        'createdAt' => $nowMs,
        'createdBy' => $user['display_name'] ?? null,
    ], 201);
}

// DELETE /api/eggs.php?id=1
if ($method === 'DELETE' && $id) {
    if ($farmId) {
        $stmt = $pdo->prepare('DELETE FROM eggs WHERE id = ? AND farm_id = ?');
        $stmt->execute([$id, $farmId]);
    } else {
        $stmt = $pdo->prepare('DELETE FROM eggs WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
    }

    if ($stmt->rowCount() === 0) jsonResponse(['error' => 'Not found'], 404);
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Invalid request'], 400);

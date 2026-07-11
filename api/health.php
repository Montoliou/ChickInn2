<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$farmId = $user['farm_id'] ?? null;

// GET /api/health.php?chickenId=1 — get health logs for a chicken
// Optional: &from=2026-01-01&to=2026-04-09
if ($method === 'GET') {
    $chickenId = (int)($_GET['chickenId'] ?? 0);
    if (!$chickenId) jsonResponse(['error' => 'chickenId ist Pflicht'], 400);

    // Verify access
    if ($farmId) {
        $stmt = $pdo->prepare('SELECT id FROM chickens WHERE id = ? AND farm_id = ?');
        $stmt->execute([$chickenId, $farmId]);
    } else {
        $stmt = $pdo->prepare('SELECT id FROM chickens WHERE id = ? AND user_id = ?');
        $stmt->execute([$chickenId, $user['id']]);
    }
    if (!$stmt->fetch()) jsonResponse(['error' => 'Huhn nicht gefunden'], 404);

    $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
    $to = $_GET['to'] ?? date('Y-m-d');

    $stmt = $pdo->prepare('
        SELECT * FROM health_logs
        WHERE chicken_id = ? AND log_date >= ? AND log_date <= ?
        ORDER BY log_date DESC
    ');
    $stmt->execute([$chickenId, $from, $to]);
    $logs = $stmt->fetchAll();

    jsonResponse(array_map(fn($l) => [
        'id' => (int)$l['id'],
        'chickenId' => (int)$l['chicken_id'],
        'logDate' => $l['log_date'],
        'checks' => json_decode($l['checks_json'], true),
        'notes' => $l['notes'],
    ], $logs));
}

// POST /api/health.php — create or update health log for a date
if ($method === 'POST') {
    $data = jsonInput();
    $chickenId = (int)($data['chickenId'] ?? 0);
    $logDate = $data['logDate'] ?? date('Y-m-d');
    $checks = $data['checks'] ?? [];
    $notes = trim($data['notes'] ?? '') ?: null;

    if (!$chickenId) jsonResponse(['error' => 'chickenId ist Pflicht'], 400);

    // Verify access
    if ($farmId) {
        $stmt = $pdo->prepare('SELECT id FROM chickens WHERE id = ? AND farm_id = ?');
        $stmt->execute([$chickenId, $farmId]);
    } else {
        $stmt = $pdo->prepare('SELECT id FROM chickens WHERE id = ? AND user_id = ?');
        $stmt->execute([$chickenId, $user['id']]);
    }
    if (!$stmt->fetch()) jsonResponse(['error' => 'Huhn nicht gefunden'], 404);

    $checksJson = json_encode($checks);

    // Upsert: INSERT ... ON DUPLICATE KEY UPDATE
    $stmt = $pdo->prepare('
        INSERT INTO health_logs (chicken_id, user_id, farm_id, log_date, checks_json, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE checks_json = VALUES(checks_json), notes = VALUES(notes)
    ');
    $stmt->execute([$chickenId, $user['id'], $farmId, $logDate, $checksJson, $notes]);

    $id = (int)$pdo->lastInsertId();

    jsonResponse([
        'id' => $id,
        'chickenId' => $chickenId,
        'logDate' => $logDate,
        'checks' => $checks,
        'notes' => $notes,
    ], 201);
}

jsonResponse(['error' => 'Invalid request'], 400);

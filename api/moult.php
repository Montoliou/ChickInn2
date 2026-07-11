<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$farmId = $user['farm_id'] ? (int)$user['farm_id'] : null;

function mapMoultPeriod(array $period): array {
    return [
        'id' => (int)$period['id'],
        'chickenId' => (int)$period['chicken_id'],
        'userId' => (int)$period['user_id'],
        'farmId' => $period['farm_id'] ? (int)$period['farm_id'] : null,
        'startDate' => (int)$period['start_date'],
        'endDate' => $period['end_date'] !== null ? (int)$period['end_date'] : null,
        'notes' => $period['notes'],
    ];
}

function loadScopedMoultChicken(PDO $pdo, int $chickenId, int $userId, ?int $farmId): ?array {
    if ($farmId) {
        $stmt = $pdo->prepare('SELECT id, farm_id FROM chickens WHERE id = ? AND farm_id = ?');
        $stmt->execute([$chickenId, $farmId]);
    } else {
        $stmt = $pdo->prepare('SELECT id, farm_id FROM chickens WHERE id = ? AND user_id = ? AND farm_id IS NULL');
        $stmt->execute([$chickenId, $userId]);
    }

    return $stmt->fetch() ?: null;
}

function loadScopedMoultPeriod(PDO $pdo, int $periodId, int $userId, ?int $farmId): ?array {
    if ($farmId) {
        $stmt = $pdo->prepare('
            SELECT mp.*
            FROM moult_periods mp
            JOIN chickens c ON c.id = mp.chicken_id
            WHERE mp.id = ? AND c.farm_id = ?
        ');
        $stmt->execute([$periodId, $farmId]);
    } else {
        $stmt = $pdo->prepare('
            SELECT mp.*
            FROM moult_periods mp
            JOIN chickens c ON c.id = mp.chicken_id
            WHERE mp.id = ? AND c.user_id = ? AND c.farm_id IS NULL
        ');
        $stmt->execute([$periodId, $userId]);
    }

    return $stmt->fetch() ?: null;
}

function normalizeMoultOptionalTimestamp(mixed $value): ?int {
    if ($value === null || $value === '') {
        return null;
    }

    return (int)$value;
}

if ($method === 'GET' && !$id) {
    $chickenId = (int)($_GET['chickenId'] ?? 0);
    if (!$chickenId) {
        jsonResponse(['error' => 'chickenId ist Pflicht'], 400);
    }

    if (!loadScopedMoultChicken($pdo, $chickenId, (int)$user['id'], $farmId)) {
        jsonResponse(['error' => 'Huhn nicht gefunden'], 404);
    }

    $stmt = $pdo->prepare('
        SELECT *
        FROM moult_periods
        WHERE chicken_id = ?
        ORDER BY (end_date IS NULL) DESC, start_date DESC, id DESC
    ');
    $stmt->execute([$chickenId]);

    jsonResponse(array_map('mapMoultPeriod', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $data = jsonInput();
    $chickenId = (int)($data['chickenId'] ?? 0);
    $startDate = (int)($data['startDate'] ?? 0);
    $endDate = normalizeMoultOptionalTimestamp($data['endDate'] ?? null);
    $notes = trim($data['notes'] ?? '') ?: null;

    if (!$chickenId) {
        jsonResponse(['error' => 'chickenId ist Pflicht'], 400);
    }
    if ($startDate <= 0) {
        jsonResponse(['error' => 'startDate ist Pflicht'], 400);
    }
    if ($endDate !== null && $endDate < $startDate) {
        jsonResponse(['error' => 'Ende darf nicht vor dem Start liegen'], 400);
    }

    $chicken = loadScopedMoultChicken($pdo, $chickenId, (int)$user['id'], $farmId);
    if (!$chicken) {
        jsonResponse(['error' => 'Huhn nicht gefunden'], 404);
    }

    $stmt = $pdo->prepare('
        INSERT INTO moult_periods (chicken_id, user_id, farm_id, start_date, end_date, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $chickenId,
        (int)$user['id'],
        $chicken['farm_id'] ? (int)$chicken['farm_id'] : null,
        $startDate,
        $endDate,
        $notes,
    ]);

    $stmt = $pdo->prepare('SELECT * FROM moult_periods WHERE id = ?');
    $stmt->execute([(int)$pdo->lastInsertId()]);
    jsonResponse(mapMoultPeriod($stmt->fetch()), 201);
}

if ($method === 'PUT' && $id) {
    $existing = loadScopedMoultPeriod($pdo, $id, (int)$user['id'], $farmId);
    if (!$existing) {
        jsonResponse(['error' => 'Mauser-Periode nicht gefunden'], 404);
    }

    $data = jsonInput();
    $fields = [];
    $values = [];

    $nextStartDate = (int)$existing['start_date'];
    $nextEndDate = $existing['end_date'] !== null ? (int)$existing['end_date'] : null;

    if (array_key_exists('startDate', $data)) {
        $nextStartDate = (int)$data['startDate'];
        if ($nextStartDate <= 0) {
            jsonResponse(['error' => 'startDate ist Pflicht'], 400);
        }
        $fields[] = 'start_date = ?';
        $values[] = $nextStartDate;
    }

    if (array_key_exists('endDate', $data)) {
        $nextEndDate = normalizeMoultOptionalTimestamp($data['endDate']);
        $fields[] = 'end_date = ?';
        $values[] = $nextEndDate;
    }

    if (array_key_exists('notes', $data)) {
        $fields[] = 'notes = ?';
        $values[] = trim($data['notes'] ?? '') ?: null;
    }

    if (!$fields) {
        jsonResponse(['error' => 'Keine Felder zum Aktualisieren'], 400);
    }
    if ($nextEndDate !== null && $nextEndDate < $nextStartDate) {
        jsonResponse(['error' => 'Ende darf nicht vor dem Start liegen'], 400);
    }

    $values[] = $id;
    $stmt = $pdo->prepare('UPDATE moult_periods SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($values);

    $stmt = $pdo->prepare('SELECT * FROM moult_periods WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(mapMoultPeriod($stmt->fetch()));
}

if ($method === 'DELETE' && $id) {
    if (!loadScopedMoultPeriod($pdo, $id, (int)$user['id'], $farmId)) {
        jsonResponse(['error' => 'Mauser-Periode nicht gefunden'], 404);
    }

    $stmt = $pdo->prepare('DELETE FROM moult_periods WHERE id = ?');
    $stmt->execute([$id]);

    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Invalid request'], 400);

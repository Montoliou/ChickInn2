<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$farmId = $user['farm_id'] ? (int)$user['farm_id'] : null;

function mapMedication(array $medication): array {
    return [
        'id' => (int)$medication['id'],
        'chickenId' => (int)$medication['chicken_id'],
        'userId' => (int)$medication['user_id'],
        'farmId' => $medication['farm_id'] ? (int)$medication['farm_id'] : null,
        'name' => $medication['name'],
        'startDate' => (int)$medication['start_date'],
        'endDate' => $medication['end_date'] !== null ? (int)$medication['end_date'] : null,
        'notes' => $medication['notes'],
    ];
}

function loadScopedChicken(PDO $pdo, int $chickenId, int $userId, ?int $farmId): ?array {
    if ($farmId) {
        $stmt = $pdo->prepare('SELECT id, farm_id FROM chickens WHERE id = ? AND farm_id = ?');
        $stmt->execute([$chickenId, $farmId]);
    } else {
        $stmt = $pdo->prepare('SELECT id, farm_id FROM chickens WHERE id = ? AND user_id = ? AND farm_id IS NULL');
        $stmt->execute([$chickenId, $userId]);
    }

    return $stmt->fetch() ?: null;
}

function loadScopedMedication(PDO $pdo, int $medicationId, int $userId, ?int $farmId): ?array {
    if ($farmId) {
        $stmt = $pdo->prepare('
            SELECT m.*
            FROM medications m
            JOIN chickens c ON c.id = m.chicken_id
            WHERE m.id = ? AND c.farm_id = ?
        ');
        $stmt->execute([$medicationId, $farmId]);
    } else {
        $stmt = $pdo->prepare('
            SELECT m.*
            FROM medications m
            JOIN chickens c ON c.id = m.chicken_id
            WHERE m.id = ? AND c.user_id = ? AND c.farm_id IS NULL
        ');
        $stmt->execute([$medicationId, $userId]);
    }

    return $stmt->fetch() ?: null;
}

function normalizeOptionalTimestamp(mixed $value): ?int {
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

    if (!loadScopedChicken($pdo, $chickenId, (int)$user['id'], $farmId)) {
        jsonResponse(['error' => 'Huhn nicht gefunden'], 404);
    }

    $stmt = $pdo->prepare('
        SELECT *
        FROM medications
        WHERE chicken_id = ?
        ORDER BY (end_date IS NULL) DESC, start_date DESC, id DESC
    ');
    $stmt->execute([$chickenId]);

    jsonResponse(array_map('mapMedication', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $data = jsonInput();
    $chickenId = (int)($data['chickenId'] ?? 0);
    $name = trim($data['name'] ?? '');
    $startDate = (int)($data['startDate'] ?? 0);
    $endDate = normalizeOptionalTimestamp($data['endDate'] ?? null);
    $notes = trim($data['notes'] ?? '') ?: null;

    if (!$chickenId) {
        jsonResponse(['error' => 'chickenId ist Pflicht'], 400);
    }
    if ($name === '') {
        jsonResponse(['error' => 'Name ist Pflicht'], 400);
    }
    if ($startDate <= 0) {
        jsonResponse(['error' => 'startDate ist Pflicht'], 400);
    }
    if ($endDate !== null && $endDate < $startDate) {
        jsonResponse(['error' => 'Ende darf nicht vor dem Start liegen'], 400);
    }

    $chicken = loadScopedChicken($pdo, $chickenId, (int)$user['id'], $farmId);
    if (!$chicken) {
        jsonResponse(['error' => 'Huhn nicht gefunden'], 404);
    }

    $stmt = $pdo->prepare('
        INSERT INTO medications (chicken_id, user_id, farm_id, name, start_date, end_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $chickenId,
        (int)$user['id'],
        $chicken['farm_id'] ? (int)$chicken['farm_id'] : null,
        $name,
        $startDate,
        $endDate,
        $notes,
    ]);

    $stmt = $pdo->prepare('SELECT * FROM medications WHERE id = ?');
    $stmt->execute([(int)$pdo->lastInsertId()]);
    jsonResponse(mapMedication($stmt->fetch()), 201);
}

if ($method === 'PUT' && $id) {
    $existing = loadScopedMedication($pdo, $id, (int)$user['id'], $farmId);
    if (!$existing) {
        jsonResponse(['error' => 'Medikation nicht gefunden'], 404);
    }

    $data = jsonInput();
    $fields = [];
    $values = [];

    $nextName = $existing['name'];
    $nextStartDate = (int)$existing['start_date'];
    $nextEndDate = $existing['end_date'] !== null ? (int)$existing['end_date'] : null;

    if (array_key_exists('name', $data)) {
        $nextName = trim($data['name'] ?? '');
        if ($nextName === '') {
            jsonResponse(['error' => 'Name ist Pflicht'], 400);
        }
        $fields[] = 'name = ?';
        $values[] = $nextName;
    }

    if (array_key_exists('startDate', $data)) {
        $nextStartDate = (int)$data['startDate'];
        if ($nextStartDate <= 0) {
            jsonResponse(['error' => 'startDate ist Pflicht'], 400);
        }
        $fields[] = 'start_date = ?';
        $values[] = $nextStartDate;
    }

    if (array_key_exists('endDate', $data)) {
        $nextEndDate = normalizeOptionalTimestamp($data['endDate']);
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
    $stmt = $pdo->prepare('UPDATE medications SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($values);

    $stmt = $pdo->prepare('SELECT * FROM medications WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(mapMedication($stmt->fetch()));
}

if ($method === 'DELETE' && $id) {
    if (!loadScopedMedication($pdo, $id, (int)$user['id'], $farmId)) {
        jsonResponse(['error' => 'Medikation nicht gefunden'], 404);
    }

    $stmt = $pdo->prepare('DELETE FROM medications WHERE id = ?');
    $stmt->execute([$id]);

    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Invalid request'], 400);

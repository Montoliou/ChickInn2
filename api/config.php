<?php
// ── Database Configuration ──────────────────────────────────────────
// Update these values with your IONOS MySQL credentials
$DB_HOST = 'db5017495755.hosting-data.io';
$DB_NAME = 'dbs14aborw';
$DB_USER = 'dbu3488186';
$DB_PASS = ''; // Set in production

// ── App Settings ────────────────────────────────────────────────────
$UPLOAD_DIR = __DIR__ . '/uploads/';
$UPLOAD_URL = '/chickinn/api/uploads/';
$TOKEN_EXPIRY_DAYS = 90;

// ── CORS & Headers ──────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:5173', 'https://montolio.de'];
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Database Connection ─────────────────────────────────────────────
try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// ── Auth Helper ─────────────────────────────────────────────────────
function getAuthUser(PDO $pdo): ?array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) return null;

    $token = $m[1];
    $stmt = $pdo->prepare('
        SELECT u.id, u.email, u.display_name
        FROM users u
        JOIN auth_tokens t ON t.user_id = u.id
        WHERE t.token = ? AND t.expires_at > NOW()
    ');
    $stmt->execute([$token]);
    return $stmt->fetch() ?: null;
}

function requireAuth(PDO $pdo): array {
    $user = getAuthUser($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    return $user;
}

// ── JSON Helper ─────────────────────────────────────────────────────
function jsonInput(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function jsonResponse(mixed $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

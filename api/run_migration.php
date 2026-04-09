<?php
require_once __DIR__ . '/config.php';
if (($_GET['key'] ?? '') !== 'chickinn2026migrate') { http_response_code(403); echo "Forbidden"; exit; }
$sql = file_get_contents(__DIR__ . '/migrate_fix.sql');
$lines = explode("\n", $sql);
$cleaned = [];
foreach ($lines as $line) { $t = trim($line); if ($t === '' || str_starts_with($t, '--')) continue; $cleaned[] = $line; }
$sql = implode("\n", $cleaned);
$statements = array_filter(array_map('trim', explode(';', $sql)));
$results = [];
foreach ($statements as $stmt) {
    if (empty($stmt)) continue;
    try { $pdo->exec($stmt); $results[] = "OK: " . substr($stmt, 0, 80); }
    catch (PDOException $e) { $results[] = "ERR: " . $e->getMessage(); }
}
header('Content-Type: text/plain');
echo implode("\n", $results) . "\nDone.";

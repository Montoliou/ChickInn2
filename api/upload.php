<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

if (!isset($_FILES['photo'])) {
    jsonResponse(['error' => 'Kein Foto hochgeladen'], 400);
}

$file = $_FILES['photo'];
$maxSize = 10 * 1024 * 1024; // 10 MB

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['error' => 'Upload fehlgeschlagen'], 400);
}

if ($file['size'] > $maxSize) {
    jsonResponse(['error' => 'Datei zu groß (max. 10 MB)'], 400);
}

// Validate image type
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedTypes)) {
    jsonResponse(['error' => 'Nur JPG, PNG oder WebP erlaubt'], 400);
}

// Create uploads directory if needed
$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$ext = match ($mimeType) {
    'image/png' => 'png',
    'image/webp' => 'webp',
    default => 'jpg',
};
$filename = $user['id'] . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
$destination = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    jsonResponse(['error' => 'Speichern fehlgeschlagen'], 500);
}

// Return the URL path for the uploaded file
$url = $GLOBALS['UPLOAD_URL'] . $filename;

jsonResponse(['url' => $url], 201);

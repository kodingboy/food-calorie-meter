<?php
/**
 * Food Calorie Meter - API Health Check Endpoint
 * 
 * This endpoint returns the current status of the API and its dependencies.
 */

require_once 'config.php';

header('Content-Type: application/json');

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array('*', ALLOWED_ORIGINS) || in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$status = [
    'status' => 'healthy',
    'timestamp' => date('c'),
    'version' => '1.0.0',
    'services' => [
        'api' => 'operational',
        'cache' => is_dir(CACHE_DIR) && is_writable(CACHE_DIR) ? 'operational' : 'error',
        'usda_api' => 'unknown'
    ],
    'config' => [
        'cache_enabled' => CACHE_ENABLED,
        'rate_limit' => MAX_REQUESTS_PER_HOUR . ' requests/hour'
    ]
];

// Test USDA API connectivity
$testUrl = USDA_API_BASE_URL . '/foods/search?query=apple&pageSize=1&api_key=' . USDA_API_KEY;
$ch = curl_init($testUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_NOBODY => true
]);

curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $status['services']['usda_api'] = 'operational';
} else {
    $status['services']['usda_api'] = 'degraded';
    $status['status'] = 'degraded';
}

http_response_code(200);
echo json_encode($status);

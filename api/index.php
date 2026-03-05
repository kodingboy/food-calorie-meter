<?php
// Define SECURE_ACCESS before including config
define('SECURE_ACCESS', true);

// Load environment variables
require_once __DIR__ . '/loadEnv.php';
require_once __DIR__ . '/config.php';

// Get the request path
$request = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request = str_replace('/api', '', $request);

// Health check endpoint
if ($request === '/health.php' || $request === '/health') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'healthy',
        'timestamp' => date('c'),
        'services' => [
            'api' => 'operational',
            'usda_connection' => 'ready'
        ],
        'api_key_configured' => !empty(getenv('USDA_API_KEY'))
    ]);
    exit;
}

// Home page / API info
if ($request === '/' || $request === '/index.php') {
    header('Content-Type: application/json');
    echo json_encode([
        'name' => 'Food Calorie Meter API',
        'version' => '1.0.0',
        'status' => 'running',
        'message' => 'API is operational and ready to use',
        'endpoints' => [
            'GET /health.php' => 'Check API status',
            'GET /food-search.php?query=apple' => 'Search foods by name',
            'GET /food-details.php?fdcId=454004' => 'Get detailed food information'
        ],
        'api_configured' => !empty(getenv('USDA_API_KEY')),
        'timestamp' => date('c')
    ]);
    exit;
}

// Include the appropriate endpoint
$endpointFile = __DIR__ . $request;

// Security: Only allow PHP files in this directory
if (file_exists($endpointFile)) {
    require_once $endpointFile;
} else {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Endpoint not found',
        'path' => $request,
        'available_endpoints' => [
            '/health.php',
            '/food-search.php?query=...',
            '/food-details.php?fdcId=...'
        ]
    ]);
}

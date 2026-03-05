<?php
/**
 * Food Calorie Meter - API Configuration
 * 
 * This file contains configuration settings for the USDA FoodData Central API.
 * The API key should be stored securely and not exposed to the frontend.
 */

// Load environment variables from .env file
require_once __DIR__ . '/loadEnv.php';

// Prevent direct access to this file
if (!defined('SECURE_ACCESS')) {
    define('SECURE_ACCESS', true);
}

// USDA FoodData Central API Configuration
// Get your free API key from: https://fdc.nal.usda.gov/api-key-signup.html
define('USDA_API_KEY', getenv('USDA_API_KEY') ?: 'DEMO_KEY');
define('USDA_API_BASE_URL', getenv('API_BASE_URL') ?: 'https://api.nal.usda.gov/fdc/v1');

// Rate limiting configuration (matches USDA API limits)
define('MAX_REQUESTS_PER_HOUR', (int)getenv('MAX_REQUESTS_PER_HOUR') ?: 1000);
define('RATE_LIMIT_WINDOW', 3600); // 1 hour in seconds

// Caching configuration
define('CACHE_ENABLED', getenv('CACHE_ENABLED') === 'true');
define('CACHE_DURATION', (int)getenv('CACHE_DURATION') ?: 3600); // 1 hour cache
define('CACHE_DIR', __DIR__ . '/cache');

// CORS configuration for frontend access
$allowedOrigins = getenv('ALLOWED_ORIGINS') ?: 'http://localhost:5173,http://localhost:3000,*';
define('ALLOWED_ORIGINS', array_map('trim', explode(',', $allowedOrigins)));

// Error logging
define('LOG_ERRORS', getenv('LOG_ERRORS') === 'true');
define('ERROR_LOG_FILE', __DIR__ . '/logs/error.log');

// Create necessary directories
if (!is_dir(CACHE_DIR)) {
    mkdir(CACHE_DIR, 0755, true);
}

if (!is_dir(dirname(ERROR_LOG_FILE))) {
    mkdir(dirname(ERROR_LOG_FILE), 0755, true);
}

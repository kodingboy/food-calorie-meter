<?php
/**
 * Food Calorie Meter - Food Search API Endpoint
 * 
 * This endpoint handles food search requests from the frontend,
 * queries the USDA FoodData Central API, and returns formatted results.
 */

require_once 'config.php';

// Set headers for CORS and JSON response
header('Content-Type: application/json');

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array('*', ALLOWED_ORIGINS) || in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept GET or POST requests
if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST'])) {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

/**
 * Log errors to file
 */
function logError($message) {
    if (LOG_ERRORS) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message" . PHP_EOL;
        error_log($logMessage, 3, ERROR_LOG_FILE);
    }
}

/**
 * Get cache file path for a query
 */
function getCacheFile($query) {
    $hash = md5($query);
    return CACHE_DIR . '/search_' . $hash . '.json';
}

/**
 * Get cached response if available and not expired
 */
function getCachedResponse($query) {
    if (!CACHE_ENABLED) return null;
    
    $cacheFile = getCacheFile($query);
    if (file_exists($cacheFile)) {
        $age = time() - filemtime($cacheFile);
        if ($age < CACHE_DURATION) {
            $cached = file_get_contents($cacheFile);
            if ($cached !== false) {
                return json_decode($cached, true);
            }
        }
    }
    return null;
}

/**
 * Save response to cache
 */
function cacheResponse($query, $response) {
    if (!CACHE_ENABLED) return;
    
    $cacheFile = getCacheFile($query);
    file_put_contents($cacheFile, json_encode($response));
}

/**
 * Validate and sanitize search query
 */
function validateQuery($query) {
    $query = trim($query);
    $query = htmlspecialchars($query, ENT_QUOTES, 'UTF-8');
    
    if (empty($query)) {
        return ['valid' => false, 'error' => 'Search query cannot be empty'];
    }
    
    if (strlen($query) > 200) {
        return ['valid' => false, 'error' => 'Search query too long (max 200 characters)'];
    }
    
    return ['valid' => true, 'query' => $query];
}

/**
 * Search foods using USDA FoodData Central API
 */
function searchFoods($query, $pageSize = 25, $pageNumber = 1) {
    $cacheKey = $query . '_' . $pageSize . '_' . $pageNumber;
    
    // Check cache first
    $cached = getCachedResponse($cacheKey);
    if ($cached !== null) {
        return ['success' => true, 'data' => $cached, 'cached' => true];
    }
    
    // Build API URL
    $url = USDA_API_BASE_URL . '/foods/search';
    $params = [
        'query' => $query,
        'pageSize' => min(max($pageSize, 1), 50), // Limit between 1-50
        'pageNumber' => max($pageNumber, 1),
        'api_key' => USDA_API_KEY,
        'dataType' => 'Foundation,SR%20Legacy,Branded',
        'sortBy' => 'dataType.keyword',
        'sortOrder' => 'asc'
    ];
    
    $url .= '?' . http_build_query($params);
    
    // Make API request
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/json'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        logError("cURL Error: $curlError");
        return ['success' => false, 'error' => 'Failed to connect to nutrition database'];
    }
    
    if ($httpCode !== 200) {
        logError("HTTP Error $httpCode: $response");
        return ['success' => false, 'error' => 'Nutrition database temporarily unavailable'];
    }
    
    $data = json_decode($response, true);
    if ($data === null) {
        logError("JSON Parse Error: " . json_last_error_msg());
        return ['success' => false, 'error' => 'Invalid response from nutrition database'];
    }
    
    // Format and cache the response
    cacheResponse($cacheKey, $data);
    
    return ['success' => true, 'data' => $data, 'cached' => false];
}

/**
 * Format food data for frontend display
 */
function formatFoodData($apiResponse) {
    if (!isset($apiResponse['foods']) || empty($apiResponse['foods'])) {
        return ['foods' => [], 'totalHits' => 0];
    }
    
    $formattedFoods = [];
    
    foreach ($apiResponse['foods'] as $food) {
        $formattedFood = [
            'fdcId' => $food['fdcId'] ?? null,
            'description' => $food['description'] ?? 'Unknown Food',
            'dataType' => $food['dataType'] ?? 'Unknown',
            'brandOwner' => $food['brandOwner'] ?? null,
            'ingredients' => $food['ingredients'] ?? null,
            'servingSize' => $food['servingSize'] ?? null,
            'servingSizeUnit' => $food['servingSizeUnit'] ?? null,
            'foodNutrients' => []
        ];
        
        // Extract key nutrients
        if (isset($food['foodNutrients']) && is_array($food['foodNutrients'])) {
            $nutrientMap = [
                1008 => 'calories',      // Energy (kcal)
                1003 => 'protein',       // Protein (g)
                1004 => 'fat',           // Total lipid (fat) (g)
                1005 => 'carbs',         // Carbohydrate (g)
                1051 => 'water',         // Water (g)
                1079 => 'fiber',         // Fiber (g)
                2000 => 'sugars',        // Sugars (g)
                1093 => 'sodium',        // Sodium (mg)
                1089 => 'iron',          // Iron (mg)
                1095 => 'zinc',          // Zinc (mg)
                1162 => 'vitaminC',      // Vitamin C (mg)
                1104 => 'vitaminA',      // Vitamin A (IU)
                1109 => 'vitaminE',      // Vitamin E (mg)
                1178 => 'vitaminB12',    // Vitamin B12 (mcg)
                1098 => 'calcium',       // Calcium (mg)
                1092 => 'potassium',     // Potassium (mg)
                1091 => 'phosphorus',    // Phosphorus (mg)
                1107 => 'carotene',      // Carotene (mcg)
            ];
            
            foreach ($food['foodNutrients'] as $nutrient) {
                $nutrientId = $nutrient['nutrientId'] ?? $nutrient['nutrient']['id'] ?? null;
                $value = $nutrient['value'] ?? $nutrient['amount'] ?? 0;
                $unit = $nutrient['unitName'] ?? $nutrient['nutrient']['unitName'] ?? '';
                
                if ($nutrientId && isset($nutrientMap[$nutrientId])) {
                    $key = $nutrientMap[$nutrientId];
                    $formattedFood['foodNutrients'][$key] = [
                        'value' => round($value, 2),
                        'unit' => $unit
                    ];
                }
            }
        }
        
        $formattedFoods[] = $formattedFood;
    }
    
    return [
        'foods' => $formattedFoods,
        'totalHits' => $apiResponse['totalHits'] ?? count($formattedFoods),
        'currentPage' => $apiResponse['currentPage'] ?? 1,
        'totalPages' => $apiResponse['totalPages'] ?? 1
    ];
}

// Main execution
try {
    // Get search query from request
    $query = '';
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $query = $_GET['q'] ?? $_GET['query'] ?? '';
        $pageSize = intval($_GET['pageSize'] ?? 25);
        $pageNumber = intval($_GET['pageNumber'] ?? 1);
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $query = $input['q'] ?? $input['query'] ?? '';
        $pageSize = intval($input['pageSize'] ?? 25);
        $pageNumber = intval($input['pageNumber'] ?? 1);
    }
    
    // Validate query
    $validation = validateQuery($query);
    if (!$validation['valid']) {
        http_response_code(400);
        echo json_encode(['error' => $validation['error']]);
        exit;
    }
    
    // Search for foods
    $result = searchFoods($validation['query'], $pageSize, $pageNumber);
    
    if (!$result['success']) {
        http_response_code(500);
        echo json_encode(['error' => $result['error']]);
        exit;
    }
    
    // Format and return results
    $formattedData = formatFoodData($result['data']);
    
    echo json_encode([
        'success' => true,
        'data' => $formattedData,
        'cached' => $result['cached'] ?? false,
        'query' => $validation['query']
    ]);
    
} catch (Exception $e) {
    logError("Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred']);
}

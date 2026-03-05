<?php
/**
 * Food Calorie Meter - Food Details API Endpoint
 * 
 * This endpoint retrieves detailed nutritional information for a specific food item
 * using its FDC ID from the USDA FoodData Central API.
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
 * Get cache file path for a food ID
 */
function getCacheFile($fdcId) {
    return CACHE_DIR . '/food_' . intval($fdcId) . '.json';
}

/**
 * Get cached response if available and not expired
 */
function getCachedResponse($fdcId) {
    if (!CACHE_ENABLED) return null;
    
    $cacheFile = getCacheFile($fdcId);
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
function cacheResponse($fdcId, $response) {
    if (!CACHE_ENABLED) return;
    
    $cacheFile = getCacheFile($fdcId);
    file_put_contents($cacheFile, json_encode($response));
}

/**
 * Validate FDC ID
 */
function validateFdcId($fdcId) {
    $fdcId = intval($fdcId);
    
    if ($fdcId <= 0) {
        return ['valid' => false, 'error' => 'Invalid food ID'];
    }
    
    return ['valid' => true, 'fdcId' => $fdcId];
}

/**
 * Get food details from USDA FoodData Central API
 */
function getFoodDetails($fdcId) {
    // Check cache first
    $cached = getCachedResponse($fdcId);
    if ($cached !== null) {
        return ['success' => true, 'data' => $cached, 'cached' => true];
    }
    
    // Build API URL
    $url = USDA_API_BASE_URL . '/food/' . $fdcId;
    $params = ['api_key' => USDA_API_KEY];
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
    
    if ($httpCode === 404) {
        return ['success' => false, 'error' => 'Food not found'];
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
    cacheResponse($fdcId, $data);
    
    return ['success' => true, 'data' => $data, 'cached' => false];
}

/**
 * Format detailed food data for frontend display
 */
function formatDetailedFoodData($apiResponse) {
    $food = $apiResponse;
    
    $formattedFood = [
        'fdcId' => $food['fdcId'] ?? null,
        'description' => $food['description'] ?? 'Unknown Food',
        'dataType' => $food['dataType'] ?? 'Unknown',
        'publicationDate' => $food['publicationDate'] ?? null,
        'brandOwner' => $food['brandOwner'] ?? null,
        'brandName' => $food['brandName'] ?? null,
        'subbrandName' => $food['subbrandName'] ?? null,
        'ingredients' => $food['ingredients'] ?? null,
        'servingSize' => $food['servingSize'] ?? null,
        'servingSizeUnit' => $food['servingSizeUnit'] ?? null,
        'householdServingFullText' => $food['householdServingFullText'] ?? null,
        'foodCategory' => $food['foodCategory'] ?? null,
        'foodCategoryDescription' => $food['foodCategoryDescription'] ?? null,
        'labelNutrients' => $food['labelNutrients'] ?? null,
        'foodNutrients' => [],
        'nutrientsByCategory' => [
            'macronutrients' => [],
            'vitamins' => [],
            'minerals' => [],
            'other' => []
        ]
    ];
    
    // Nutrient ID to key mapping with categories
    $nutrientDefinitions = [
        // Macronutrients
        1008 => ['key' => 'calories', 'name' => 'Calories', 'category' => 'macronutrients'],
        1003 => ['key' => 'protein', 'name' => 'Protein', 'category' => 'macronutrients'],
        1004 => ['key' => 'fat', 'name' => 'Total Fat', 'category' => 'macronutrients'],
        1005 => ['key' => 'carbs', 'name' => 'Carbohydrates', 'category' => 'macronutrients'],
        1051 => ['key' => 'water', 'name' => 'Water', 'category' => 'macronutrients'],
        1079 => ['key' => 'fiber', 'name' => 'Dietary Fiber', 'category' => 'macronutrients'],
        2000 => ['key' => 'sugars', 'name' => 'Sugars', 'category' => 'macronutrients'],
        1258 => ['key' => 'saturatedFat', 'name' => 'Saturated Fat', 'category' => 'macronutrients'],
        1257 => ['key' => 'transFat', 'name' => 'Trans Fat', 'category' => 'macronutrients'],
        1253 => ['key' => 'cholesterol', 'name' => 'Cholesterol', 'category' => 'macronutrients'],
        
        // Vitamins
        1162 => ['key' => 'vitaminC', 'name' => 'Vitamin C', 'category' => 'vitamins'],
        1104 => ['key' => 'vitaminA', 'name' => 'Vitamin A', 'category' => 'vitamins'],
        1109 => ['key' => 'vitaminE', 'name' => 'Vitamin E', 'category' => 'vitamins'],
        1178 => ['key' => 'vitaminB12', 'name' => 'Vitamin B12', 'category' => 'vitamins'],
        1175 => ['key' => 'vitaminB6', 'name' => 'Vitamin B6', 'category' => 'vitamins'],
        1167 => ['key' => 'thiamin', 'name' => 'Thiamin (B1)', 'category' => 'vitamins'],
        1166 => ['key' => 'riboflavin', 'name' => 'Riboflavin (B2)', 'category' => 'vitamins'],
        1177 => ['key' => 'niacin', 'name' => 'Niacin (B3)', 'category' => 'vitamins'],
        1176 => ['key' => 'folate', 'name' => 'Folate', 'category' => 'vitamins'],
        1186 => ['key' => 'vitaminK', 'name' => 'Vitamin K', 'category' => 'vitamins'],
        1114 => ['key' => 'vitaminD', 'name' => 'Vitamin D', 'category' => 'vitamins'],
        
        // Minerals
        1093 => ['key' => 'sodium', 'name' => 'Sodium', 'category' => 'minerals'],
        1089 => ['key' => 'iron', 'name' => 'Iron', 'category' => 'minerals'],
        1095 => ['key' => 'zinc', 'name' => 'Zinc', 'category' => 'minerals'],
        1098 => ['key' => 'calcium', 'name' => 'Calcium', 'category' => 'minerals'],
        1092 => ['key' => 'potassium', 'name' => 'Potassium', 'category' => 'minerals'],
        1091 => ['key' => 'phosphorus', 'name' => 'Phosphorus', 'category' => 'minerals'],
        1100 => ['key' => 'iodine', 'name' => 'Iodine', 'category' => 'minerals'],
        1090 => ['key' => 'magnesium', 'name' => 'Magnesium', 'category' => 'minerals'],
        1103 => ['key' => 'selenium', 'name' => 'Selenium', 'category' => 'minerals'],
        1096 => ['key' => 'copper', 'name' => 'Copper', 'category' => 'minerals'],
        1094 => ['key' => 'manganese', 'name' => 'Manganese', 'category' => 'minerals'],
        
        // Other
        1107 => ['key' => 'carotene', 'name' => 'Carotene', 'category' => 'other'],
        1120 => ['key' => 'caffeine', 'name' => 'Caffeine', 'category' => 'other'],
        1057 => ['key' => 'ash', 'name' => 'Ash', 'category' => 'other'],
        1050 => ['key' => 'nitrogen', 'name' => 'Nitrogen', 'category' => 'other'],
    ];
    
    // Extract nutrients
    if (isset($food['foodNutrients']) && is_array($food['foodNutrients'])) {
        foreach ($food['foodNutrients'] as $nutrient) {
            $nutrientId = $nutrient['nutrient']['id'] ?? $nutrient['nutrientId'] ?? null;
            $value = $nutrient['amount'] ?? $nutrient['value'] ?? 0;
            $unit = $nutrient['nutrient']['unitName'] ?? $nutrient['unitName'] ?? '';
            $name = $nutrient['nutrient']['name'] ?? $nutrient['nutrientName'] ?? 'Unknown';
            
            if ($nutrientId && isset($nutrientDefinitions[$nutrientId])) {
                $def = $nutrientDefinitions[$nutrientId];
                $nutrientData = [
                    'value' => round($value, 2),
                    'unit' => $unit,
                    'name' => $def['name']
                ];
                
                $formattedFood['foodNutrients'][$def['key']] = $nutrientData;
                $formattedFood['nutrientsByCategory'][$def['category']][$def['key']] = $nutrientData;
            } else {
                // Add to other category if not in definitions
                $key = 'nutrient_' . $nutrientId;
                $nutrientData = [
                    'value' => round($value, 2),
                    'unit' => $unit,
                    'name' => $name
                ];
                $formattedFood['foodNutrients'][$key] = $nutrientData;
            }
        }
    }
    
    return $formattedFood;
}

// Main execution
try {
    // Get FDC ID from request
    $fdcId = '';
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $fdcId = $_GET['id'] ?? '';
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $fdcId = $input['id'] ?? '';
    }
    
    // Validate FDC ID
    $validation = validateFdcId($fdcId);
    if (!$validation['valid']) {
        http_response_code(400);
        echo json_encode(['error' => $validation['error']]);
        exit;
    }
    
    // Get food details
    $result = getFoodDetails($validation['fdcId']);
    
    if (!$result['success']) {
        if (strpos($result['error'], 'not found') !== false) {
            http_response_code(404);
        } else {
            http_response_code(500);
        }
        echo json_encode(['error' => $result['error']]);
        exit;
    }
    
    // Format and return results
    $formattedData = formatDetailedFoodData($result['data']);
    
    echo json_encode([
        'success' => true,
        'data' => $formattedData,
        'cached' => $result['cached'] ?? false
    ]);
    
} catch (Exception $e) {
    logError("Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred']);
}

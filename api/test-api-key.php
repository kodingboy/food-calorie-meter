<?php
/**
 * Test USDA API Key
 * This script tests if your API key is valid and working
 */

// Load environment variables
require_once __DIR__ . '/loadEnv.php';

// Get API key and base URL from environment
$apiKey = getenv('USDA_API_KEY');
$apiBaseUrl = getenv('API_BASE_URL') ?: 'https://api.nal.usda.gov/fdc/v1';

echo "=== Testing USDA API Key ===\n\n";
echo "API Key: " . substr($apiKey, 0, 10) . "..." . substr($apiKey, -4) . "\n";
echo "API Base URL: $apiBaseUrl\n\n";

// Test endpoint: Search for "apple"
$searchQuery = 'apple';
$url = $apiBaseUrl . '/foods/search?query=' . urlencode($searchQuery) . '&pageSize=1&api_key=' . $apiKey;

echo "Testing API with search query: '$searchQuery'\n";
echo "URL: " . str_replace($apiKey, 'HIDDEN_API_KEY', $url) . "\n\n";

// Make the request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Status Code: $httpCode\n";

if ($error) {
    echo "❌ Network Error: $error\n";
    exit(1);
}

$data = json_decode($response, true);

if ($httpCode === 200) {
    echo "\n✅ API Key is VALID!\n\n";
    echo "Search Results:\n";
    echo "- Total Results Found: " . ($data['totalHits'] ?? 0) . "\n";
    
    if (!empty($data['foods'])) {
        $food = $data['foods'][0];
        echo "- First Result: " . $food['description'] . "\n";
        echo "- FDC ID: " . $food['fdcId'] . "\n";
    }
} else {
    echo "\n❌ API Key TEST FAILED!\n\n";
    echo "Response:\n";
    
    if (isset($data['error'])) {
        echo "Error: " . $data['error']['message'] . "\n";
    } elseif (isset($data['errors'])) {
        foreach ($data['errors'] as $err) {
            echo "Error: " . $err['message'] . "\n";
        }
    } else {
        echo $response . "\n";
    }
    
    echo "\nPossible reasons:\n";
    echo "- Invalid API key\n";
    echo "- API key quota exceeded\n";
    echo "- Network connectivity issue\n";
    exit(1);
}

<?php
// Load environment to get ALLOWED_ORIGINS
require_once __DIR__ . '/loadEnv.php';
require_once __DIR__ . '/config.php';

echo "=== API CORS Configuration ===\n\n";
echo "ALLOWED_ORIGINS:\n";
print_r(ALLOWED_ORIGINS);

echo "\n\nTest URL: http://localhost:8000/food-search.php?query=apple\n";

// Make a test request with Origin header
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/food-search.php?query=apple');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Origin: http://localhost:5173'
]);

$response = curl_exec($ch);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

echo "\n=== Response Headers ===\n";
foreach (explode("\r\n", $headers) as $line) {
    if (strpos($line, 'Access-Control') !== false || strpos($line, 'HTTP') !== false) {
        echo $line . "\n";
    }
}

echo "\n=== Response Status ===\n";
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP Code: " . $httpCode . "\n";

if ($httpCode === 200) {
    $data = json_decode($body);
    if (isset($data->data->totalHits)) {
        echo "✅ API responding correctly with data\n";
        echo "Results: " . $data->data->totalHits . " foods found\n";
    }
} else {
    echo "❌ API returned error\n";
    echo "Response: " . substr($body, 0, 200) . "\n";
}

curl_close($ch);

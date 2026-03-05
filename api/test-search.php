<?php
// Test food search endpoint
$response = file_get_contents('http://localhost:8000/food-search.php?query=apple');
$data = json_decode($response);

echo "=== Food Search Test ===\n\n";

if (!isset($data->data->totalHits)) {
    echo "Response:\n";
    echo $response . "\n";
    exit;
}

echo "Query: apple\n";
echo "Results Found: " . $data->data->totalHits . "\n";

if (!empty($data->data->foods)) {
    echo "\nFirst 3 Results:\n";
    for ($i = 0; $i < min(3, count($data->data->foods)); $i++) {
        $food = $data->data->foods[$i];
        echo ($i + 1) . ". " . $food->description . "\n";
        echo "   FDC ID: " . $food->fdcId . "\n";
        if (isset($food->foodNutrients->calories)) {
            echo "   Calories: " . $food->foodNutrients->calories->value . " " . $food->foodNutrients->calories->unit . "\n";
        }
        echo "\n";
    }
}

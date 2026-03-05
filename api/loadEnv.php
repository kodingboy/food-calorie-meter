<?php
/**
 * Load environment variables from .env file
 */

function loadEnv($filePath) {
    if (!file_exists($filePath)) {
        throw new Exception("Environment file not found: " . $filePath);
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Remove quotes if present
            if ((strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)) {
                $value = substr($value, 1, -1);
            }

            // Set as environment variable and in $_ENV
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

// Load .env file from parent directory
loadEnv(dirname(__DIR__) . '/.env');

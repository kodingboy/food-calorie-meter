# Food Calorie Meter - Setup Guide

## Overview

This application consists of:
1. **Frontend**: React + TypeScript + Tailwind CSS (built to `dist/` folder)
2. **Backend**: PHP API proxy for USDA FoodData Central (in `api/` folder)

## Current Demo Mode

The deployed application is running in **Demo Mode** with mock data. To connect to the real USDA FoodData Central API, you need to set up the PHP backend.

## Step 1: Get USDA API Key

1. Visit [USDA FoodData Central API Key Signup](https://fdc.nal.usda.gov/api-key-signup.html)
2. Register with your email
3. Check your email for the API key
4. Save the API key for the next step

## Step 2: Configure PHP Backend

1. Open `api/config.php` in a text editor
2. Replace `DEMO_KEY` with your actual API key:

```php
define('USDA_API_KEY', 'YOUR_ACTUAL_API_KEY_HERE');
```

3. Save the file

## Step 3: Deploy PHP Backend

### Option A: Shared Hosting (cPanel, etc.)

1. Upload the entire `api/` folder to your web server
2. Ensure the folder is accessible via HTTPS
3. The `.htaccess` file will handle URL rewriting and CORS

### Option B: VPS/Dedicated Server (Apache)

1. Install Apache with PHP and cURL:
```bash
sudo apt update
sudo apt install apache2 php libapache2-mod-php php-curl
```

2. Enable required Apache modules:
```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod deflate
sudo systemctl restart apache2
```

3. Upload the `api/` folder to your web root (e.g., `/var/www/html/api/`)

4. Set proper permissions:
```bash
sudo chown -R www-data:www-data /var/www/html/api
sudo chmod -R 755 /var/www/html/api
sudo mkdir -p /var/www/html/api/cache
sudo chmod 755 /var/www/html/api/cache
```

### Option C: PHP Development Server (Local Testing)

```bash
cd api
php -S localhost:8000
```

## Step 4: Update Frontend Configuration

1. Open `src/App.tsx`
2. Change the `USE_MOCK_API` constant to `false`:

```typescript
const USE_MOCK_API = false; // Use real PHP backend
```

3. Rebuild the frontend:
```bash
npm run build
```

## Step 5: Deploy Frontend

Upload the contents of the `dist/` folder to your web server.

### Important: Configure CORS

If your frontend and backend are on different domains, update `api/config.php`:

```php
define('ALLOWED_ORIGINS', [
    'https://your-frontend-domain.com',
    'https://www.your-frontend-domain.com'
]);
```

## Step 6: Test the Integration

1. Visit your deployed frontend
2. The "Demo Mode" badge should disappear
3. Try searching for "apple" - you should see real results from USDA

## API Endpoints

Once deployed, the following endpoints are available:

| Endpoint | Description | Example |
|----------|-------------|---------|
| `/api/food-search.php?q={query}` | Search foods | `/api/food-search.php?q=apple` |
| `/api/food-details.php?id={fdcId}` | Get food details | `/api/food-details.php?id=171688` |
| `/api/health.php` | Health check | `/api/health.php` |

## Troubleshooting

### "API Error" or "Failed to connect"

1. Check that your API key is correct in `config.php`
2. Verify PHP cURL extension is installed: `php -m | grep curl`
3. Check Apache error logs: `sudo tail -f /var/log/apache2/error.log`

### CORS Errors

1. Update `ALLOWED_ORIGINS` in `config.php` with your frontend domain
2. Ensure the `.htaccess` file is present in the `api/` folder
3. Check that `mod_headers` is enabled in Apache

### Permission Denied

```bash
sudo chown -R www-data:www-data /path/to/api
sudo chmod -R 755 /path/to/api
sudo chmod 755 /path/to/api/cache
```

## Security Considerations

1. **Never commit your API key** to version control
2. Use environment variables or a separate config file outside web root
3. Enable HTTPS for both frontend and backend
4. Consider implementing rate limiting at the server level
5. Regularly update PHP and Apache to latest versions

## Performance Optimization

The PHP backend includes:
- Response caching (1 hour default)
- Gzip compression
- Rate limiting (1000 requests/hour)
- Input validation

To clear the cache:
```bash
rm -rf api/cache/*.json
```

## Switching Back to Demo Mode

If you need to test without the backend:

1. Set `USE_MOCK_API = true` in `src/App.tsx`
2. Rebuild: `npm run build`
3. Redeploy the `dist/` folder

## Support

For issues with:
- **Frontend**: Check browser console for errors
- **Backend**: Check Apache/PHP error logs
- **USDA API**: Visit [FoodData Central Support](https://fdc.nal.usda.gov/contact.html)

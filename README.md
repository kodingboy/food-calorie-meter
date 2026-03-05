# Food Calorie Meter

A modern, responsive web application for measuring the caloric content and nutritional information of various foods. Built with React, Tailwind CSS, and PHP, integrating the USDA FoodData Central API.

![Food Calorie Meter](screenshot.png)

## Features

- **Comprehensive Food Search**: Search over 300,000 foods from the USDA FoodData Central database
- **Detailed Nutrition Facts**: View calories, macronutrients, vitamins, and minerals
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Fast Performance**: Client-side caching and optimized API requests
- **Secure API Handling**: PHP backend proxy keeps API keys secure
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- shadcn/ui components
- Lucide React icons
- Vite build tool

### Backend
- PHP 7.4+ with cURL support
- USDA FoodData Central API integration
- Server-side caching
- CORS handling
- Input validation and error handling

## Project Structure

```
├── api/                    # PHP backend API
│   ├── config.php         # API configuration
│   ├── food-search.php    # Food search endpoint
│   ├── food-details.php   # Food details endpoint
│   ├── health.php         # Health check endpoint
│   ├── .htaccess          # Apache configuration
│   └── cache/             # Cache directory
├── src/
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript definitions
│   ├── App.tsx            # Main application
│   ├── App.css            # Custom styles
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html             # HTML entry point
├── package.json           # Node.js dependencies
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## Installation

### Prerequisites
- Node.js 18+ and npm
- PHP 7.4+ with cURL extension
- Apache or Nginx web server
- USDA FoodData Central API key (free)

### Step 1: Get USDA API Key
1. Visit [USDA FoodData Central API Key Signup](https://fdc.nal.usda.gov/api-key-signup.html)
2. Register for a free API key
3. Copy your API key

### Step 2: Clone and Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/food-calorie-meter.git
cd food-calorie-meter

# Install frontend dependencies
npm install

# Configure API key
cp api/config.php api/config.php.bak
# Edit api/config.php and replace 'DEMO_KEY' with your actual API key
```

### Step 3: Configure PHP Backend
Edit `api/config.php`:
```php
define('USDA_API_KEY', 'YOUR_ACTUAL_API_KEY_HERE');
```

### Step 4: Build Frontend
```bash
npm run build
```

### Step 5: Deploy
1. Upload all files to your web server
2. Ensure the `api/cache/` directory is writable by PHP
3. Configure your web server to serve the `dist/` folder for frontend requests
4. Ensure PHP files in `api/` are executable

## Development

### Start Development Server
```bash
npm run dev
```

### Start PHP Development Server (separate terminal)
```bash
cd api
php -S localhost:8000
```

### Configure Vite Proxy
For local development, add to `vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

## API Endpoints

### Search Foods
```
GET /api/food-search.php?q={query}&pageSize={size}&pageNumber={page}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "foods": [...],
    "totalHits": 100
  },
  "cached": false,
  "query": "apple"
}
```

### Get Food Details
```
GET /api/food-details.php?id={fdcId}
```

### Health Check
```
GET /api/health.php
```

## Configuration Options

### PHP Backend (`api/config.php`)

| Constant | Description | Default |
|----------|-------------|---------|
| `USDA_API_KEY` | Your USDA API key | DEMO_KEY |
| `MAX_REQUESTS_PER_HOUR` | Rate limit per IP | 1000 |
| `CACHE_ENABLED` | Enable response caching | true |
| `CACHE_DURATION` | Cache TTL in seconds | 3600 |
| `LOG_ERRORS` | Enable error logging | true |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL for API requests | /api |

## Security Features

- API keys stored server-side only
- Input validation and sanitization
- Rate limiting (1000 requests/hour per IP)
- CORS configuration
- Error logging (no sensitive data exposed)
- XSS protection via output encoding

## Performance Optimizations

- Server-side response caching
- Client-side state management
- Optimized API requests
- Lazy loading of food details
- Compressed responses (gzip)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [USDA FoodData Central](https://fdc.nal.usda.gov/) for providing the nutrition database
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/yourusername/food-calorie-meter/issues).

---

Built with ❤️ using React, Tailwind CSS, and PHP.

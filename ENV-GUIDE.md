# Environment Configuration Guide

Your application now supports both **server** and **local** environments with automatic fallback.

## How It Works:

### Priority System:
1. **Primary**: Server IP (192.168.185.91:3015)
2. **Fallback**: Localhost (localhost:3000)

## Configuration Files:

### 1. `.env` (Default - Server)
Used for deployed server environment
```
VITE_API_BASE_URL=http://192.168.185.91:3015
```

### 2. `.env.local` (Local Development)
Vite automatically uses this for local development (has highest priority locally)
```
VITE_API_BASE_URL=http://localhost:3000
```

### 3. `.env.production` (Production Build)
Used during production builds
```
VITE_API_BASE_URL=http://192.168.185.91:3015
```

## Usage Scenarios:

### Scenario 1: Deploying to Server
```bash
# Uses .env.production automatically
npm run build
# Deploys with server IP: http://192.168.185.91:3015
```

### Scenario 2: Local Development
```bash
# Vite automatically picks .env.local
npm run dev
# Uses localhost: http://localhost:3000
```

### Scenario 3: Testing Production Build Locally
```bash
# Create .env.local temporarily
echo "VITE_API_BASE_URL=http://localhost:3000" > .env.local
npm run build
npm run preview
```

## Smart Fallback:

The application also has automatic detection in `config/api.ts`:
- Checks current hostname
- If on 192.168.185.91 → uses server backend
- If on localhost → uses localhost backend
- Includes health check function for manual fallback logic

## Quick Switching:

### To Work Locally:
1. Create/update `.env.local`:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   ```
2. Start dev server: `npm run dev`

### To Work on Server:
1. Remove or rename `.env.local`
2. Build: `npm run build`
3. Deploy with Docker

## Important Notes:

- `.env.local` is **NOT committed** to git (add to .gitignore)
- Server deployment uses `.env.production`
- Docker deployment automatically uses server IP
- The config API provides fallback logic as safety net

## Verification:

Check which URL is being used:
```javascript
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
```

Current configuration:
- **Server URL**: http://192.168.185.91:3015 ✅
- **Local URL**: http://localhost:3000 ✅
- **Priority**: Server first, localhost fallback ✅

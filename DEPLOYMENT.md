# JoyEvents — PM2 Deployment Guide

This guide covers deploying the frontend and backend as **separate PM2 processes** on the same server.

## Architecture

- **Backend**: Node/Express API on port `5001`
- **Frontend**: Static React SPA served on port `8080`
- **PM2**: Process manager for both services
- **Nginx** (optional): Reverse proxy to serve both on port 80/443

---

## Prerequisites

1. **Node.js** v24+ and **npm** v10+
2. **PM2** installed globally: `npm install -g pm2`
3. **MongoDB** connection string
4. **SMTP** credentials (for emails)
5. **Cloudinary** account (for image uploads)

---

## First-Time Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo-url> JoyEvents
cd JoyEvents
```

### 2. Configure backend environment

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Set these **required** variables:

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your_random_secret_here_change_me
PORT=5001

FRONTEND_URL=http://YOUR_SERVER_IP:8080
# Or if using Nginx: https://yourdomain.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=YourApp <your-email@gmail.com>

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: restrict CORS to your domain
ALLOWED_ORIGINS=http://YOUR_SERVER_IP:8080
```

### 3. Configure frontend environment

```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

Set the backend API URL as seen from the **browser**:

```env
# If accessing directly by IP:
VITE_API_URL=http://YOUR_SERVER_IP:5001

# If using Nginx proxy on same domain:
VITE_API_URL=https://yourdomain.com
```

### 4. Run the deploy script

```bash
chmod +x deploy.sh
./deploy.sh
```

This will:
- Install dependencies
- Build the frontend
- Start both services with PM2

### 5. Persist PM2 across reboots

```bash
pm2 save
pm2 startup
# Follow the instructions printed by PM2
```

---

## Daily Operations

### View logs

```bash
pm2 logs                          # all logs
pm2 logs JoyEvents-backend      # backend only
pm2 logs JoyEvents-frontend     # frontend only
```

### Restart services

```bash
pm2 restart ecosystem.config.cjs  # restart both
pm2 restart JoyEvents-backend   # backend only
pm2 restart JoyEvents-frontend  # frontend only
```

### Stop services

```bash
pm2 stop ecosystem.config.cjs
```

### Check status

```bash
pm2 status
pm2 monit  # live monitoring
```

---

## Updating the Application

### Backend code changes

```bash
git pull
cd backend && npm install
pm2 restart JoyEvents-backend
```

### Frontend code changes

```bash
git pull
cd frontend && npm install && npm run build
pm2 restart JoyEvents-frontend
```

### Both

```bash
git pull
./deploy.sh
```

---

## Nginx Configuration (Optional but Recommended)

Serve both frontend and backend on the same domain with SSL:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend (React SPA)
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5001;
    }

    # Uploaded images
    location /uploads {
        proxy_pass http://localhost:5001;
    }
}
```

After adding Nginx, update your `.env` files:

```env
# backend/.env
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com

# frontend/.env
VITE_API_URL=https://yourdomain.com
```

Then rebuild and restart:

```bash
cd frontend && npm run build
pm2 restart ecosystem.config.cjs
```

---

## Troubleshooting

### Frontend shows blank page

- Check browser console for errors
- Verify `VITE_API_URL` in `frontend/.env` is correct
- Rebuild: `cd frontend && npm run build && pm2 restart JoyEvents-frontend`

### API calls fail with CORS errors

- Check `ALLOWED_ORIGINS` in `backend/.env`
- Ensure it matches the frontend URL exactly (including protocol)
- Restart backend: `pm2 restart JoyEvents-backend`

### PM2 processes crash on startup

- Check logs: `pm2 logs`
- Verify MongoDB connection: `MONGO_URI` in `backend/.env`
- Check port conflicts: `lsof -i :5001` and `lsof -i :8080`

### Page refresh returns 404

- Ensure using `serve -s` (the `-s` flag enables SPA mode)
- Check `ecosystem.config.cjs` has `args: "-s dist -l 8080"`
- Or use Nginx to proxy all non-API routes to the frontend

---

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `ALLOWED_ORIGINS` to your actual domain
- [ ] Use HTTPS (Nginx + Let's Encrypt)
- [ ] Keep MongoDB connection string secret
- [ ] Use environment-specific SMTP credentials
- [ ] Enable firewall (allow only 80, 443, 22)
- [ ] Run `pm2 save` after configuration
- [ ] Set up automated backups for MongoDB

---

## Support

For issues, check:
- PM2 logs: `pm2 logs`
- Backend logs: `backend/logs/`
- Frontend logs: `frontend/logs/`
- MongoDB connection
- Environment variables

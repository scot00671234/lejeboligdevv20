# Production Deployment Guide for Lejebolig Nu

## Pre-Deployment Checklist

### Environment Configuration
- [ ] Set `DATABASE_URL` (PostgreSQL connection string)
- [ ] Set `JWT_SECRET` (minimum 32 characters)
- [ ] Set `SESSION_SECRET` (minimum 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Set `ALLOWED_ORIGINS` (your domain URLs)

### Security Verification
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Helmet security headers enabled
- [ ] Password hashing with bcrypt
- [ ] JWT authentication implemented

## Coolify Deployment Steps

### 1. Repository Setup
```bash
# Push all code to your Git repository
git add .
git commit -m "Production ready deployment"
git push origin main
```

### 2. Coolify Project Configuration
- **Source**: Connect your Git repository
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: `5000`
- **Health Check**: `/health`

### 3. Environment Variables in Coolify
```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters
SESSION_SECRET=your-secure-session-secret-minimum-32-characters
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 4. Database Setup
After first deployment, run:
```bash
npm run db:push
```

## Manual Ubuntu VPS Deployment

### Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo apt-get install nginx
```

### Application Deployment
```bash
# Clone repository
git clone <your-repo-url>
cd lejebolig-nu

# Install dependencies
npm ci --only=production

# Set environment variables
cp .env.example .env
# Edit .env with your production values

# Build application
npm run build

# Deploy database schema
npm run db:push

# Start with PM2
pm2 start npm --name "lejebolig-nu" -- start
pm2 save
pm2 startup
```

### Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Docker Deployment

### Build and Run
```bash
# Build image
docker build -t lejebolig-nu .

# Run with environment variables
docker run -d \
  --name lejebolig-nu \
  -p 5000:5000 \
  -e DATABASE_URL=your_database_url \
  -e JWT_SECRET=your_jwt_secret \
  -e SESSION_SECRET=your_session_secret \
  -e NODE_ENV=production \
  lejebolig-nu
```

### Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Post-Deployment Verification

### Health Checks
- [ ] Visit `/health` endpoint - should return status OK
- [ ] Visit `/ready` endpoint - should return Ready
- [ ] Test user registration
- [ ] Test user login
- [ ] Test property creation (landlord)
- [ ] Test property search (tenant)
- [ ] Test messaging system
- [ ] Test favorites functionality

### Performance Tests
- [ ] Page load times under 3 seconds
- [ ] API response times under 500ms
- [ ] Database queries optimized
- [ ] Static assets properly cached

### Security Tests
- [ ] HTTPS enabled (if using custom domain)
- [ ] Rate limiting working
- [ ] CORS headers present
- [ ] Security headers present
- [ ] Authentication working
- [ ] Authorization working

## Monitoring

### Application Logs
```bash
# PM2 logs
pm2 logs lejebolig-nu

# Docker logs
docker logs lejebolig-nu

# System logs
sudo journalctl -u nginx
```

### Database Monitoring
```bash
# PostgreSQL status
sudo systemctl status postgresql

# Database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

## Backup Strategy

### Database Backup
```bash
# Create backup
pg_dump DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql DATABASE_URL < backup_file.sql
```

### Application Backup
```bash
# Backup application files
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/lejebolig-nu
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check PostgreSQL service status
   - Verify network connectivity

2. **JWT Token Errors**
   - Ensure JWT_SECRET is set and minimum 32 characters
   - Check token expiration settings

3. **Build Failures**
   - Verify Node.js version (20+)
   - Check npm dependencies
   - Review build logs

4. **Performance Issues**
   - Monitor database queries
   - Check memory usage
   - Review server logs

### Support Commands
```bash
# Check application status
curl http://localhost:5000/health

# Test database connection
npm run db:push

# View application logs
pm2 logs lejebolig-nu --lines 100

# Restart application
pm2 restart lejebolig-nu
```

## Scaling Considerations

### Load Balancing
- Use Nginx or HAProxy for load balancing
- Configure session affinity if needed
- Implement health checks

### Database Scaling
- Use read replicas for read-heavy workloads
- Implement connection pooling
- Consider database sharding for large datasets

### Caching
- Implement Redis for session storage
- Add CDN for static assets
- Use application-level caching

## Security Hardening

### Server Security
- Keep system updated
- Use fail2ban for intrusion prevention
- Configure firewall (UFW)
- Regular security audits

### Application Security
- Regular dependency updates
- Security headers validation
- Input validation and sanitization
- Regular security scans
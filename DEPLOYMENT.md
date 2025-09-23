# Badminton App Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- Docker and Docker Compose installed
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- Basic server with 2GB+ RAM and 20GB+ storage

## 📋 Deployment Options

### Option 1: DigitalOcean Droplet (Recommended)
**Cost: ~$25-40/month**

1. **Create Droplet**
   ```bash
   # Create a 2GB RAM droplet with Ubuntu 22.04
   # Add SSH key for secure access
   ```

2. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Install Nginx (for SSL termination)
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd BadmintonApp
   
   # Configure environment
   cp env.prod.example .env.production
   # Edit .env.production with your values
   
   # Deploy
   ./deploy.sh production deploy
   ```

### Option 2: Railway (Easiest)
**Cost: ~$15-25/month**

1. **Connect Repository**
   - Go to [Railway.app](https://railway.app)
   - Connect your GitHub repository
   - Add PostgreSQL service

2. **Configure Environment**
   - Set environment variables in Railway dashboard
   - Deploy automatically on git push

### Option 3: AWS/GCP (Enterprise)
**Cost: ~$30-60/month**

1. **ECS + RDS Setup**
   - Create ECS cluster
   - Set up RDS PostgreSQL instance
   - Configure Application Load Balancer
   - Use ECR for container registry

## 🔧 Configuration Steps

### 1. Environment Variables
Copy `env.prod.example` to `.env.production` and configure:

```bash
# Database
POSTGRES_DB=badminton_app_prod
POSTGRES_USER=badminton_user
POSTGRES_PASSWORD=your_secure_password

# Security
SECRET_KEY=your_very_secure_secret_key_minimum_32_characters
ENVIRONMENT=production

# Domain
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Domain Configuration
- Point your domain A record to your server IP
- Configure CNAME for www subdomain
- Wait for DNS propagation (up to 24 hours)

## 📱 PWA Deployment

### 1. Build Mobile App for Web
```bash
cd mobile
npm install
npm run web:build
```

### 2. Configure PWA Settings
Update `mobile/app.json`:
```json
{
  "expo": {
    "name": "Badminton App",
    "slug": "badminton-app",
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "platforms": ["ios", "android", "web"]
  }
}
```

### 3. Service Worker Configuration
The app will automatically generate a service worker for offline functionality.

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS only
- [ ] Configure firewall (UFW)
- [ ] Set up fail2ban
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs

### Firewall Setup
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

## 📊 Monitoring & Maintenance

### 1. Log Monitoring
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Backup Strategy
```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec badminton-app_db_1 pg_dump -U badminton_user badminton_app > backup_$DATE.sql
```

### 3. Performance Monitoring
- Monitor CPU and memory usage
- Set up alerts for downtime
- Regular performance testing

## 🚨 Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   docker-compose logs backend
   docker-compose logs db
   ```

2. **Database connection failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check network connectivity

3. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

4. **Performance issues**
   - Check resource usage: `docker stats`
   - Review nginx configuration
   - Optimize database queries

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer with multiple backend instances
- Implement Redis for session management
- Database read replicas for read-heavy workloads

### Vertical Scaling
- Increase server resources as needed
- Optimize database indexes
- Implement caching strategies

## 🔄 Updates & Maintenance

### Deploying Updates
```bash
git pull origin main
./deploy.sh production deploy
```

### Database Migrations
```bash
# Run Alembic migrations
docker-compose exec backend alembic upgrade head
```

### Regular Maintenance
- Weekly security updates
- Monthly backup testing
- Quarterly performance reviews

## 📞 Support

For deployment issues:
1. Check logs first
2. Verify environment configuration
3. Test locally with production settings
4. Review this guide for common solutions

---

**Next Steps:**
1. Choose your hosting provider
2. Set up your domain
3. Configure SSL certificate
4. Deploy and test
5. Set up monitoring and backups

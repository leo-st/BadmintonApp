# Security Checklist for Production Deployment

## 🔒 Pre-Deployment Security

### Environment Security
- [ ] **Strong Passwords**: Use complex passwords (minimum 16 characters)
- [ ] **Secret Keys**: Generate cryptographically secure SECRET_KEY
- [ ] **Database Credentials**: Use strong, unique database passwords
- [ ] **Environment Variables**: Never commit `.env` files to version control
- [ ] **CORS Configuration**: Restrict CORS origins to your domain only

### Server Security
- [ ] **Firewall**: Configure UFW or iptables
  ```bash
  sudo ufw enable
  sudo ufw allow ssh
  sudo ufw allow 80
  sudo ufw allow 443
  sudo ufw deny 8000  # Block direct backend access
  ```
- [ ] **SSH Security**: 
  - Disable root login
  - Use key-based authentication
  - Change default SSH port (optional)
- [ ] **Fail2ban**: Install and configure
  ```bash
  sudo apt install fail2ban
  sudo systemctl enable fail2ban
  ```
- [ ] **Automatic Updates**: Enable security updates
  ```bash
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```

## 🛡️ Application Security

### FastAPI Security
- [ ] **HTTPS Only**: Force HTTPS redirects
- [ ] **Security Headers**: Implement security middleware
- [ ] **Rate Limiting**: Configure request rate limits
- [ ] **Input Validation**: Validate all user inputs
- [ ] **SQL Injection Prevention**: Use parameterized queries
- [ ] **XSS Protection**: Sanitize user-generated content

### Authentication & Authorization
- [ ] **JWT Security**: Short token expiration times
- [ ] **Password Hashing**: Use bcrypt with salt rounds >= 12
- [ ] **Session Management**: Secure session handling
- [ ] **Role-Based Access**: Implement proper RBAC
- [ ] **API Endpoints**: Secure all API endpoints

### Database Security
- [ ] **Connection Encryption**: Use SSL/TLS for database connections
- [ ] **Database User**: Create dedicated database user with minimal privileges
- [ ] **Regular Backups**: Automated encrypted backups
- [ ] **Access Control**: Restrict database access to application only

## 🔐 SSL/TLS Configuration

### Certificate Management
- [ ] **Let's Encrypt**: Obtain SSL certificate
- [ ] **Auto-Renewal**: Set up automatic certificate renewal
- [ ] **Certificate Monitoring**: Monitor certificate expiration
- [ ] **HSTS**: Enable HTTP Strict Transport Security

### Nginx Security
- [ ] **SSL Configuration**: Use modern TLS protocols (1.2, 1.3)
- [ ] **Cipher Suites**: Configure strong cipher suites
- [ ] **Security Headers**: Add security headers
- [ ] **Hidden Server**: Hide nginx version

## 📊 Monitoring & Logging

### Log Management
- [ ] **Centralized Logging**: Set up log aggregation
- [ ] **Log Rotation**: Configure log rotation
- [ ] **Sensitive Data**: Ensure no sensitive data in logs
- [ ] **Access Logs**: Monitor access patterns

### Security Monitoring
- [ ] **Failed Login Attempts**: Monitor and alert
- [ ] **Suspicious Activity**: Set up anomaly detection
- [ ] **Resource Usage**: Monitor for unusual resource consumption
- [ ] **Uptime Monitoring**: Set up service monitoring

## 🚨 Incident Response

### Backup Strategy
- [ ] **Database Backups**: Daily automated backups
- [ ] **Application Backups**: Code and configuration backups
- [ ] **Backup Testing**: Regular backup restoration tests
- [ ] **Offsite Storage**: Store backups in separate location

### Recovery Plan
- [ ] **Disaster Recovery**: Document recovery procedures
- [ ] **Contact Information**: Maintain emergency contacts
- [ ] **Rollback Procedure**: Test rollback capabilities
- [ ] **Communication Plan**: Define incident communication

## 🔍 Regular Security Tasks

### Weekly
- [ ] Review access logs
- [ ] Check for failed login attempts
- [ ] Monitor resource usage
- [ ] Update security patches

### Monthly
- [ ] Review user permissions
- [ ] Test backup restoration
- [ ] Security audit of configurations
- [ ] Review and update documentation

### Quarterly
- [ ] Penetration testing
- [ ] Security training updates
- [ ] Review and update security policies
- [ ] Disaster recovery testing

## 🛠️ Security Tools

### Recommended Tools
- [ ] **Fail2ban**: Intrusion prevention
- [ ] **Lynis**: Security auditing
- [ ] **ClamAV**: Antivirus scanning
- [ ] **AIDE**: File integrity monitoring
- [ ] **OSSEC**: Host-based intrusion detection

### Installation Commands
```bash
# Install security tools
sudo apt install fail2ban lynis clamav aide

# Configure Lynis
sudo lynis audit system

# Configure AIDE
sudo aideinit
sudo cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

## 📋 Security Configuration Files

### Nginx Security Headers
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
```

### Docker Security
```dockerfile
# Run as non-root user
USER appuser

# Use specific versions
FROM python:3.11-slim

# Remove unnecessary packages
RUN apt-get clean && rm -rf /var/lib/apt/lists/*
```

## ✅ Final Security Checklist

Before going live:
- [ ] All environment variables configured
- [ ] SSL certificate installed and working
- [ ] Firewall configured and tested
- [ ] Database secured with strong credentials
- [ ] Backup system tested and working
- [ ] Monitoring and alerting configured
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] Logging configured and tested
- [ ] Incident response plan documented

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular reviews and updates are essential for maintaining a secure application.

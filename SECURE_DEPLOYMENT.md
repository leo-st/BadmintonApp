# 🔒 Secure Deployment Guide

## 🚨 **CRITICAL: Set Environment Variables First!**

Before deploying, you MUST set secure environment variables. Never use default passwords in production!

## 🔐 **Required Environment Variables**

### **For Railway Deployment:**

1. **Go to Railway Dashboard** → Your Project → Variables
2. **Add these variables:**

```
SECRET_KEY=your_very_secure_secret_key_minimum_32_characters
POSTGRES_PASSWORD=your_secure_database_password_8_chars_min
ENVIRONMENT=production
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

### **For Local Development:**

1. **Copy environment template:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file with secure values:**
   ```bash
   # Generate secure passwords
   POSTGRES_PASSWORD=your_secure_password_here
   SECRET_KEY=your_very_secure_secret_key_here_minimum_32_characters
   ```

## 🛡️ **Security Checklist**

### ✅ **Before Deployment:**
- [ ] **SECRET_KEY**: Minimum 32 characters, cryptographically secure
- [ ] **DATABASE_PASSWORD**: Minimum 8 characters, complex password
- [ ] **CORS_ORIGINS**: Only your actual domain(s)
- [ ] **ENVIRONMENT**: Set to "production"
- [ ] **No hardcoded passwords** in any files

### ✅ **Password Generation:**
```bash
# Generate secure SECRET_KEY (32+ characters)
openssl rand -base64 32

# Generate secure DATABASE_PASSWORD (8+ characters)
openssl rand -base64 12
```

## 🚀 **Secure Deployment Process**

### **1. Railway (Backend):**
```bash
# Set environment variables in Railway dashboard:
SECRET_KEY=your_generated_secret_key
POSTGRES_PASSWORD=your_generated_password
ENVIRONMENT=production
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

### **2. Vercel (Frontend):**
```bash
# Set environment variables in Vercel dashboard:
EXPO_PUBLIC_API_URL=https://your-railway-app.railway.app
```

## 🔍 **Security Validation**

The app will automatically validate security settings:

- **Production mode**: Requires SECRET_KEY and DATABASE_PASSWORD
- **Secret key**: Must be 32+ characters
- **Database password**: Must be 8+ characters
- **App will fail to start** if security requirements aren't met

## 📋 **Environment Variable Reference**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SECRET_KEY` | ✅ | JWT signing key (32+ chars) | `openssl rand -base64 32` |
| `POSTGRES_PASSWORD` | ✅ | Database password (8+ chars) | `openssl rand -base64 12` |
| `ENVIRONMENT` | ✅ | Environment mode | `production` |
| `CORS_ORIGINS` | ✅ | Allowed origins | `https://yourdomain.com` |
| `POSTGRES_DB` | ⚪ | Database name | `badminton_app` |
| `POSTGRES_USER` | ⚪ | Database user | `badminton_user` |

## 🚨 **Common Security Mistakes**

### ❌ **DON'T:**
- Use default passwords like "password123"
- Hardcode credentials in source code
- Use short or simple passwords
- Allow CORS from "*" in production
- Commit `.env` files to git

### ✅ **DO:**
- Generate cryptographically secure passwords
- Use environment variables for all secrets
- Set strong, unique passwords
- Restrict CORS to your actual domains
- Use `.env.example` for templates

## 🔧 **Testing Security**

### **Local Testing:**
```bash
# Test with secure environment
cp env.example .env
# Edit .env with secure values
docker-compose -f docker-compose.simple.yml up
```

### **Production Testing:**
```bash
# Check that app starts with security validation
# App should fail if SECRET_KEY or DATABASE_PASSWORD are missing/weak
```

## 📞 **Need Help?**

If you see security validation errors:
1. Check that all required environment variables are set
2. Ensure passwords meet minimum length requirements
3. Verify you're not using default/example passwords
4. Check Railway/Vercel environment variable settings

---

**Remember**: Security is important even for hobby projects! 🛡️

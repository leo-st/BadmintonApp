# 🗄️ Railway Database Setup Guide

## 🚀 **Automatic Database Initialization (Recommended)**

Your Railway deployment will automatically initialize the database when it starts up using the `startup.py` script.

### **What happens automatically:**
1. **Database tables created** from your SQLAlchemy models
2. **Sample data inserted** (users, roles, permissions)
3. **FastAPI server starts** after successful initialization

### **Sample users created:**
- **alice** (password: password123) - ADMIN
- **bob** (password: password123) - USER  
- **charlie** (password: password123) - USER
- **diana** (password: password123) - USER

## 🔧 **Manual Database Initialization (If Needed)**

If automatic initialization fails, you can run it manually:

### **Method 1: Railway Console**
1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to "Console" tab
4. Run: `python railway_init.py`

### **Method 2: Local Connection**
```bash
# Connect to your Railway database locally
railway connect

# Run initialization
python railway_init.py
```

## 🔍 **Verify Database Setup**

### **Check if database is initialized:**
1. **Visit your Railway URL**: `https://your-app.railway.app/health`
2. **Check API docs**: `https://your-app.railway.app/docs`
3. **Test login**: Use sample credentials (alice/password123)

### **Database structure created:**
- ✅ **Users table** with sample users
- ✅ **Roles & Permissions** system
- ✅ **Matches table** for tracking scores
- ✅ **Tournaments table** for competitions
- ✅ **Access control** system

## 🛠️ **Troubleshooting**

### **If initialization fails:**

1. **Check Railway logs:**
   - Go to Railway dashboard → Your service → Logs
   - Look for initialization errors

2. **Verify environment variables:**
   ```
   DATABASE_URL=postgresql://...
   SECRET_KEY=your_secret_key
   ENVIRONMENT=production
   ```

3. **Test database connection:**
   ```bash
   # In Railway console
   python -c "from app.core.database import engine; print(engine.url)"
   ```

### **Common issues:**

- **Missing DATABASE_URL**: Railway should provide this automatically
- **Permission denied**: Check PostgreSQL service is running
- **Connection timeout**: Verify database service is healthy

## 📊 **Database Schema Overview**

Your database includes:

### **Core Tables:**
- `users` - User accounts and profiles
- `matches` - Badminton match records
- `tournaments` - Tournament information
- `medals` - Achievement system

### **Access Control:**
- `Role` - User roles (admin, user)
- `Permission` - System permissions
- `RolesPermissions` - Role-permission mappings

### **Relationships:**
- Users have roles and permissions
- Matches link to users (players)
- Tournaments can contain matches

## 🎯 **Next Steps**

After successful database initialization:

1. **Test your API**: Visit `/docs` endpoint
2. **Login with sample user**: alice/password123
3. **Create your own users**: Use the registration endpoint
4. **Start tracking matches**: Use the matches API

## 🔒 **Security Notes**

- **Change default passwords** after first login
- **Sample users** are for testing only
- **Production data** should be backed up regularly

---

**Your database will be automatically initialized when you deploy to Railway!** 🎉

# 🏸 Badminton App

A full-stack badminton match tracking application with **FastAPI backend** and **React Native mobile app**. Perfect for local groups of friends to track matches and tournaments!

## ✨ Features

- 🏓 **Match Tracking** - Record and verify match results
- 🏆 **Tournament Management** - Organize and track tournaments
- 👥 **User Management** - Register and manage players
- 📱 **Mobile App** - Native iOS/Android app with Expo
- 🔐 **Secure Authentication** - JWT with cookie-based auth
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 🧪 **Fully Tested** - Comprehensive test suite

## 🛠 Tech Stack

### Backend
- **FastAPI** (Python) - Modern, fast web framework
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - Python ORM
- **JWT + Cookies** - Secure authentication
- **Pydantic** - Data validation

### Mobile
- **React Native** - Cross-platform mobile development
- **Expo** - Easy development and deployment
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation library
- **React Native Paper** - Material Design components

### DevOps
- **Docker & Docker Compose** - Containerization
- **Poetry** - Python dependency management
- **Pytest** - Testing framework
- **Ruff** - Fast Python linter
- **MyPy** - Static type checking

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone and start**
   ```bash
   git clone <your-repo-url>
   cd BadmintonApp
   make up-detached
   ```

2. **Access the app**
   - API: http://localhost:8000/docs
   - Mobile: `cd mobile && npm start`

### Option 2: Local Development

1. **Backend setup**
   ```bash
   make init
   make test
   ```

2. **Mobile setup**
   ```bash
   cd mobile
   npm install
   npm start
   ```

## 📱 Mobile App Development

### On MacBook Pro (Recommended)
```bash
cd mobile
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

### On Linux with iPhone
```bash
cd mobile
npm start        # Scan QR code with Expo Go
```

## 🎯 Sample Accounts

| Username | Password | Role |
|----------|----------|------|
| alice    | password123 | Player |
| bob      | password123 | Player |
| charlie  | password123 | Player |
| diana    | password123 | Player |

## 📋 Available Commands

```bash
# Development
make init              # Install dependencies
make test              # Run all tests
make test-unit         # Unit tests only
make test-integration  # Integration tests only
make lint              # Code linting

# Docker
make up                # Start services
make up-detached       # Start in background
make down              # Stop services
make logs              # View logs
make restart           # Restart services

# Mobile
cd mobile
npm start              # Start Expo dev server
npm run ios            # iOS Simulator (Mac only)
npm run android        # Android Emulator
npm run web            # Web browser
```

## 🏗 Project Structure

```
BadmintonApp/
├── 🐍 Backend (FastAPI)
│   ├── app/
│   │   ├── api/routers/     # API endpoints
│   │   ├── core/            # Core functionality
│   │   ├── models/          # Database models
│   │   └── schemas/         # Data validation
│   ├── db/postgres/         # Database scripts
│   └── tests/               # Test suite
│
├── 📱 Mobile (React Native)
│   ├── src/
│   │   ├── screens/         # App screens
│   │   ├── services/        # API services
│   │   ├── context/         # State management
│   │   └── types/           # TypeScript types
│   └── App.tsx              # Main app component
│
└── 🐳 Docker
    ├── Dockerfile.api       # Backend container
    ├── Dockerfile.postgres  # Database container
    └── docker-compose.yml   # Orchestration
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - Login (sets cookie)
- `POST /auth/logout` - Logout (clears cookie)
- `POST /auth/register` - Register new user

### Matches
- `GET /matches` - List matches (with filtering)
- `POST /matches` - Create match
- `POST /matches/{id}/verify` - Verify match

### Tournaments
- `GET /tournaments` - List tournaments
- `POST /tournaments` - Create tournament

## 🧪 Testing

```bash
# Run all tests
make test

# Specific test types
make test-unit         # Unit tests
make test-integration  # API tests

# With coverage
poetry run pytest --cov=app tests/
```

## 🚀 Deployment

### Development
```bash
make up-detached
```

### Production
```bash
# Update docker-compose.yml for production
# Set proper environment variables
# Deploy to your preferred cloud provider
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for badminton enthusiasts
- Perfect for local friend groups
- Ready for iOS development on MacBook Pro
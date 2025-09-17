# Badminton App

A badminton match tracking application for local groups of friends who play together and organize tournaments.

## Features

- **User Registration & Authentication**: Register new users and secure login
- **Match Tracking**: Submit match results with verification system
- **Match Types**: Separate casual matches from tournament matches
- **Tournament Management**: Create and manage tournaments
- **Match Verification**: Other player must verify match results
- **REST API**: FastAPI backend with automatic Swagger documentation

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL with custom initialization scripts
- **Authentication**: JWT tokens
- **Containerization**: Docker & Docker Compose
- **Dependency Management**: Poetry
- **Architecture**: Clean separation with routers, models, schemas, and core modules

## Project Structure

```
badminton-app/
├── app/
│   ├── api/
│   │   └── routers/          # API endpoint routers
│   │       ├── auth.py       # Authentication endpoints
│   │       ├── users.py      # User management endpoints
│   │       ├── matches.py    # Match management endpoints
│   │       └── tournaments.py # Tournament endpoints
│   ├── common/
│   │   └── enums.py          # Application enums
│   ├── core/
│   │   ├── auth.py           # Authentication logic
│   │   ├── config.py         # Configuration settings
│   │   └── database.py       # Database connection
│   ├── models/
│   │   └── models.py         # SQLAlchemy models
│   └── schemas/
│       └── schemas.py        # Pydantic schemas
├── db/
│   └── postgres/
│       └── init/             # Database initialization scripts
│           ├── 000_create_schema.sql
│           ├── 001_create_tables.sql
│           └── 002_load_sample_data.sql
├── main.py                   # FastAPI application entry point
├── init_db.py               # Database initialization script
├── docker-compose.yml       # Docker Compose configuration
├── docker-compose.local.yml # Development Docker Compose configuration
├── Dockerfile.api           # Backend Docker image
├── Dockerfile.postgres      # PostgreSQL Docker image
└── pyproject.toml          # Poetry dependencies
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Poetry (for local development)

### Using Docker Compose (Recommended)

1. Clone the repository
2. Run the application:
   ```bash
   docker-compose up --build
   ```

3. Access the API documentation at: http://localhost:8000/docs
4. Access the database at: localhost:5432

### Local Development

1. Install Poetry if you haven't already:
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Start PostgreSQL (using Docker):
   ```bash
   docker run --name badminton-postgres -e POSTGRES_DB=badminton_app -e POSTGRES_USER=badminton_user -e POSTGRES_PASSWORD=badminton_password -p 5432:5432 -d postgres:15
   ```

4. Run the application:
   ```bash
   poetry run uvicorn main:app --reload
   ```

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /token` - Login and get access token

### Users
- `GET /users/me` - Get current user info
- `GET /users` - List all users

### Matches
- `POST /matches` - Submit a new match result
- `GET /matches` - List matches (with filters)
- `GET /matches/{match_id}` - Get specific match
- `POST /matches/{match_id}/verify` - Verify a match result

### Tournaments
- `POST /tournaments` - Create a new tournament
- `GET /tournaments` - List tournaments
- `GET /tournaments/{tournament_id}` - Get specific tournament

## Database Schema

- **Users**: Store user information and authentication
- **Matches**: Track match results with verification status
- **Tournaments**: Manage tournament information
- **Match Types**: Casual vs Tournament matches
- **Verification System**: Pending → Verified/Rejected

## Development

### Testing

The project includes comprehensive unit and integration tests:

```bash
# Run all tests with coverage
make test

# Run only unit tests
make test-unit

# Run only integration tests
make test-integration

# Run linting
make lint

# Run type checking
make type-check
```

### Code Quality

- **Ruff**: Fast Python linter and formatter
- **MyPy**: Static type checking
- **Pytest**: Testing framework with coverage reporting

### Available Make Commands

```bash
make help              # Show all available commands
make init              # Install dependencies
make test              # Run tests with coverage
make lint              # Run code linting
make type-check         # Run type checking
make up                 # Start services
make down               # Stop services
make logs               # View logs
make clean              # Clean up containers and volumes
```

## Next Steps

- [ ] iOS app development (React Native/Flutter)
- [ ] Real-time notifications
- [ ] Statistics and leaderboards
- [ ] Tournament brackets
- [ ] Photo uploads for matches

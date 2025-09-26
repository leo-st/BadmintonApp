
from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # Database - Railway provides DATABASE_URL automatically
    database_url: str = "postgresql://localhost:5432/badminton_app"
    database_user: str = "badminton_user"
    database_password: str = ""
    database_host: str = "localhost"
    database_port: int = 5432
    database_name: str = "badminton_app"
    
    @property
    def full_database_url(self) -> str:
        """Construct the full database URL from components or use provided DATABASE_URL"""
        # If DATABASE_URL is provided (e.g., by Railway), use it directly
        if self.database_url and self.database_url != "postgresql://localhost:5432/badminton_app":
            return self.database_url
        # Otherwise, construct from components
        elif self.database_password:
            return f"postgresql://{self.database_user}:{self.database_password}@{self.database_host}:{self.database_port}/{self.database_name}"
        else:
            return self.database_url
    
    # Security
    secret_key: str = ""
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Environment
    environment: str = "development"
    
    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:19006"
    
    # File uploads
    max_upload_size: int = 10485760  # 10MB
    upload_path: str = "uploads"
    
    # Logging
    log_level: str = "INFO"
    
    # Email (optional)
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    
    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"
    
    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",")]
        return self.cors_origins
    
    def validate_security(self) -> None:
        """Validate that required security settings are present"""
        if self.is_production:
            if not self.secret_key or self.secret_key == "":
                raise ValueError("SECRET_KEY must be set in production environment")
            if len(self.secret_key) < 32:
                raise ValueError("SECRET_KEY must be at least 32 characters long")
            # Only validate database password if not using DATABASE_URL
            if not self.database_url or self.database_url == "postgresql://localhost:5432/badminton_app":
                if not self.database_password or self.database_password == "":
                    raise ValueError("DATABASE_PASSWORD must be set in production environment")
                if len(self.database_password) < 8:
                    raise ValueError("DATABASE_PASSWORD must be at least 8 characters long")

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

# Validate security settings on import
settings.validate_security()

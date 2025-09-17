
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://badminton_user:badminton_password@localhost:5432/badminton_app"
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"

settings = Settings()

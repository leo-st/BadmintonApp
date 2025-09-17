"""Test configuration that overrides the main config for testing."""
from pydantic_settings import BaseSettings


class TestSettings(BaseSettings):
    database_url: str = "sqlite:///:memory:"
    secret_key: str = "test-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env.test"

test_settings = TestSettings()

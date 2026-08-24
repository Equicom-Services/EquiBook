from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    BACKEND_HOST: str
    BACKEND_PORT: int

    FRONTEND_URL: str

    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_FROM_EMAIL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
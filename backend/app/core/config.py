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

    # ------------------------------------------------------------------
    # EXTERNAL EMPLOYEE DIRECTORY (read-only, another host)
    #
    # Powers the name/email autocomplete in the booking forms. Optional:
    # leave EMPLOYEE_DIRECTORY_URL empty and the autocomplete simply
    # returns no suggestions.
    # ------------------------------------------------------------------

    EMPLOYEE_DIRECTORY_URL: str = ""
    EMPLOYEE_DIRECTORY_TABLE: str = "employees"
    EMPLOYEE_DIRECTORY_NAME_COLUMN: str = "employee_name"
    EMPLOYEE_DIRECTORY_EMAIL_COLUMN: str = "email"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://holland:holland@localhost:5432/holland"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24 * 30
    upload_dir: str = "/data/uploads"
    htpasswd_file: str = "/etc/holland/htpasswd"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VehiSense IQ API"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://vehisense:vehisense@localhost:5432/vehisense"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    cors_origin_regex: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]
        if "*" in origins and self.app_env.lower() not in {"dev", "development", "local"}:
            raise ValueError("Wildcard CORS origins are not allowed outside development. Set CORS_ORIGINS to your Vercel URL.")
        return origins


settings = Settings()

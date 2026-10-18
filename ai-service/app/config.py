import os

class Config:
    INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN", "internal_secret_token_12345")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin123")
    S3_BUCKET = os.getenv("S3_BUCKET", "sabycut-media")
    PORT = int(os.getenv("PORT", 5000))

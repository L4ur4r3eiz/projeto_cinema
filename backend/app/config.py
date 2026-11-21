import os
from pathlib import Path


def database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("Defina DATABASE_URL (veja backend/.env.example).")
    return url


# Em produção (HTTPS) defina COOKIE_SECURE=1; em desenvolvimento local o cookie precisa funcionar em http.
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "0") == "1"
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", Path(__file__).resolve().parent.parent / "uploads"))
SESSION_DAYS = 7

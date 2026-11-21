# Senhas com argon2 e sessões por token aleatório guardado só como hash (CONTEXTO.md, 2.2).
import hashlib
import re
import secrets
from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Response

from .config import COOKIE_SECURE, SESSION_DAYS

_hasher = PasswordHasher()
_HASH_FALSO = _hasher.hash("senha-que-ninguem-usa")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def hash_senha(senha: str) -> str:
    return _hasher.hash(senha)


def senha_confere(hash_salvo: str | None, senha: str) -> bool:
    # sem conta, confere contra um hash falso: a resposta leva o mesmo tempo e não revela se o e-mail existe
    try:
        return _hasher.verify(hash_salvo or _HASH_FALSO, senha) and hash_salvo is not None
    except (VerificationError, InvalidHashError):
        return False


def novo_token() -> tuple[str, str]:
    token = secrets.token_urlsafe(32)
    return token, hash_token(token)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def expira_em() -> datetime:
    return datetime.now(UTC) + timedelta(days=SESSION_DAYS)


def em_utc(data: datetime) -> datetime:
    # SQLite devolve datas sem fuso; o PostgreSQL devolve com fuso
    return data if data.tzinfo else data.replace(tzinfo=UTC)


def gravar_cookie(resposta: Response, nome: str, token: str) -> None:
    resposta.set_cookie(nome, token, max_age=SESSION_DAYS * 86400, httponly=True, samesite="lax",
                        secure=COOKIE_SECURE, path="/")


def apagar_cookie(resposta: Response, nome: str) -> None:
    resposta.delete_cookie(nome, path="/", httponly=True, samesite="lax", secure=COOKIE_SECURE)


def limpar_email(valor: object) -> str:
    return valor.strip().lower() if isinstance(valor, str) else ""


def limpar_texto(valor: object, maximo: int = 200) -> str:
    return valor.strip()[:maximo] if isinstance(valor, str) else ""

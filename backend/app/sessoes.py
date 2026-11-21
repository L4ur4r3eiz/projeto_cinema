# Quem está logado: conta da plataforma (cookie "sessao") ou administrador (cookie "sessao_admin").
from datetime import UTC, datetime

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as Db

from .db import get_db
from .models import Admin, Session, User
from .seguranca import em_utc, hash_token

COOKIE_USUARIO = "sessao"
COOKIE_ADMIN = "sessao_admin"


def _sessao(db: Db, token: str | None) -> Session | None:
    if not token:
        return None
    sessao = db.scalar(select(Session).where(Session.token_hash == hash_token(token)))
    if sessao and em_utc(sessao.expires_at) <= datetime.now(UTC):
        db.delete(sessao)
        db.commit()
        return None
    return sessao


def usuario_atual(db: Db = Depends(get_db), sessao: str | None = Cookie(None)) -> User | None:
    s = _sessao(db, sessao)
    return s.user if s else None


def admin_atual(db: Db = Depends(get_db), sessao_admin: str | None = Cookie(None)) -> Admin | None:
    s = _sessao(db, sessao_admin)
    return s.admin if s else None


def exigir_usuario(usuario: User | None = Depends(usuario_atual)) -> User:
    if not usuario:
        raise HTTPException(401, "Entre novamente para continuar.")
    return usuario


def exigir_operador(usuario: User | None = Depends(usuario_atual),
                    admin: Admin | None = Depends(admin_atual)) -> User | Admin:
    # mesma regra do Payload (isProjectStaff): conta com papel "staff" ou administrador
    if usuario and usuario.role == "staff":
        return usuario
    if admin:
        return admin
    raise HTTPException(403, "Acesso restrito à equipe.")


def exigir_admin(admin: Admin | None = Depends(admin_atual)) -> Admin:
    if not admin:
        raise HTTPException(403, "Acesso restrito aos administradores.")
    return admin

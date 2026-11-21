# Cria o primeiro administrador (no Payload ele era criado na primeira visita ao /admin).
# Uso: uv run python -m app.cli criar-admin admin@exemplo.com
import sys
from getpass import getpass

from sqlalchemy import select

from .db import _sessionmaker
from .models import Admin
from .seguranca import EMAIL_RE, hash_senha, limpar_email


def criar_admin(email: str) -> None:
    email = limpar_email(email)
    if not EMAIL_RE.match(email):
        sys.exit("E-mail inválido.")
    senha = getpass("Senha (mínimo 8 caracteres): ")
    if len(senha) < 8 or senha != getpass("Repita a senha: "):
        sys.exit("A senha é curta demais ou as duas não conferem.")
    with _sessionmaker()() as db:
        if db.scalar(select(Admin).where(Admin.email == email)):
            sys.exit("Já existe um administrador com esse e-mail.")
        db.add(Admin(email=email, password_hash=hash_senha(senha)))
        db.commit()
    print(f"Administrador {email} criado.")


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] != "criar-admin":
        sys.exit("Uso: python -m app.cli criar-admin <email>")
    criar_admin(sys.argv[2])

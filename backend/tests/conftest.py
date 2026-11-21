import os
import tempfile

# antes de importar o app: as imagens dos testes vão para uma pasta temporária
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp(prefix="etec-uploads-")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models import Admin
from app.seguranca import hash_senha


@pytest.fixture
def db():
    # SQLite em memória: os testes não precisam do PostgreSQL rodando
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    fabrica = sessionmaker(engine, expire_on_commit=False)

    def _get_db():
        with fabrica() as sessao:
            yield sessao

    app.dependency_overrides[get_db] = _get_db
    yield fabrica
    app.dependency_overrides.clear()


@pytest.fixture
def cliente(db):
    return TestClient(app)


@pytest.fixture
def novo_cliente(db):
    # cada chamada é um navegador diferente (cookies separados)
    return lambda: TestClient(app)


@pytest.fixture
def admin(db):
    with db() as s:
        s.add(Admin(email="admin@etec.com", password_hash=hash_senha("senha-admin-1")))
        s.commit()
    return "admin@etec.com", "senha-admin-1"

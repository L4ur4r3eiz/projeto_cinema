from collections.abc import Iterator
from functools import cache

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import database_url


class Base(DeclarativeBase):
    pass


@cache
def _sessionmaker() -> sessionmaker[Session]:
    # criado sob demanda: importar o app não exige DATABASE_URL (os testes trocam o banco)
    return sessionmaker(create_engine(database_url()), expire_on_commit=False)


def get_db() -> Iterator[Session]:
    with _sessionmaker()() as db:
        yield db

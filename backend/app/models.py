# Tabelas equivalentes às coleções do Payload (users, admins, team-members, short-films, applications).
from datetime import UTC, datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def agora() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="audience")  # audience | staff
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    likes_short_films: Mapped[bool | None] = mapped_column(Boolean)
    wants_behind_the_scenes: Mapped[bool | None] = mapped_column(Boolean)
    interested_in_acting: Mapped[bool | None] = mapped_column(Boolean)
    interested_in_production: Mapped[bool | None] = mapped_column(Boolean)
    wants_project_news: Mapped[bool | None] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)

    __table_args__ = (CheckConstraint("role IN ('audience', 'staff')", name="ck_users_role"),)


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)  # sha256 do token; o token só existe no cookie
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    admin_id: Mapped[int | None] = mapped_column(ForeignKey("admins.id", ondelete="CASCADE"))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)

    user: Mapped[User | None] = relationship()
    admin: Mapped[Admin | None] = relationship()

    __table_args__ = (
        CheckConstraint("(user_id IS NULL) <> (admin_id IS NULL)", name="ck_sessions_um_dono"),
    )


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(100))
    bio: Mapped[str | None] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(255))
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)


class ShortFilm(Base):
    __tablename__ = "short_films"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(140))
    duration: Mapped[str] = mapped_column(String(30))
    genre: Mapped[str] = mapped_column(String(80))
    synopsis: Mapped[str | None] = mapped_column(Text)
    youtube_url: Mapped[str | None] = mapped_column(String(500))
    thumbnail_url: Mapped[str | None] = mapped_column(String(255))
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)


AREAS = ("roteiro", "direcao", "fotografia", "atuacao", "figurino", "cenografia", "maquiagem", "edicao-som", "producao")
STATUS = ("new", "contacted", "approved", "archived")


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254))
    phone: Mapped[str] = mapped_column(String(30))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    message: Mapped[str | None] = mapped_column(Text)
    area: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="new")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)

    user: Mapped[User | None] = relationship()

    __table_args__ = (
        CheckConstraint(f"area IN {AREAS}", name="ck_applications_area"),
        CheckConstraint(f"status IN {STATUS}", name="ck_applications_status"),
    )

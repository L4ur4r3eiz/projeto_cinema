# API do Etec em Cena. Substitui as Server Actions e as coleções do Payload do app Next.
# Toda resposta de ação segue o formato {ok, message} que as telas já usavam.
import re
import secrets
from datetime import datetime
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Request, Response, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as Db

from . import config, limite
from .db import get_db
from .models import AREAS, STATUS, Admin, Application, Session, ShortFilm, TeamMember, User
from .seguranca import (EMAIL_RE, apagar_cookie, em_utc, expira_em, gravar_cookie, hash_senha, hash_token,
                        limpar_email, limpar_texto, novo_token, senha_confere)
from .sessoes import (COOKIE_ADMIN, COOKIE_USUARIO, admin_atual, exigir_admin, exigir_operador, exigir_usuario,
                      usuario_atual)

app = FastAPI(title="Etec em Cena")
config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=config.UPLOAD_DIR), name="uploads")

PREFERENCIAS = {
    "likesShortFilms": "likes_short_films",
    "wantsBehindTheScenes": "wants_behind_the_scenes",
    "interestedInActing": "interested_in_acting",
    "interestedInProduction": "interested_in_production",
    "wantsProjectNews": "wants_project_news",
}
URL_UPLOAD = re.compile(r"^/uploads/[a-f0-9]{32}\.(png|jpg|webp)$")
LIMITE_UPLOAD = 5 * 1024 * 1024


def ok(message: str, **extra) -> dict:
    return {"ok": True, "message": message, **extra}


@app.exception_handler(HTTPException)
def _erro_http(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse({"ok": False, "message": exc.detail}, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
def _erro_validacao(_: Request, __: RequestValidationError) -> JSONResponse:
    return JSONResponse({"ok": False, "message": "Revise os campos e tente novamente."}, status_code=422)


# ---------- conversão para o JSON que as telas esperam ----------
def iso(data: datetime) -> str:
    return em_utc(data).isoformat().replace("+00:00", "Z")


def midia(url: str | None, alt: str) -> dict | None:
    return {"url": url, "alt": alt} if url else None


def json_usuario(u: User) -> dict:
    return {"id": str(u.id), "email": u.email, "role": u.role, "onboardingCompleted": u.onboarding_completed,
            "preferences": {chave: getattr(u, coluna) for chave, coluna in PREFERENCIAS.items()},
            "createdAt": iso(u.created_at)}


def json_integrante(m: TeamMember) -> dict:
    return {"id": str(m.id), "name": m.name, "role": m.role, "bio": m.bio, "photo": midia(m.photo_url, m.name),
            "order": m.order}


def json_curta(f: ShortFilm) -> dict:
    return {"id": str(f.id), "title": f.title, "duration": f.duration, "genre": f.genre, "synopsis": f.synopsis,
            "youtubeURL": f.youtube_url, "thumbnail": midia(f.thumbnail_url, f.title), "order": f.order}


def json_inscricao(a: Application) -> dict:
    return {"id": str(a.id), "fullName": a.full_name, "email": a.email, "phone": a.phone, "area": a.area,
            "status": a.status, "message": a.message, "user": json_usuario(a.user) if a.user else None,
            "createdAt": iso(a.created_at)}


def criar_sessao(db: Db, resposta: Response, cookie: str, *, user: User | None = None, admin: Admin | None = None):
    token, token_hash = novo_token()
    db.add(Session(token_hash=token_hash, user=user, admin=admin, expires_at=expira_em()))
    db.commit()
    gravar_cookie(resposta, cookie, token)


def encerrar_sessao(db: Db, request: Request, resposta: Response, cookie: str) -> None:
    token = request.cookies.get(cookie)
    if token:
        sessao = db.scalar(select(Session).where(Session.token_hash == hash_token(token)))
        if sessao:
            db.delete(sessao)
            db.commit()
    apagar_cookie(resposta, cookie)


# ---------- contas da plataforma ----------
class Credenciais(BaseModel):
    email: str
    password: str


@app.post("/api/auth/signup")
def cadastrar(dados: Credenciais, request: Request, resposta: Response, db: Db = Depends(get_db)):
    limite.contar(f"cadastro:{limite.ip_de(request)}", 10)
    email = limpar_email(dados.email)
    if not EMAIL_RE.match(email):
        raise HTTPException(400, "Informe um e-mail válido.")
    if len(dados.password) < 8:
        raise HTTPException(400, "A senha precisa ter pelo menos 8 caracteres.")
    usuario = User(email=email, password_hash=hash_senha(dados.password))
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Este e-mail já está em uso ou os dados são inválidos.")
    criar_sessao(db, resposta, COOKIE_USUARIO, user=usuario)
    return ok("Conta criada. Bem-vindo à sessão.")


@app.post("/api/auth/login")
def entrar(dados: Credenciais, request: Request, resposta: Response, db: Db = Depends(get_db)):
    email = limpar_email(dados.email)
    if not EMAIL_RE.match(email) or not dados.password:
        raise HTTPException(400, "Preencha e-mail e senha para entrar.")
    # por e-mail barra quem tenta adivinhar a senha de uma conta; por IP, quem varre várias contas
    limite.contar(f"login:{email}", 8)
    limite.contar(f"login-ip:{limite.ip_de(request)}", 30)
    usuario = db.scalar(select(User).where(User.email == email))
    if not senha_confere(usuario.password_hash if usuario else None, dados.password):
        raise HTTPException(401, "E-mail ou senha incorretos.")
    criar_sessao(db, resposta, COOKIE_USUARIO, user=usuario)
    return ok("Sessão iniciada.")


@app.post("/api/auth/logout")
def sair(request: Request, resposta: Response, db: Db = Depends(get_db)):
    encerrar_sessao(db, request, resposta, COOKIE_USUARIO)
    return ok("Sessão encerrada.")


@app.get("/api/auth/me")
def eu(usuario: User = Depends(exigir_usuario)):
    return json_usuario(usuario)


class Onboarding(BaseModel):
    answers: dict[str, bool]


@app.put("/api/me/onboarding")
def salvar_onboarding(dados: Onboarding, usuario: User = Depends(exigir_usuario), db: Db = Depends(get_db)):
    for chave, coluna in PREFERENCIAS.items():  # só as 5 perguntas conhecidas são gravadas
        setattr(usuario, coluna, bool(dados.answers.get(chave)))
    usuario.onboarding_completed = True
    db.commit()
    return ok("Experiência personalizada.")


# ---------- conteúdo público e inscrições ----------
@app.get("/api/content")
def conteudo(db: Db = Depends(get_db)):
    equipe = db.scalars(select(TeamMember).order_by(TeamMember.order, TeamMember.id).limit(20))
    curtas = db.scalars(select(ShortFilm).order_by(ShortFilm.order, ShortFilm.id).limit(20))
    return {"team": [json_integrante(m) for m in equipe], "films": [json_curta(f) for f in curtas]}


class Inscricao(BaseModel):
    fullName: str
    email: str
    phone: str
    area: str
    message: str = ""


@app.post("/api/applications")
def inscrever(dados: Inscricao, usuario: User | None = Depends(usuario_atual), db: Db = Depends(get_db)):
    nome, email = limpar_texto(dados.fullName, 120), limpar_email(dados.email)
    telefone, mensagem = limpar_texto(dados.phone, 30), limpar_texto(dados.message, 1000)
    if len(nome) < 3 or not EMAIL_RE.match(email) or len(telefone) < 8 or dados.area not in AREAS:
        raise HTTPException(400, "Revise os campos e tente novamente.")
    db.add(Application(full_name=nome, email=email, phone=telefone, area=dados.area, message=mensagem, user=usuario))
    db.commit()
    return ok("Inscrição recebida. A equipe entrará em contato.")


# ---------- painel da equipe (conta "staff" ou administrador) ----------
@app.get("/api/panel")
def painel(operador: User | Admin = Depends(exigir_operador), db: Db = Depends(get_db)):
    return {
        "operator": {"kind": "admin" if isinstance(operador, Admin) else "staff", "email": operador.email},
        "users": [json_usuario(u) for u in db.scalars(select(User).order_by(User.created_at.desc()).limit(200))],
        "applications": [json_inscricao(a) for a in
                         db.scalars(select(Application).order_by(Application.created_at.desc()).limit(200))],
        "team": [json_integrante(m) for m in db.scalars(select(TeamMember).order_by(TeamMember.order).limit(100))],
        "films": [json_curta(f) for f in db.scalars(select(ShortFilm).order_by(ShortFilm.order).limit(100))],
    }


def url_imagem(valor: str | None) -> str | None:
    # só aceita arquivos enviados por /api/uploads; vazio remove a imagem
    if not valor:
        return None
    if not URL_UPLOAD.match(valor):
        raise HTTPException(400, "Imagem inválida. Envie o arquivo pelo painel.")
    return valor


def apagar_upload(url: str | None) -> None:
    # só apaga arquivos com nome gerado pelo /api/uploads (o regex impede sair da pasta)
    if url and URL_UPLOAD.match(url):
        (config.UPLOAD_DIR / url.rsplit("/", 1)[1]).unlink(missing_ok=True)


class Integrante(BaseModel):
    name: str
    role: str
    bio: str = ""
    photoUrl: str | None = None


@app.post("/api/team-members")
@app.put("/api/team-members/{item_id}")
def salvar_integrante(dados: Integrante, item_id: int | None = None, _=Depends(exigir_operador),
                      db: Db = Depends(get_db)):
    nome, funcao = limpar_texto(dados.name, 100), limpar_texto(dados.role, 100)
    if not nome or not funcao:
        raise HTTPException(400, "Nome e função são obrigatórios.")
    membro = db.get(TeamMember, item_id) if item_id else TeamMember()
    if not membro:
        raise HTTPException(404, "Integrante não encontrado.")
    membro.name, membro.role, membro.bio = nome, funcao, limpar_texto(dados.bio, 500)
    antiga, membro.photo_url = membro.photo_url, url_imagem(dados.photoUrl)
    db.add(membro)
    db.commit()
    if antiga != membro.photo_url:
        apagar_upload(antiga)
    return ok("Integrante atualizado." if item_id else "Integrante adicionado.")


class Curta(BaseModel):
    title: str
    duration: str
    genre: str
    synopsis: str = ""
    youtubeURL: str = ""
    thumbnailUrl: str | None = None


@app.post("/api/short-films")
@app.put("/api/short-films/{item_id}")
def salvar_curta(dados: Curta, item_id: int | None = None, _=Depends(exigir_operador), db: Db = Depends(get_db)):
    titulo, duracao, genero = limpar_texto(dados.title, 140), limpar_texto(dados.duration, 30), limpar_texto(dados.genre, 80)
    if not titulo or not duracao or not genero:
        raise HTTPException(400, "Título, duração e gênero são obrigatórios.")
    curta = db.get(ShortFilm, item_id) if item_id else ShortFilm()
    if not curta:
        raise HTTPException(404, "Curta não encontrado.")
    curta.title, curta.duration, curta.genre = titulo, duracao, genero
    curta.synopsis, curta.youtube_url = limpar_texto(dados.synopsis, 500), limpar_texto(dados.youtubeURL, 500)
    antiga, curta.thumbnail_url = curta.thumbnail_url, url_imagem(dados.thumbnailUrl)
    db.add(curta)
    db.commit()
    if antiga != curta.thumbnail_url:
        apagar_upload(antiga)
    return ok("Curta atualizado." if item_id else "Curta adicionado.")


@app.delete("/api/{tipo}/{item_id}")
def remover(tipo: Literal["team-members", "short-films"], item_id: int, _=Depends(exigir_operador),
            db: Db = Depends(get_db)):
    item = db.get(TeamMember if tipo == "team-members" else ShortFilm, item_id)
    if not item:
        raise HTTPException(404, "Item não encontrado.")
    imagem = item.photo_url if isinstance(item, TeamMember) else item.thumbnail_url
    db.delete(item)
    db.commit()
    apagar_upload(imagem)
    return ok("Item removido.")


class NovoStatus(BaseModel):
    status: str


@app.patch("/api/applications/{item_id}/status")
def mudar_status(item_id: int, dados: NovoStatus, _=Depends(exigir_operador), db: Db = Depends(get_db)):
    inscricao = db.get(Application, item_id)
    if not inscricao:
        raise HTTPException(404, "Inscrição não encontrada.")
    if dados.status not in STATUS:
        raise HTTPException(400, "Status inválido.")
    inscricao.status = dados.status
    db.commit()
    return ok("Status atualizado.")


@app.post("/api/uploads")
async def enviar_imagem(arquivo: UploadFile, _=Depends(exigir_operador)):
    conteudo = await arquivo.read(LIMITE_UPLOAD + 1)
    if len(conteudo) > LIMITE_UPLOAD:
        raise HTTPException(400, "A imagem pode ter no máximo 5 MB.")
    # o tipo vem dos primeiros bytes do arquivo, não do nome nem do que o navegador declarou
    if conteudo.startswith(b"\x89PNG\r\n\x1a\n"):
        extensao = "png"
    elif conteudo.startswith(b"\xff\xd8\xff"):
        extensao = "jpg"
    elif conteudo[:4] == b"RIFF" and conteudo[8:12] == b"WEBP":
        extensao = "webp"
    else:
        raise HTTPException(400, "Envie uma imagem PNG, JPG ou WEBP.")
    nome = f"{secrets.token_hex(16)}.{extensao}"
    (config.UPLOAD_DIR / nome).write_bytes(conteudo)
    return ok("Imagem enviada.", url=f"/uploads/{nome}")


# ---------- administradores (substituem o /admin do Payload) ----------
@app.post("/api/admin/login")
def admin_entrar(dados: Credenciais, request: Request, resposta: Response, db: Db = Depends(get_db)):
    limite.contar(f"admin:{limpar_email(dados.email)}", 8)
    limite.contar(f"admin-ip:{limite.ip_de(request)}", 30)
    admin = db.scalar(select(Admin).where(Admin.email == limpar_email(dados.email)))
    if not senha_confere(admin.password_hash if admin else None, dados.password):
        raise HTTPException(401, "E-mail ou senha incorretos.")
    criar_sessao(db, resposta, COOKIE_ADMIN, admin=admin)
    return ok("Sessão de administrador iniciada.")


@app.post("/api/admin/logout")
def admin_sair(request: Request, resposta: Response, db: Db = Depends(get_db)):
    encerrar_sessao(db, request, resposta, COOKIE_ADMIN)
    return ok("Sessão encerrada.")


@app.get("/api/admin/me")
def admin_eu(admin: Admin | None = Depends(admin_atual)):
    if not admin:
        raise HTTPException(401, "Entre como administrador.")
    return {"id": str(admin.id), "email": admin.email}


class NovoPapel(BaseModel):
    role: Literal["audience", "staff"]


@app.patch("/api/users/{item_id}/role")
def mudar_papel(item_id: int, dados: NovoPapel, _: Admin = Depends(exigir_admin), db: Db = Depends(get_db)):
    usuario = db.get(User, item_id)
    if not usuario:
        raise HTTPException(404, "Usuário não encontrado.")
    usuario.role = dados.role
    db.commit()
    return ok("Papel atualizado.")

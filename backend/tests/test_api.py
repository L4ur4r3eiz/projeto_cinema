from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.models import Session, User

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


def cadastrar(c, email="ana@etec.com", senha="senha-segura"):
    return c.post("/api/auth/signup", json={"email": email, "password": senha})


def virar_equipe(db, email):
    with db() as s:
        s.scalar(select(User).where(User.email == email)).role = "staff"
        s.commit()


def test_cadastro_cria_sessao_e_valida_campos(cliente):
    r = cadastrar(cliente, "  Ana@Etec.com ")
    assert r.json()["ok"] and "sessao" in r.cookies
    assert cliente.get("/api/auth/me").json()["email"] == "ana@etec.com"
    assert cadastrar(cliente, "ana@etec.com").status_code == 409
    assert cadastrar(cliente, "outra@etec.com", "curta").status_code == 400
    assert cadastrar(cliente, "sem-arroba", "senha-segura").status_code == 400


def test_login_mensagem_generica_e_logout(cliente, novo_cliente):
    cadastrar(cliente)
    outro = novo_cliente()
    errada = outro.post("/api/auth/login", json={"email": "ana@etec.com", "password": "errada123"})
    inexistente = outro.post("/api/auth/login", json={"email": "nao@etec.com", "password": "errada123"})
    assert errada.status_code == inexistente.status_code == 401
    assert errada.json()["message"] == inexistente.json()["message"]
    assert outro.post("/api/auth/login", json={"email": "ana@etec.com", "password": "senha-segura"}).json()["ok"]
    outro.post("/api/auth/logout")
    assert outro.get("/api/auth/me").status_code == 401


def test_sessao_vencida_nao_vale(cliente, db):
    cadastrar(cliente)
    with db() as s:
        s.scalar(select(Session)).expires_at = datetime.now(UTC) - timedelta(minutes=1)
        s.commit()
    assert cliente.get("/api/auth/me").status_code == 401


def test_onboarding_grava_so_as_cinco_respostas(cliente, novo_cliente):
    assert novo_cliente().put("/api/me/onboarding", json={"answers": {}}).status_code == 401
    cadastrar(cliente)
    r = cliente.put("/api/me/onboarding", json={"answers": {"likesShortFilms": True, "role": True}})
    assert r.json()["ok"]
    eu = cliente.get("/api/auth/me").json()
    assert eu["onboardingCompleted"] and eu["role"] == "audience"
    assert eu["preferences"]["likesShortFilms"] is True and eu["preferences"]["wantsProjectNews"] is False


def test_inscricao_valida_e_liga_ao_usuario(cliente, db, admin, novo_cliente):
    base = {"fullName": "Ana Souza", "email": "ana@etec.com", "phone": "11999998888", "area": "roteiro"}
    assert cliente.post("/api/applications", json={**base, "area": "hacker"}).status_code == 400
    assert cliente.post("/api/applications", json=base).json()["ok"]  # visitante sem conta
    cadastrar(cliente)
    cliente.post("/api/applications", json=base)
    adm = novo_cliente()
    adm.post("/api/admin/login", json={"email": admin[0], "password": admin[1]})
    inscricoes = adm.get("/api/panel").json()["applications"]
    assert sorted(bool(i["user"]) for i in inscricoes) == [False, True]
    assert all(i["status"] == "new" for i in inscricoes)


def test_painel_so_para_equipe_e_admin(cliente, db, admin, novo_cliente):
    assert novo_cliente().get("/api/panel").status_code == 403
    cadastrar(cliente)
    assert cliente.get("/api/panel").status_code == 403  # público
    virar_equipe(db, "ana@etec.com")
    assert cliente.get("/api/panel").json()["operator"]["kind"] == "staff"
    adm = novo_cliente()
    assert adm.post("/api/admin/login", json={"email": admin[0], "password": "errada"}).status_code == 401
    adm.post("/api/admin/login", json={"email": admin[0], "password": admin[1]})
    assert adm.get("/api/panel").json()["operator"]["kind"] == "admin"


def test_crud_curtas_integrantes_com_imagem(cliente, admin, novo_cliente):
    cadastrar(cliente)
    curta = {"title": "Sala 12", "duration": "11 min", "genre": "Terror"}
    assert cliente.post("/api/short-films", json=curta).status_code == 403
    adm = novo_cliente()
    adm.post("/api/admin/login", json={"email": admin[0], "password": admin[1]})
    assert adm.post("/api/uploads", files={"arquivo": ("x.png", b"<script>", "image/png")}).status_code == 400
    url = adm.post("/api/uploads", files={"arquivo": ("foto.png", PNG, "image/png")}).json()["url"]
    assert adm.get(url).content == PNG
    assert adm.post("/api/short-films", json={**curta, "thumbnailUrl": "https://outro.site/x.png"}).status_code == 400
    assert adm.post("/api/short-films", json={**curta, "thumbnailUrl": url}).json()["ok"]
    assert adm.post("/api/team-members", json={"name": "Laura", "role": "Direção", "photoUrl": url}).json()["ok"]
    conteudo = cliente.get("/api/content").json()
    film_id = conteudo["films"][0]["id"]
    assert conteudo["films"][0]["thumbnail"]["url"] == url and conteudo["team"][0]["photo"]["url"] == url
    assert adm.put(f"/api/short-films/{film_id}", json={**curta, "title": "Sala 13"}).json()["message"] == "Curta atualizado."
    assert cliente.get("/api/content").json()["films"][0]["title"] == "Sala 13"
    assert adm.delete(f"/api/short-films/{film_id}").json()["ok"]
    assert adm.delete(f"/api/short-films/{film_id}").status_code == 404
    assert cliente.get("/api/content").json()["films"] == []


def test_status_e_papel(cliente, db, admin, novo_cliente):
    cadastrar(cliente)
    cliente.post("/api/applications", json={"fullName": "Ana Souza", "email": "ana@etec.com",
                                            "phone": "11999998888", "area": "roteiro"})
    virar_equipe(db, "ana@etec.com")
    painel = cliente.get("/api/panel").json()
    inscricao, usuario = painel["applications"][0]["id"], painel["users"][0]["id"]
    assert cliente.patch(f"/api/applications/{inscricao}/status", json={"status": "aprovada"}).status_code == 400
    assert cliente.patch(f"/api/applications/{inscricao}/status", json={"status": "approved"}).json()["ok"]
    # mudar papel é só para administrador, nem a equipe pode
    assert cliente.patch(f"/api/users/{usuario}/role", json={"role": "audience"}).status_code == 403
    adm = novo_cliente()
    adm.post("/api/admin/login", json={"email": admin[0], "password": admin[1]})
    assert adm.patch(f"/api/users/{usuario}/role", json={"role": "audience"}).json()["ok"]
    assert cliente.get("/api/panel").status_code == 403

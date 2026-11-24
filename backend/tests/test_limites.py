from app import config
from tests.test_api import PNG, cadastrar


def test_login_trava_depois_de_muitas_tentativas_no_mesmo_email(cliente):
    cadastrar(cliente)
    for _ in range(8):
        r = cliente.post("/api/auth/login", json={"email": "ana@etec.com", "password": "errada123"})
        assert r.status_code == 401
    r = cliente.post("/api/auth/login", json={"email": "ana@etec.com", "password": "senha-segura"})
    assert r.status_code == 429
    assert r.json()["message"] == "Muitas tentativas. Aguarde alguns minutos e tente de novo."


def test_cadastro_trava_depois_de_muitas_contas_do_mesmo_ip(cliente):
    for i in range(10):
        assert cadastrar(cliente, f"aluno{i}@etec.com").status_code == 200
    assert cadastrar(cliente, "aluno10@etec.com").status_code == 429


def test_login_de_admin_tambem_trava(cliente, admin):
    for _ in range(8):
        assert cliente.post("/api/admin/login", json={"email": admin[0], "password": "errada"}).status_code == 401
    assert cliente.post("/api/admin/login", json={"email": admin[0], "password": admin[1]}).status_code == 429


def test_imagem_antiga_sai_do_disco_ao_trocar_e_ao_excluir(cliente, admin, novo_cliente):
    adm = novo_cliente()
    adm.post("/api/admin/login", json={"email": admin[0], "password": admin[1]})
    enviar = lambda: adm.post("/api/uploads", files={"arquivo": ("f.png", PNG, "image/png")}).json()["url"]
    no_disco = lambda url: (config.UPLOAD_DIR / url.rsplit("/", 1)[1]).exists()

    primeira, segunda = enviar(), enviar()
    adm.post("/api/team-members", json={"name": "Ana", "role": "Atriz", "photoUrl": primeira})
    membro = adm.get("/api/panel").json()["team"][0]["id"]
    adm.put(f"/api/team-members/{membro}", json={"name": "Ana", "role": "Atriz", "photoUrl": segunda})
    assert not no_disco(primeira) and no_disco(segunda)

    adm.delete(f"/api/team-members/{membro}")
    assert not no_disco(segunda)

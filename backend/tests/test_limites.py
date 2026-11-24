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


def test_quem_erra_a_senha_de_outra_pessoa_nao_trava_a_conta_dela(cliente, novo_cliente):
    cadastrar(cliente)
    atacante = novo_cliente()
    for _ in range(9):
        atacante.post("/api/auth/login", json={"email": "ana@etec.com", "password": "errada123"},
                      headers={"X-Real-IP": "203.0.113.9"})
    dona = novo_cliente()
    r = dona.post("/api/auth/login", json={"email": "ana@etec.com", "password": "senha-segura"},
                  headers={"X-Real-IP": "198.51.100.7"})
    assert r.status_code == 200


def test_conta_tem_teto_somando_todos_os_ips(cliente, novo_cliente):
    cadastrar(cliente)
    for i in range(40):
        novo_cliente().post("/api/auth/login", json={"email": "ana@etec.com", "password": "errada123"},
                            headers={"X-Real-IP": f"203.0.113.{i}"})
    r = novo_cliente().post("/api/auth/login", json={"email": "ana@etec.com", "password": "errada123"},
                            headers={"X-Real-IP": "198.51.100.200"})
    assert r.status_code == 429


def test_logins_certos_nao_contam_para_o_teto_da_conta(cliente, novo_cliente):
    cadastrar(cliente)
    for i in range(45):
        r = novo_cliente().post("/api/auth/login", json={"email": "ana@etec.com", "password": "senha-segura"},
                                headers={"X-Real-IP": f"203.0.113.{i}"})
        assert r.status_code == 200


def test_ipv6_conta_pelo_bloco_64():
    from starlette.requests import Request
    from app.limite import ip_de
    pedido = lambda ip: Request({"type": "http", "headers": [(b"x-real-ip", ip.encode())], "client": None})
    assert ip_de(pedido("2001:db8:1:2::a")) == ip_de(pedido("2001:db8:1:2:ffff::b"))
    assert ip_de(pedido("203.0.113.5")) == "203.0.113.5"


def test_ip_vem_do_nginx_e_nao_do_cabecalho_do_cloudflare(cliente):
    # CF-Connecting-IP pode ser inventado por quem acessa a VPS direto: não pode separar as contagens
    for i in range(10):
        assert cadastrar(cliente, f"x{i}@etec.com").status_code == 200
    r = cliente.post("/api/auth/signup", json={"email": "x10@etec.com", "password": "senha-segura"},
                     headers={"CF-Connecting-IP": "192.0.2.55"})
    assert r.status_code == 429


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

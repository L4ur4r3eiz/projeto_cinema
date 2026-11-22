# ETEC em Cena

Site do projeto de audiovisual da Etec Professora Maria Cristina Medeiros: curtas, equipe, inscrições e painel da equipe.

| Parte | Tecnologia | Pasta |
|---|---|---|
| Site | React 19 + TypeScript, Vite 8, React Router 8, Tailwind CSS 4 | `frontend/` |
| API | Python + FastAPI, SQLAlchemy 2, Alembic | `backend/` |
| Banco | PostgreSQL 17 (Docker Compose em desenvolvimento) | `docker-compose.yml` |

O site e a API respondem no mesmo endereço: o login usa um cookie de sessão `httpOnly`. Em desenvolvimento, o Vite repassa `/api` e `/uploads` para o FastAPI.

## Rodar localmente

Requisitos: Node 24, [uv](https://docs.astral.sh/uv/) (Python 3.14) e Docker Desktop.

```bash
cp .env.example .env                  # senha do banco
cp backend/.env.example backend/.env  # mesma senha no DATABASE_URL
docker compose up -d                  # PostgreSQL

cd backend
uv sync
uv run alembic upgrade head           # cria as tabelas
uv run python -m app.cli criar-admin voce@exemplo.com   # primeiro administrador
uv run uvicorn app.main:app --reload  # API em http://localhost:8000

cd ../frontend
npm install
npm run dev                           # site em http://localhost:5173
```

## Telas

| Endereço | O que é |
|---|---|
| `/acesso` | Criar conta e entrar |
| `/transicao` | Claquete de abertura |
| `/projeto` | Site: equipe, curtas, questionário de preferências e inscrição |
| `/painel` | Painel da equipe: indicadores, inscrições, curtas e integrantes (com upload de imagens) |
| `/admin` | Login dos administradores (contas separadas das contas da plataforma) |

Quem pode entrar no painel: contas com papel **Equipe** e administradores. Só administradores mudam o papel de uma conta (Público ou Equipe).

## Testes

```bash
cd backend && uv run pytest      # API (usa SQLite em memória, não precisa do Docker)
cd frontend && npm run build     # confere os tipos e gera a versão final
```

## Publicar (VPS provisória)

Site em `https://etec-em-cena.taberna3d.com.br`, na pasta `/opt/etec-em-cena` da VPS. Banco e API rodam em containers (`docker-compose.prod.yml`, API só em `127.0.0.1:8400`); o nginx serve `frontend/dist` e repassa `/api` e `/uploads` (`deploy/nginx.conf`).

```bash
cd frontend && npm run build                                 # na sua máquina
# copie o projeto e o frontend/dist para /opt/etec-em-cena, depois, na VPS:
cd /opt/etec-em-cena
docker compose -f docker-compose.prod.yml up -d --build     # .env com POSTGRES_* ao lado (fica só na VPS)
docker compose -f docker-compose.prod.yml exec api python -m app.cli criar-admin voce@exemplo.com
```

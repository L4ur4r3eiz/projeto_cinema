# Imagem da API para produção (usada pelo docker-compose.prod.yml).
# O site (frontend/dist) é servido pelo nginx, fora deste container.
FROM python:3.14-slim
COPY --from=ghcr.io/astral-sh/uv:0.13.5 /uv /bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project
COPY . .
ENV PATH="/app/.venv/bin:$PATH"
# Aplica as migrações antes de subir; o nginx na frente repassa o IP e o protocolo do visitante.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips=*"]

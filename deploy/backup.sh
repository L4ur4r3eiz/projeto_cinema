#!/usr/bin/env bash
# Backup diário na VPS (cron em /etc/cron.d/etec-em-cena-backup): banco + imagens enviadas.
# Guarda em /opt/etec-em-cena/backups e apaga os com mais de 14 dias.
# Restaurar o banco:  gunzip -c ARQUIVO.sql.gz | docker compose -p etec-em-cena -f docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
set -euo pipefail

cd /opt/etec-em-cena
DESTINO=backups
QUANDO=$(date +%F_%H%M)
mkdir -p "$DESTINO" && chmod 700 "$DESTINO"
compose() { docker compose -p etec-em-cena -f docker-compose.prod.yml "$@"; }

compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' | gzip > "$DESTINO/$QUANDO.sql.gz"
compose exec -T api tar -C /app -czf - uploads > "$DESTINO/uploads-$QUANDO.tar.gz"

# backup vazio = falha silenciosa: avisa no log do cron
[ -s "$DESTINO/$QUANDO.sql.gz" ] || { echo "backup do banco vazio em $QUANDO" >&2; exit 1; }
find "$DESTINO" -type f -mtime +14 -delete
echo "backup ok: $QUANDO"

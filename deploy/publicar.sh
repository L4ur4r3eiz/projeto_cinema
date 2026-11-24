#!/usr/bin/env bash
# Publica o projeto na VPS: envia o código, refaz a API (migrações rodam ao subir) e troca o site.
# Uso, na raiz do repositório:  bash deploy/publicar.sh
# A chave SSH vem de CHAVE (padrão ~/.ssh/id_ed25519_iadoc). O .env da VPS não é tocado.
set -euo pipefail

VPS=root@195.35.42.118
CHAVE=${CHAVE:-~/.ssh/id_ed25519_iadoc}
PASTA=/opt/etec-em-cena
ssh_vps() { ssh -i "$CHAVE" -o IdentitiesOnly=yes -o BatchMode=yes "$VPS" "$@"; }

cd "$(git rev-parse --show-toplevel)"
(cd frontend && npm test && npm run build)

echo "== enviando código"
git ls-files -co --exclude-standard | tar -cf - -T - | ssh_vps "tar -xf - -C $PASTA"

echo "== refazendo a API"
ssh_vps "cd $PASTA && docker compose -p etec-em-cena -f docker-compose.prod.yml up -d --build api"

echo "== trocando o site (o anterior fica em frontend/dist.anterior)"
tar -C frontend/dist -cf - . | ssh_vps "set -e; cd $PASTA/frontend
  rm -rf dist.novo && mkdir dist.novo && tar -xf - -C dist.novo
  rm -rf dist.anterior; [ -d dist ] && mv dist dist.anterior; mv dist.novo dist"

echo "== conferindo"
for caminho in / /api/content; do
  curl -s -o /dev/null -w "$caminho %{http_code}\n" --retry 10 --retry-all-errors --retry-delay 2 \
    "https://etec-em-cena.taberna3d.com.br$caminho"
done

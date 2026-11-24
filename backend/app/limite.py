import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

JANELA_S = 15 * 60
MENSAGEM = "Muitas tentativas. Aguarde alguns minutos e tente de novo."

# shortcut: contagem em memória de um único processo; se a API rodar com vários workers, passar para o banco ou Redis
_tentativas: dict[str, deque[float]] = defaultdict(deque)


def ip_de(request: Request) -> str:
    # atrás do Cloudflare o IP real vem neste cabeçalho; sem ele, o do nginx/uvicorn
    return request.headers.get("cf-connecting-ip") or (request.client.host if request.client else "?")


def contar(chave: str, maximo: int) -> None:
    """Registra uma tentativa; recusa com 429 quando a chave já usou o máximo dentro da janela."""
    agora = time.monotonic()
    fila = _tentativas[chave]
    while fila and agora - fila[0] > JANELA_S:
        fila.popleft()
    if len(fila) >= maximo:
        raise HTTPException(429, MENSAGEM)
    fila.append(agora)


def zerar() -> None:
    _tentativas.clear()

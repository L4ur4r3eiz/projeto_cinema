import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

JANELA_S = 15 * 60
MENSAGEM = "Muitas tentativas. Aguarde alguns minutos e tente de novo."

# shortcut: contagem em memória de um único processo; se a API rodar com vários workers, passar para o banco ou Redis
_tentativas: dict[str, deque[float]] = defaultdict(deque)


def ip_de(request: Request) -> str:
    # X-Real-IP é escrito pelo nginx (sobrescreve o que o cliente mandar) e já vem resolvido do Cloudflare
    # pelo real_ip do vhost; a API só escuta em 127.0.0.1, então ninguém fala com ela sem passar pelo nginx
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "?")


def contar(chave: str, maximo: int) -> None:
    """Registra uma tentativa; recusa com 429 quando a chave já usou o máximo dentro da janela."""
    agora = time.monotonic()
    fila = _tentativas[chave]
    while fila and agora - fila[0] > JANELA_S:
        fila.popleft()
    for velha in [c for c, f in _tentativas.items() if not f and c != chave]:
        del _tentativas[velha]  # filas vazias não ficam na memória
    if len(fila) >= maximo:
        raise HTTPException(429, MENSAGEM)
    fila.append(agora)


def zerar() -> None:
    _tentativas.clear()

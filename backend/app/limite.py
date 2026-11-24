import ipaddress
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

JANELA_S = 15 * 60
MENSAGEM = "Muitas tentativas. Aguarde alguns minutos e tente de novo."
VARRER_A_CADA = 500  # limpeza das filas vazias é amortizada, não roda a cada requisição

# shortcut: contagem em memória de um único processo; se a API rodar com vários workers, passar para o banco ou Redis
_tentativas: dict[str, deque[float]] = defaultdict(deque)
_chamadas = 0


def ip_de(request: Request) -> str:
    # X-Real-IP é escrito pelo nginx (sobrescreve o que o cliente mandar) e já vem resolvido do Cloudflare
    # pelo real_ip do vhost; a API só escuta em 127.0.0.1, então ninguém fala com ela sem passar pelo nginx
    bruto = request.headers.get("x-real-ip") or (request.client.host if request.client else "?")
    try:
        ip = ipaddress.ip_address(bruto)
    except ValueError:
        return bruto[:64]
    # um provedor entrega um /64 inteiro a cada cliente IPv6: contar endereço a endereço seria fácil de driblar
    return str(ipaddress.ip_network(f"{ip}/64", strict=False)) if ip.version == 6 else str(ip)


def contar(chave: str, maximo: int) -> None:
    """Registra uma tentativa; recusa com 429 quando a chave já usou o máximo dentro da janela."""
    global _chamadas
    agora = time.monotonic()
    _chamadas += 1
    if _chamadas % VARRER_A_CADA == 0:
        for velha in [c for c, f in _tentativas.items() if not f or agora - f[-1] > JANELA_S]:
            del _tentativas[velha]
    fila = _tentativas[chave[:300]]
    while fila and agora - fila[0] > JANELA_S:
        fila.popleft()
    if len(fila) >= maximo:
        raise HTTPException(429, MENSAGEM)
    fila.append(agora)


def zerar() -> None:
    global _chamadas
    _tentativas.clear()
    _chamadas = 0

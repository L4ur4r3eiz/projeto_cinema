import { describe, expect, it, vi } from 'vitest'
import { LimiteErro } from '../components/LimiteErro'
import { TRANSICAO_ROTA } from '../motion/tokens'
import { criarSaidaUnica, estiloParallax } from './modo'

describe('achados da revisão final', () => {
  it('sair da abertura navega uma vez só, mesmo com vários cliques', () => {
    const navegar = vi.fn()
    const sair = criarSaidaUnica(navegar)
    sair()
    sair()
    sair()
    expect(navegar).toHaveBeenCalledTimes(1)
  })

  it('transição de rota não deixa filter no elemento (quebraria position: fixed)', () => {
    expect(JSON.stringify(TRANSICAO_ROTA)).not.toContain('filter')
    expect(TRANSICAO_ROTA.transition.duration).toBeLessThanOrEqual(0.2)
  })

  it('parallax some quando o usuário pede menos movimento', () => {
    expect(estiloParallax(true, { y: 1, scale: 1 })).toEqual({})
    expect(estiloParallax(false, { y: 1, scale: 1 })).toEqual({ y: 1, scale: 1 })
  })

  it('limite de erro troca o conteúdo pelo plano B quando um chunk falha', () => {
    expect(LimiteErro.getDerivedStateFromError()).toEqual({ falhou: true })
  })
})

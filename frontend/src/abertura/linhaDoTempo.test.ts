import { describe, expect, it } from 'vitest'
import { DURACAO_ABERTURA, poseDaClaquete } from './linhaDoTempo'

describe('poseDaClaquete', () => {
  it('começa no alto e assenta na queda', () => {
    expect(poseDaClaquete(0).alturaQueda).toBeCloseTo(2.5)
    expect(poseDaClaquete(1.0).alturaQueda).toBeCloseTo(0, 1)
  })
  it('abre o bastão e bate em 150 ms', () => {
    expect(poseDaClaquete(1.6).anguloBastao).toBeCloseTo(0.55, 2)
    expect(poseDaClaquete(1.76).anguloBastao).toBeCloseTo(0, 2)
  })
  it('flash na batida e tremor que some', () => {
    expect(poseDaClaquete(1.76).flash).toBeGreaterThan(0.8)
    expect(poseDaClaquete(2.4).tremor).toBeCloseTo(0, 2)
  })
  it('termina com a saída completa', () => {
    expect(DURACAO_ABERTURA).toBe(4.2)
    expect(poseDaClaquete(4.2).saida).toBeCloseTo(1)
  })
  it('limita o tempo fora do intervalo', () => {
    expect(poseDaClaquete(-1)).toEqual(poseDaClaquete(0))
    expect(poseDaClaquete(99)).toEqual(poseDaClaquete(4.2))
  })
})

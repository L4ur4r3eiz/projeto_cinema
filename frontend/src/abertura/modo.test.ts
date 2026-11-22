import { describe, expect, it } from 'vitest'
import { escolherModoAbertura } from './modo'

describe('escolherModoAbertura', () => {
  it('usa 3D quando há WebGL e o chunk chegou rápido', () => {
    expect(escolherModoAbertura({ webgl: true, reduzirMovimento: false, carregouEm: 400 })).toBe('3d')
  })
  it('cai no CSS quando o chunk 3D demora mais de 1,2 s ou não chegou', () => {
    expect(escolherModoAbertura({ webgl: true, reduzirMovimento: false, carregouEm: 1500 })).toBe('css')
    expect(escolherModoAbertura({ webgl: true, reduzirMovimento: false, carregouEm: null })).toBe('css')
  })
  it('cai no CSS sem WebGL', () => {
    expect(escolherModoAbertura({ webgl: false, reduzirMovimento: false, carregouEm: 400 })).toBe('css')
  })
  it('fica estático quando o usuário pede menos movimento', () => {
    expect(escolherModoAbertura({ webgl: true, reduzirMovimento: true, carregouEm: 400 })).toBe('estatico')
  })
})

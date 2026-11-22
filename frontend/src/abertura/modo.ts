export type ModoAbertura = '3d' | 'css' | 'estatico'

// Acima disso o visitante já está vendo a claquete CSS há tempo demais para trocar pela 3D.
const LIMITE_CARREGAMENTO_MS = 1200

export function escolherModoAbertura(c: {
  webgl: boolean
  reduzirMovimento: boolean
  carregouEm: number | null
}): ModoAbertura {
  if (c.reduzirMovimento) return 'estatico'
  if (!c.webgl || c.carregouEm === null || c.carregouEm > LIMITE_CARREGAMENTO_MS) return 'css'
  return '3d'
}

export function temWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

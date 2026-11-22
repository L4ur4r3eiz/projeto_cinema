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
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    // libera o contexto de teste: o navegador limita quantos contextos WebGL ficam ativos
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  } catch {
    return false
  }
}

// Pular, fim do 3D e timer de segurança chamam a mesma saída: só a primeira chamada navega.
export function criarSaidaUnica(navegar: () => void): () => void {
  let saiu = false
  return () => {
    if (saiu) return
    saiu = true
    navegar()
  }
}

// Com "reduzir movimento", o topo não se desloca nem encolhe ao rolar (só o fade fica).
export function estiloParallax<T extends object>(reduzir: boolean | null, movimento: T): T | Record<string, never> {
  return reduzir ? {} : movimento
}

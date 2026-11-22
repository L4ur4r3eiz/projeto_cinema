// Roteiro da abertura: t em segundos → pose da claquete e da câmera. Função pura, sem three.js.
export const DURACAO_ABERTURA = 4.2
export const INSTANTE_BATIDA = 1.75

export type PoseClaquete = {
  alturaQueda: number // y do corpo (6 = acima do quadro, 0 = assentada)
  rotacaoY: number // giro do corpo em rad
  anguloBastao: number // abertura do bastão em rad (0 = fechado)
  cameraZ: number // distância da câmera
  tremor: number // 0..1, intensidade do chacoalhão da batida
  flash: number // 0..1, clarão da batida
  giz: number // 0..1, brilho do texto a giz
  saida: number // 0..1, câmera atravessando a claquete
}

const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
const trecho = (t: number, de: number, ate: number) => limitar((t - de) / (ate - de))
const sai = (p: number) => 1 - (1 - p) ** 3 // desacelera
const entra = (p: number) => p ** 3 // acelera
const meio = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2)

export function poseDaClaquete(tempo: number): PoseClaquete {
  const t = limitar(tempo, 0, DURACAO_ABERTURA)

  const queda = trecho(t, 0, 0.9)
  // cai rápido e afunda um pouco antes de assentar (sen(π·p) zera nas pontas)
  const alturaQueda = 6 * (1 - queda) ** 3 - 0.3 * Math.sin(Math.PI * queda) * queda

  const abrir = meio(trecho(t, 0.9, 1.6))
  const fechar = entra(trecho(t, 1.6, INSTANTE_BATIDA))
  const anguloBastao = t < 1.6 ? 0.55 * abrir : 0.55 * (1 - fechar)

  const depois = t - INSTANTE_BATIDA
  const flash = depois < 0 ? 0 : Math.exp(-depois / 0.25)
  const tremor = depois < 0 ? 0 : (1 - trecho(t, INSTANTE_BATIDA, INSTANTE_BATIDA + 0.4)) ** 2

  const saida = entra(trecho(t, 3.4, DURACAO_ABERTURA))
  const orbita = 0.08 * Math.sin(Math.PI * trecho(t, INSTANTE_BATIDA, 3.4))

  return {
    alturaQueda,
    rotacaoY: -0.6 * (1 - sai(queda)) + orbita,
    anguloBastao,
    // 9,5 → 7,4 (enquadra lousa + bastão aberto) → 0,6 (atravessa a lousa na saída)
    cameraZ: 9.5 - 2.1 * meio(trecho(t, 0.9, 1.6)) - 6.8 * saida,
    tremor,
    flash,
    giz: sai(trecho(t, INSTANTE_BATIDA, 2.6)),
    saida,
  }
}

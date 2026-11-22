import type { Transition, Variants } from 'motion/react'

// Primitivos de movimento (segundos e curvas cubic-bezier). Tudo que anima no site parte daqui.
export const DURACAO = { rapida: 0.2, media: 0.45, lenta: 0.9 } as const

export const CURVA = {
  // desacelera longo no fim: entrada "de cinema"
  cinema: [0.22, 1, 0.36, 1],
  // acelera até o fim: golpe, batida da claquete
  impacto: [0.7, 0, 0.84, 0],
} as const satisfies Record<string, [number, number, number, number]>

const entrada: Transition = { duration: DURACAO.media, ease: CURVA.cinema }

// Semânticos: como cada coisa entra em cena.
export const revelar: Variants = {
  oculto: { opacity: 0, y: 24 },
  visivel: { opacity: 1, y: 0, transition: entrada },
}

export function escalonar(passo = 0.08): Variants {
  return { oculto: {}, visivel: { transition: { staggerChildren: passo } } }
}

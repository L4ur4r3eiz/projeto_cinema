import { useEffect, useState, type RefObject } from 'react'

// Quando a cena volta a desenhar, o primeiro delta é o tempo todo em que ficou parada: teto de 0,1 s.
export const limitarDelta = (delta: number) => Math.min(delta, 0.1)

// true enquanto o elemento aparece na tela: a cena 3D só desenha quadros nesse intervalo.
export function useCenaVisivel(ref: RefObject<HTMLElement | null>): boolean {
  const [visivel, setVisivel] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observador = new IntersectionObserver(([entrada]) => setVisivel(entrada.isIntersecting), { threshold: 0 })
    observador.observe(el)
    return () => observador.disconnect()
  }, [ref])
  return visivel
}

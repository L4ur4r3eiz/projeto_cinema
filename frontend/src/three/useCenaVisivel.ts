import { useEffect, useState, type RefObject } from 'react'

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

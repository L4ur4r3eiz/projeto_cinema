import { m, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import type { ReactNode } from 'react'
import { revelar } from '../motion/tokens'

const MOLA = { stiffness: 180, damping: 18, mass: 0.6 }
const INCLINACAO_MAX = 8 // graus

// Cartão que inclina em 3D seguindo o mouse, com um brilho que acompanha o ponteiro.
export function CartaoInclinavel({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduzir = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [INCLINACAO_MAX, -INCLINACAO_MAX]), MOLA)
  const rotateY = useSpring(useTransform(px, [0, 1], [-INCLINACAO_MAX, INCLINACAO_MAX]), MOLA)
  const brilhoX = useTransform(px, (v) => `${v * 100}%`)
  const brilhoY = useTransform(py, (v) => `${v * 100}%`)
  const brilho = useMotionTemplate`radial-gradient(420px circle at ${brilhoX} ${brilhoY}, rgba(255,199,0,0.16), transparent 45%)`

  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduzir || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const soltar = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <m.div variants={revelar} style={{ perspective: 900 }} className={className}>
      <m.div
        onPointerMove={mover}
        onPointerLeave={soltar}
        style={reduzir ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group relative size-full"
      >
        {children}
        {!reduzir && (
          <m.div
            aria-hidden="true"
            style={{ background: brilho }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
      </m.div>
    </m.div>
  )
}

// Barra amarela no topo que mostra quanto da página já foi lida.
export function BarraRolagem() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  return (
    <m.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-16 z-50 h-[2px] origin-left bg-[#FFC700] shadow-[0_0_12px_#FFC700]"
    />
  )
}

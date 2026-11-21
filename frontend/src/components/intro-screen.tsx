import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Brand } from './brand'

export function IntroScreen({ destination = '/projeto' }: { destination?: string }) {
  const navigate = useNavigate()
  const [clapping, setClapping] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => navigate(destination, { replace: true }), 3600)
    return () => window.clearTimeout(timer)
  }, [destination, navigate])

  const clap = () => {
    setClapping(true)
    window.setTimeout(() => setClapping(false), 560)
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#030303] text-white">
      <div className="intro-glow absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <button
          type="button"
          onClick={clap}
          className={`intro-clapper ${clapping ? 'is-clicked' : ''}`}
          aria-label="Bater claquete"
        >
          <div className="intro-clapper-top" />
          <div className="intro-clapper-body">
            <span>TAKE</span>
            <strong>01</strong>
          </div>
        </button>
        <div className="flex flex-col items-center gap-4">
          <Brand />
          <p className="text-[10px] uppercase tracking-[0.46em] text-[#A1A1A1]">
            Uma produção estudantil · 2026
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate(destination, { replace: true })}
        className="absolute right-6 top-6 z-20 rounded-full border border-white/15 px-4 py-2 text-xs text-[#A1A1A1] transition hover:border-[#FFC700]/60 hover:text-white"
      >
        Pular transição
      </button>
      <div className="absolute bottom-8 left-1/2 h-px w-40 -translate-x-1/2 overflow-hidden bg-white/10">
        <span className="intro-progress block h-full bg-[#FFC700]" />
      </div>
    </main>
  )
}

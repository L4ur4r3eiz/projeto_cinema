import { useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router'
import { DURACAO_ABERTURA } from '../abertura/linhaDoTempo'
import { escolherModoAbertura, temWebGL, type ModoAbertura } from '../abertura/modo'
import { Brand } from './brand'

type Cena = ComponentType<{ aoTerminar: () => void }>

// Tempo de tela por modo quando não há 3D (o 3D avisa sozinho quando termina).
const DURACAO_CSS_MS = 3600
const DURACAO_ESTATICA_MS = 1500

export function IntroScreen({ destination = '/projeto' }: { destination?: string }) {
  const navigate = useNavigate()
  const reduzirMovimento = useReducedMotion() ?? false
  const [modo, setModo] = useState<ModoAbertura>(reduzirMovimento ? 'estatico' : 'css')
  const [Cena3D, setCena3D] = useState<Cena | null>(null)
  const [clapping, setClapping] = useState(false)
  const saiu = useRef(false)

  // Pular, fim do 3D e fim do tempo passam todos por aqui: navega uma vez só.
  const sair = useCallback(() => {
    if (saiu.current) return
    saiu.current = true
    navigate(destination, { replace: true })
  }, [destination, navigate])

  useEffect(() => {
    if (reduzirMovimento || !temWebGL()) return
    const inicio = performance.now()
    let ativo = true
    import('../abertura/ClaqueteCena')
      .then((m) => {
        if (!ativo) return
        const escolhido = escolherModoAbertura({ webgl: true, reduzirMovimento, carregouEm: performance.now() - inicio })
        if (escolhido === '3d') {
          setCena3D(() => m.default)
          setModo('3d')
        }
      })
      .catch(() => {}) // sem o chunk 3D, segue a claquete CSS
    return () => {
      ativo = false
    }
  }, [reduzirMovimento])

  useEffect(() => {
    // no 3D quem avisa o fim é a cena; o timer só garante a saída se o requestAnimationFrame travar (aba em 2º plano)
    const espera = modo === '3d' ? DURACAO_ABERTURA * 1000 + 1500 : modo === 'estatico' ? DURACAO_ESTATICA_MS : DURACAO_CSS_MS
    const timer = window.setTimeout(sair, espera)
    return () => window.clearTimeout(timer)
  }, [modo, sair])

  const clap = () => {
    setClapping(true)
    window.setTimeout(() => setClapping(false), 560)
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#030303] text-white">
      {modo === '3d' && Cena3D ? (
        <>
          <Cena3D aoTerminar={sair} />
          <p className="pointer-events-none absolute inset-x-0 bottom-10 z-10 text-center text-[10px] uppercase tracking-[0.46em] text-[#A1A1A1]">
            Uma produção estudantil · 2026
          </p>
        </>
      ) : (
        <>
          <div className="intro-glow absolute inset-0" />
          <div className="relative z-10 flex flex-col items-center gap-10">
            {modo === 'css' && (
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
            )}
            <div className="flex flex-col items-center gap-4">
              <Brand />
              <p className="text-[10px] uppercase tracking-[0.46em] text-[#A1A1A1]">
                Uma produção estudantil · 2026
              </p>
            </div>
          </div>
          {modo === 'css' && (
            <div className="absolute bottom-8 left-1/2 h-px w-40 -translate-x-1/2 overflow-hidden bg-white/10">
              <span className="intro-progress block h-full bg-[#FFC700]" />
            </div>
          )}
        </>
      )}
      <button
        type="button"
        onClick={sair}
        className="absolute right-6 top-6 z-20 rounded-full border border-white/15 px-4 py-2 text-xs text-[#A1A1A1] transition hover:border-[#FFC700]/60 hover:text-white"
      >
        Pular transição
      </button>
    </main>
  )
}

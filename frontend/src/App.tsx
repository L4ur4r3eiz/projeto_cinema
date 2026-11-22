import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'
import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { CURVA, DURACAO } from './motion/tokens'
import { IntroScreen } from './components/intro-screen'
import { AuthScreen } from './pages/Acesso'
import { NaoEncontrada } from './pages/NaoEncontrada'

// /acesso é a porta de entrada e vai no pacote inicial; as outras telas carregam quando abertas
const Projeto = lazy(() => import('./pages/Projeto').then((m) => ({ default: m.Projeto })))
const Painel = lazy(() => import('./pages/Painel').then((m) => ({ default: m.Painel })))
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })))

// títulos que o Next definia em cada page.tsx (metadata)
const TITULOS: Record<string, string> = {
  '/acesso': 'Acesso — ETEC em Cena',
  '/transicao': 'Iniciando sessão — ETEC em Cena',
  '/projeto': 'ETEC em Cena — Onde histórias ganham vida',
  '/painel': 'Painel do Projeto — ETEC em Cena',
  '/admin': 'Administração — ETEC em Cena',
}

export default function App() {
  const location = useLocation()
  const { pathname } = location
  useEffect(() => {
    document.title = TITULOS[pathname] ?? 'ETEC em Cena'
  }, [pathname])

  // reducedMotion="user": quem pede menos movimento no sistema fica só com fades, sem deslocamentos
  return (
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <m.div
          key={pathname}
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: DURACAO.media, ease: CURVA.cinema }}
        >
          <Suspense fallback={<div className="min-h-screen bg-[#030303]" />}>
          <Routes location={location}>
            <Route index element={<Navigate to="/acesso" replace />} />
            <Route path="acesso" element={<AuthScreen />} />
            <Route path="transicao" element={<IntroScreen destination="/projeto" />} />
            <Route path="projeto" element={<Projeto />} />
            <Route path="painel" element={<Painel />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<NaoEncontrada />} />
          </Routes>
          </Suspense>
        </m.div>
      </AnimatePresence>
    </MotionConfig>
    </LazyMotion>
  )
}

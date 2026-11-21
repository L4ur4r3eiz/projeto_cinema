import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { IntroScreen } from './components/intro-screen'
import { AuthScreen } from './pages/Acesso'
import { Admin } from './pages/Admin'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { Painel } from './pages/Painel'
import { Projeto } from './pages/Projeto'

// títulos que o Next definia em cada page.tsx (metadata)
const TITULOS: Record<string, string> = {
  '/acesso': 'Acesso — ETEC em Cena',
  '/transicao': 'Iniciando sessão — ETEC em Cena',
  '/projeto': 'ETEC em Cena — Onde histórias ganham vida',
  '/painel': 'Painel do Projeto — ETEC em Cena',
  '/admin': 'Administração — ETEC em Cena',
}

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = TITULOS[pathname] ?? 'ETEC em Cena'
  }, [pathname])

  return (
    <Routes>
      <Route index element={<Navigate to="/acesso" replace />} />
      <Route path="acesso" element={<AuthScreen />} />
      <Route path="transicao" element={<IntroScreen destination="/projeto" />} />
      <Route path="projeto" element={<Projeto />} />
      <Route path="painel" element={<Painel />} />
      <Route path="admin" element={<Admin />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  )
}

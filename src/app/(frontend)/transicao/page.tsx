import type { Metadata } from 'next'
import { IntroScreen } from '@/components/intro-screen'

export const metadata: Metadata = {
  title: 'Iniciando sessão — ETEC em Cena',
  robots: { index: false, follow: false },
}

export default function TransitionPage() {
  return <IntroScreen destination="/projeto" />
}

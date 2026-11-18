import type { Metadata } from 'next'
import { AuthScreen } from './auth-screen'

export const metadata: Metadata = {
  title: 'Acesso — ETEC em Cena',
  description: 'Crie sua conta ou entre na plataforma ETEC em Cena.',
}

export default function AccessPage() {
  return <AuthScreen />
}

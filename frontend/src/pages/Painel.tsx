import { useCallback, useEffect, useState, type ComponentProps } from 'react'
import { Link } from 'react-router'
import { buscar } from '../api'
import { DashboardExperience } from './DashboardExperience'
import { Aviso } from './Projeto'

type DadosPainel = Omit<ComponentProps<typeof DashboardExperience>, 'onRefresh'>

export function Painel() {
  const [dados, setDados] = useState<DadosPainel | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'restrito' | 'erro' | 'pronto'>('carregando')

  const carregar = useCallback(() => {
    buscar<DadosPainel>('/panel')
      .then(({ status, dados }) => {
        if (dados) {
          setDados(dados)
          setEstado('pronto')
        } else setEstado(status === 401 || status === 403 ? 'restrito' : 'erro')
      })
      .catch(() => setEstado('erro'))
  }, [])

  useEffect(carregar, [carregar])

  if (estado === 'carregando') return <Aviso texto="Carregando…" />
  if (estado === 'erro') return <Aviso texto="Não foi possível carregar o painel. Tente novamente em instantes." />
  if (estado === 'restrito' || !dados) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#030303] p-6 text-white">
        <section className="w-full max-w-md rounded-[28px] border border-[#222] bg-[#0D0D0D] p-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#FFC700]">Área restrita</p>
          <h1 className="mt-5 text-3xl font-medium tracking-[-0.05em]">Painel dos criadores</h1>
          <p className="mt-4 text-sm leading-6 text-[#929292]">
            Esta área reconhece automaticamente membros da equipe e administradores do projeto.
          </p>
          <div className="mt-8 grid gap-3">
            <Link
              to="/admin"
              className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-[#FFC700]"
            >
              Acessar como administrador
            </Link>
            <Link
              to="/projeto"
              className="rounded-full border border-white/12 px-5 py-3 text-sm text-[#A1A1A1] transition hover:border-[#FFC700]/50 hover:text-white"
            >
              Voltar ao projeto
            </Link>
          </div>
        </section>
      </main>
    )
  }
  return <DashboardExperience {...dados} onRefresh={carregar} />
}

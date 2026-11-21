import { useEffect, useState } from 'react'
import { buscar, type PublicShortFilm, type PublicTeamMember } from '../api'
import { ProjectExperience } from './ProjectExperience'

type Conteudo = { team: PublicTeamMember[]; films: PublicShortFilm[] }

export function Projeto() {
  const [conteudo, setConteudo] = useState<Conteudo | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    buscar<Conteudo>('/content')
      .then(({ dados }) => (dados ? setConteudo(dados) : setErro(true)))
      .catch(() => setErro(true))
  }, [])

  if (erro) return <Aviso texto="Não foi possível carregar o conteúdo. Tente novamente em instantes." />
  if (!conteudo) return <Aviso texto="Carregando…" />
  return <ProjectExperience team={conteudo.team} films={conteudo.films} />
}

export function Aviso({ texto }: { texto: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#030303] p-6 text-sm text-[#929292]" role="status">
      {texto}
    </main>
  )
}

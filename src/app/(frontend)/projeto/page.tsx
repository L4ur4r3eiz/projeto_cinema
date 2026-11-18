import type { Metadata } from 'next'
import { getHomeContent } from '@/lib/content'
import { ProjectExperience } from './project-experience'

export const metadata: Metadata = {
  title: 'ETEC em Cena — Onde histórias ganham vida',
  description:
    'Conheça a equipe, os curtas e participe do projeto escolar de audiovisual ETEC em Cena.',
}

export default async function ProjectPage() {
  const { team, films } = await getHomeContent()
  return <ProjectExperience team={team} films={films} />
}

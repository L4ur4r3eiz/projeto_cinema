import config from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import type { PublicShortFilm, PublicTeamMember } from '@/lib/content'
import { getCurrentProjectOperator } from '@/lib/project-operator'
import { DashboardExperience } from './dashboard-experience'

export const metadata: Metadata = {
  title: 'Painel do Projeto — ETEC em Cena',
  robots: { index: false, follow: false },
}

export default async function PanelPage() {
  const user = await getCurrentProjectOperator()
  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#030303] p-6 text-white">
        <section className="w-full max-w-md rounded-[28px] border border-[#222] bg-[#0D0D0D] p-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#FFC700]">
            Área restrita
          </p>
          <h1 className="mt-5 text-3xl font-medium tracking-[-0.05em]">Painel dos criadores</h1>
          <p className="mt-4 text-sm leading-6 text-[#929292]">
            Esta área reconhece automaticamente membros da equipe e administradores do projeto.
          </p>
          <div className="mt-8 grid gap-3">
            <Link
              href="/admin"
              className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-[#FFC700]"
            >
              Acessar como administrador
            </Link>
            <Link
              href="/projeto"
              className="rounded-full border border-white/12 px-5 py-3 text-sm text-[#A1A1A1] transition hover:border-[#FFC700]/50 hover:text-white"
            >
              Voltar ao projeto
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const payload = await getPayload({ config })
  const [users, applications, team, films] = await Promise.all([
    payload.find({
      collection: 'users',
      limit: 200,
      sort: '-createdAt',
      overrideAccess: false,
      user: user as never,
    }),
    payload.find({
      collection: 'applications',
      depth: 1,
      limit: 200,
      sort: '-createdAt',
      overrideAccess: false,
      user: user as never,
    }),
    payload.find({
      collection: 'team-members',
      depth: 1,
      limit: 100,
      sort: 'order',
      overrideAccess: false,
      user: user as never,
    }),
    payload.find({
      collection: 'short-films',
      depth: 1,
      limit: 100,
      sort: 'order',
      overrideAccess: false,
      user: user as never,
    }),
  ])

  return (
    <DashboardExperience
      users={users.docs as never}
      applications={applications.docs as never}
      team={team.docs as unknown as PublicTeamMember[]}
      films={films.docs as unknown as PublicShortFilm[]}
    />
  )
}

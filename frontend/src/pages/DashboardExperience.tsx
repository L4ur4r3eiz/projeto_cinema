import { AnimatePresence, m } from 'motion/react'
import { useEffect, useMemo, useState, useTransition, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  adminLogoutAction,
  logoutAction,
  removeCatalogItemAction,
  saveFilmAction,
  saveTeamMemberAction,
  updateApplicationStatusAction,
  updateUserRoleAction,
  uploadImageAction,
  type ActionResult,
  type PublicShortFilm,
  type PublicTeamMember,
} from '../api'
import { Brand } from '../components/brand'
import { CURVA, DURACAO } from '../motion/tokens'

type UserRow = {
  id: string
  email?: string | null
  role?: string | null
  onboardingCompleted?: boolean | null
  preferences?: Record<string, boolean | null> | null
  createdAt?: string
}

type ApplicationRow = {
  id: string
  fullName: string
  email: string
  phone: string
  area: string
  status: string
  message?: string | null
  user?:
    | string
    | {
        id?: string
        email?: string | null
        role?: string | null
        onboardingCompleted?: boolean | null
        preferences?: Record<string, boolean | null> | null
      }
    | null
  createdAt?: string
}

const tabs = [
  { key: 'overview', label: 'Visão geral' },
  { key: 'records', label: 'Usuários e inscrições' },
  { key: 'films', label: 'Gestão de curtas' },
  { key: 'team', label: 'Equipe' },
] as const

const areaMeta = [
  ['atuacao', 'Atriz / Ator'],
  ['figurino', 'Figurino'],
  ['roteiro', 'Roteiro'],
  ['direcao', 'Direção'],
  ['fotografia', 'Fotografia'],
  ['edicao-som', 'Edição e som'],
  ['producao', 'Produção'],
  ['cenografia', 'Cenografia'],
  ['maquiagem', 'Maquiagem'],
] as const

const preferenceMeta = [
  ['likesShortFilms', 'Assiste a curtas'],
  ['wantsBehindTheScenes', 'Quer ver bastidores'],
  ['interestedInActing', 'Interesse em atuação'],
  ['interestedInProduction', 'Interesse em produção'],
  ['wantsProjectNews', 'Quer receber novidades'],
] as const

const statusLabels: Record<string, string> = {
  new: 'Nova',
  contacted: 'Em contato',
  approved: 'Aprovada',
  archived: 'Arquivada',
}

// envia a imagem escolhida no formulário (se houver) e devolve o endereço dela; sem arquivo, mantém o atual
async function imageURL(
  file: FormDataEntryValue | null,
  current: FormDataEntryValue | null,
): Promise<string | ActionResult> {
  if (file instanceof File && file.size > 0) {
    const result = await uploadImageAction(file)
    return result.ok && result.url ? result.url : result
  }
  return String(current ?? '')
}

function mediaURL(value: PublicTeamMember['photo'] | PublicShortFilm['thumbnail']) {
  return typeof value === 'object' && value?.url ? value.url : null
}

function Icon({ name }: { name: 'overview' | 'records' | 'films' | 'team' | 'logout' }) {
  const paths = {
    overview: 'M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4zM14 18h6v2h-6z',
    records: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
    films: 'M4 6h16v13H4zM4 10h16M8 6l2 4M14 6l2 4',
    team: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5M3 19c0-3 2-5 5-5s5 2 5 5M14 14c3 0 5 2 5 5',
    logout: 'M10 5H5v14h5M14 8l4 4-4 4M8 12h10',
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current">
      <path d={paths[name]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KpiCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string
  value: number
  detail: string
  accent: 'gold' | 'blue'
}) {
  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-white/8 bg-white/[.035] p-6 backdrop-blur-xl">
      <div
        className={`absolute -right-12 -top-12 size-36 rounded-full blur-3xl ${
          accent === 'gold' ? 'bg-[#FFC700]/12' : 'bg-[#4D8DFF]/14'
        }`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#797979]">
            {label}
          </p>
          <span
            className={`size-2 rounded-full ${
              accent === 'gold'
                ? 'bg-[#FFC700] shadow-[0_0_18px_#FFC700]'
                : 'bg-[#4D8DFF] shadow-[0_0_18px_#4D8DFF]'
            }`}
          />
        </div>
        <p className="mt-8 text-5xl font-medium tracking-[-0.07em]">{value}</p>
        <p className="mt-3 text-xs text-[#777]">{detail}</p>
      </div>
    </article>
  )
}

export type Operator = { kind: 'admin' | 'staff'; email: string }

export function DashboardExperience({
  users,
  applications,
  team,
  films,
  operator,
  onRefresh,
}: {
  users: UserRow[]
  applications: ApplicationRow[]
  team: PublicTeamMember[]
  films: PublicShortFilm[]
  operator: Operator
  onRefresh: () => void
}) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('overview')
  const [message, setMessage] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<ApplicationRow | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!selectedApplication) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedApplication(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [selectedApplication])

  const answeredUsers = users.filter((user) => user.onboardingCompleted)
  const responseRate = users.length ? Math.round((answeredUsers.length / users.length) * 100) : 0
  const preferenceTotal = (key: string) =>
    answeredUsers.filter((user) => Boolean(user.preferences?.[key])).length

  const areaStats = useMemo(() => {
    const values = areaMeta.map(([key, label]) => ({
      key,
      label,
      value: applications.filter((item) => item.area === key).length,
    }))
    const max = Math.max(...values.map((item) => item.value), 1)
    return values.map((item) => ({ ...item, width: Math.round((item.value / max) * 100) }))
  }, [applications])

  const timeline = useMemo(() => {
    const dates = [...users, ...applications]
      .map((item) => (item.createdAt ? new Date(item.createdAt) : null))
      .filter((date): date is Date => Boolean(date && !Number.isNaN(date.valueOf())))
    const anchor = dates.length
      ? new Date(Math.max(...dates.map((date) => date.valueOf())))
      : new Date()
    const buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(anchor.getFullYear(), anchor.getMonth() - (6 - index), 1)
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        value: 0,
      }
    })
    for (const date of dates) {
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const bucket = buckets.find((item) => item.key === key)
      if (bucket) bucket.value += 1
    }
    const max = Math.max(...buckets.map((item) => item.value), 1)
    const points = buckets.map((item, index) => ({
      ...item,
      x: 32 + index * 122,
      y: 190 - (item.value / max) * 135,
    }))
    const line = points
      .map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`)
      .join(' ')
    const area = `${line} L ${points.at(-1)?.x ?? 764} 210 L 32 210 Z`
    return { points, line, area }
  }, [applications, users])

  const refreshAfter = async (operation: () => Promise<{ ok: boolean; message: string }>) => {
    const result = await operation()
    setMessage(result.message)
    if (result.ok) onRefresh()
  }

  const saveTeam = (event: FormEvent<HTMLFormElement>, id?: string) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() =>
      refreshAfter(async () => {
        const photoUrl = await imageURL(data.get('photo'), data.get('photoUrl'))
        if (typeof photoUrl !== 'string') return photoUrl
        return saveTeamMemberAction({
          id,
          name: String(data.get('name') ?? ''),
          role: String(data.get('role') ?? ''),
          bio: String(data.get('bio') ?? ''),
          photoUrl,
        })
      }),
    )
  }

  const saveFilm = (event: FormEvent<HTMLFormElement>, id?: string) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() =>
      refreshAfter(async () => {
        const thumbnailUrl = await imageURL(data.get('thumbnail'), data.get('thumbnailUrl'))
        if (typeof thumbnailUrl !== 'string') return thumbnailUrl
        return saveFilmAction({
          id,
          title: String(data.get('title') ?? ''),
          duration: String(data.get('duration') ?? ''),
          genre: String(data.get('genre') ?? ''),
          synopsis: String(data.get('synopsis') ?? ''),
          youtubeURL: String(data.get('youtubeURL') ?? ''),
          thumbnailUrl,
        })
      }),
    )
  }

  const removeItem = (kind: 'team-members' | 'short-films', id: string) => {
    if (!window.confirm('Remover este item? Esta ação não pode ser desfeita.')) return
    startTransition(() => refreshAfter(() => removeCatalogItemAction({ kind, id })))
  }

  const changeStatus = (id: string, status: string) => {
    setSelectedApplication((current) => (current ? { ...current, status } : current))
    startTransition(() => refreshAfter(() => updateApplicationStatusAction(id, status)))
  }

  const changeRole = (id: string, role: 'audience' | 'staff') => {
    startTransition(() => refreshAfter(() => updateUserRoleAction(id, role)))
  }

  const logout = () => {
    startTransition(async () => {
      if (operator.kind === 'admin') {
        await adminLogoutAction()
        navigate('/admin')
      } else {
        await logoutAction()
        navigate('/acesso')
      }
    })
  }

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/8 bg-[#060606]/95 p-5 backdrop-blur-2xl lg:flex">
        <div className="px-2 py-3">
          <Brand />
        </div>
        <p className="mt-10 px-4 text-[9px] uppercase tracking-[0.24em] text-[#4F4F4F]">
          Menu principal
        </p>
        <nav className="mt-3 grid gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-xs transition ${
                activeTab === tab.key
                  ? 'bg-white text-black shadow-[0_10px_40px_rgba(255,255,255,.08)]'
                  : 'text-[#7E7E7E] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon name={tab.key} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-[18px] border border-[#FFC700]/15 bg-[#FFC700]/[.04] p-4">
          <p className="text-[9px] uppercase tracking-[0.22em] text-[#FFC700]">ETEC Analytics</p>
          <p className="mt-2 text-[11px] leading-5 text-[#777]">
            Dados consolidados em tempo real para a equipe do projeto.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3 text-left text-xs text-[#777] hover:bg-white/5 hover:text-white"
        >
          <Icon name="logout" />
          Encerrar sessão
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/8 bg-[#030303]/82 backdrop-blur-2xl">
          <div className="flex min-h-20 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#FFC700]">
                Backoffice / 2026
              </p>
              <h1 className="mt-1 text-xl font-medium tracking-[-0.04em]">
                Dashboard administrativo
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/projeto"
                className="rounded-full border border-white/10 px-4 py-2 text-[10px] text-[#A0A0A0] transition hover:border-[#FFC700]/45 hover:text-white"
              >
                Ver plataforma
              </a>
              <span className="grid size-9 place-items-center rounded-full bg-[#FFC700] text-[10px] font-black text-black">
                EC
              </span>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-5 pb-3 lg:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] ${
                  activeTab === tab.key
                    ? 'bg-white text-black'
                    : 'border border-white/10 text-[#777]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
          {message && (
            <m.div
              key={message}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURACAO.rapida, ease: CURVA.cinema }}
              className="mb-6 flex items-center justify-between rounded-xl border border-[#FFC700]/20 bg-[#FFC700]/5 px-4 py-3 text-xs text-[#D0D0D0]"
            >
              <span>{message}</span>
              <button
                type="button"
                onClick={() => setMessage('')}
                className="text-[#777] hover:text-white"
              >
                Fechar
              </button>
            </m.div>
          )}

          {activeTab === 'overview' && (
            <section className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <KpiCard
                  label="Total de usuários cadastrados"
                  value={users.length}
                  detail={`${answeredUsers.length} responderam ao onboarding`}
                  accent="gold"
                />
                <KpiCard
                  label="Total de inscrições"
                  value={applications.length}
                  detail={`${films.length} curtas ativos na plataforma`}
                  accent="blue"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.65fr_.85fr]">
                <article className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[.035] p-6 backdrop-blur-xl">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#6D6D6D]">
                        Analytics temporal
                      </p>
                      <h2 className="mt-2 text-lg font-medium tracking-[-0.03em]">
                        Engajamento da plataforma
                      </h2>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-[#8D8D8D]">
                      Últimos 7 meses
                    </div>
                  </div>
                  <div className="mt-7 overflow-hidden rounded-2xl border border-white/5 bg-black/20 p-3">
                    <svg
                      viewBox="0 0 800 250"
                      role="img"
                      aria-label="Gráfico de linha do engajamento temporal"
                      className="h-auto w-full overflow-visible"
                    >
                      <defs>
                        <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFC700" stopOpacity=".24" />
                          <stop offset="100%" stopColor="#FFC700" stopOpacity="0" />
                        </linearGradient>
                        <filter id="chartGlow">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      {[55, 100, 145, 190].map((y) => (
                        <line
                          key={y}
                          x1="28"
                          x2="772"
                          y1={y}
                          y2={y}
                          stroke="rgba(255,255,255,.07)"
                          strokeDasharray="3 6"
                        />
                      ))}
                      <path d={timeline.area} fill="url(#chartArea)" />
                      <path
                        d={timeline.line}
                        fill="none"
                        stroke="#FFC700"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#chartGlow)"
                      />
                      {timeline.points.map((point) => (
                        <g key={point.key}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="4.5"
                            fill="#030303"
                            stroke="#FFC700"
                            strokeWidth="2"
                          />
                          <text
                            x={point.x}
                            y="235"
                            fill="#686868"
                            fontSize="11"
                            textAnchor="middle"
                            className="uppercase"
                          >
                            {point.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </article>

                <article className="rounded-[24px] border border-white/8 bg-white/[.035] p-6 backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#6D6D6D]">
                    Inscrições por área
                  </p>
                  <h2 className="mt-2 text-lg font-medium tracking-[-0.03em]">
                    Distribuição de talentos
                  </h2>
                  <div className="mt-7 grid gap-4">
                    {areaStats.map((area) => (
                      <div key={area.key}>
                        <div className="mb-2 flex items-center justify-between text-[11px]">
                          <span className="text-[#9A9A9A]">{area.label}</span>
                          <span className="font-semibold text-white">{area.value}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/7">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#FFC700] to-[#FF8A00]"
                            style={{ width: `${area.width}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
                <article className="rounded-[24px] border border-white/8 bg-white/[.035] p-6 backdrop-blur-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#6D6D6D]">
                        Preferências consolidadas
                      </p>
                      <h2 className="mt-2 text-lg font-medium tracking-[-0.03em]">
                        Perfil da audiência
                      </h2>
                    </div>
                    <span className="text-2xl font-medium tracking-[-0.05em]">{responseRate}%</span>
                  </div>
                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    {preferenceMeta.map(([key, label]) => {
                      const value = answeredUsers.length
                        ? Math.round((preferenceTotal(key) / answeredUsers.length) * 100)
                        : 0
                      return (
                        <div key={key}>
                          <div className="mb-2 flex justify-between text-[11px]">
                            <span className="text-[#858585]">{label}</span>
                            <span>{value}%</span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-white/7">
                            <div className="h-full bg-[#4D8DFF]" style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </article>

                <article className="rounded-[24px] border border-white/8 bg-white/[.035] p-6 backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#6D6D6D]">
                    Atividade recente
                  </p>
                  <h2 className="mt-2 text-lg font-medium tracking-[-0.03em]">
                    Últimas inscrições
                  </h2>
                  <div className="mt-6 grid gap-3">
                    {applications.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 border-b border-white/7 pb-3 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs">{item.fullName}</p>
                          <p className="mt-1 truncate text-[10px] text-[#666]">
                            {areaMeta.find(([key]) => key === item.area)?.[1] || item.area}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/8 px-2.5 py-1 text-[9px] text-[#777]">
                          {statusLabels[item.status] || item.status}
                        </span>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <p className="py-6 text-center text-xs text-[#5F5F5F]">
                        Nenhuma inscrição ainda.
                      </p>
                    )}
                  </div>
                </article>
              </div>
            </section>
          )}

          {activeTab === 'records' && (
            <section>
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#FFC700]">
                  Base consolidada
                </p>
                <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em]">
                  Usuários e inscrições
                </h2>
                <p className="mt-3 text-sm text-[#737373]">
                  Dados completos de interesse e contato, com rolagem horizontal preservada.
                </p>
              </div>
              <div className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[.035] backdrop-blur-xl">
                <div className="overflow-x-auto overscroll-x-contain">
                  <table className="w-full min-w-[1370px] table-fixed text-left text-xs">
                    <colgroup>
                      <col className="w-[150px]" />
                      <col className="w-[180px]" />
                      <col className="w-[190px]" />
                      <col className="w-[230px]" />
                      <col className="w-[160px]" />
                      <col className="w-[300px]" />
                      <col className="w-[130px]" />
                      <col className="w-[90px]" />
                    </colgroup>
                    <thead className="border-b border-white/8 bg-black/20 text-[9px] uppercase tracking-[0.18em] text-[#666]">
                      <tr>
                        {[
                          'Área',
                          'Usuário',
                          'Nome',
                          'E-mail',
                          'Telefone',
                          'Mensagem',
                          'Status',
                          'Ação',
                        ].map((column) => (
                          <th key={column} className="px-5 py-4 font-medium">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((item) => {
                        const relatedUser =
                          typeof item.user === 'object' && item.user
                            ? item.user.email || `ID ${item.user.id?.slice(0, 8)}`
                            : item.user
                              ? `ID ${String(item.user).slice(0, 8)}`
                              : 'Visitante'
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-white/6 text-[#A5A5A5] last:border-0 hover:bg-white/[.025]"
                          >
                            <td className="px-5 py-4 text-[#FFC700]">
                              {areaMeta.find(([key]) => key === item.area)?.[1] || item.area}
                            </td>
                            <td className="truncate px-5 py-4">{relatedUser}</td>
                            <td className="truncate px-5 py-4 text-white">{item.fullName}</td>
                            <td className="truncate px-5 py-4">
                              <a href={`mailto:${item.email}`} className="hover:text-white">
                                {item.email}
                              </a>
                            </td>
                            <td className="px-5 py-4">
                              <a href={`tel:${item.phone}`} className="hover:text-white">
                                {item.phone}
                              </a>
                            </td>
                            <td className="px-5 py-4 leading-5 text-[#7F7F7F]">
                              <span className="line-clamp-2">{item.message || '—'}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-full border border-white/10 bg-white/[.025] px-3 py-1.5 text-[9px] text-[#B0B0B0]">
                                {statusLabels[item.status] || item.status}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => setSelectedApplication(item)}
                                aria-label={`Ver detalhes de ${item.fullName}`}
                                className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[.025] text-[#8A8A8A] transition hover:border-[#FFC700]/50 hover:bg-[#FFC700]/10 hover:text-[#FFC700]"
                              >
                                <svg
                                  aria-hidden="true"
                                  viewBox="0 0 24 24"
                                  className="size-4 fill-none stroke-current"
                                >
                                  <path
                                    d="M2.8 12s3.2-5.5 9.2-5.5 9.2 5.5 9.2 5.5-3.2 5.5-9.2 5.5S2.8 12 2.8 12Z"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                  />
                                  <circle cx="12" cy="12" r="2.7" strokeWidth="1.5" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {applications.length === 0 && (
                    <p className="py-16 text-center text-sm text-[#5F5F5F]">
                      Nenhuma inscrição cadastrada.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'records' && operator.kind === 'admin' && (
            <section className="mt-10">
              <h2 className="text-xl font-medium tracking-[-0.04em]">Contas da plataforma</h2>
              <p className="mt-2 text-sm text-[#737373]">
                Só administradores podem promover uma conta à equipe ou devolvê-la ao público.
              </p>
              <div className="mt-5 overflow-x-auto rounded-[24px] border border-white/8 bg-white/[.035]">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="border-b border-white/8 bg-black/20 text-[9px] uppercase tracking-[0.18em] text-[#666]">
                    <tr>
                      <th className="px-5 py-4 font-medium">E-mail</th>
                      <th className="px-5 py-4 font-medium">Cadastro</th>
                      <th className="px-5 py-4 font-medium">Papel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-white/6 text-[#A5A5A5] last:border-0">
                        <td className="truncate px-5 py-3 text-white">{user.email}</td>
                        <td className="px-5 py-3">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <select
                            aria-label={`Papel de ${user.email}`}
                            defaultValue={user.role ?? 'audience'}
                            disabled={pending}
                            onChange={(event) =>
                              changeRole(user.id, event.target.value as 'audience' | 'staff')
                            }
                            className="panel-input py-2 text-xs"
                          >
                            <option value="audience">Público</option>
                            <option value="staff">Equipe</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="py-10 text-center text-sm text-[#5F5F5F]">Nenhuma conta cadastrada.</p>
                )}
              </div>
            </section>
          )}

          {activeTab === 'films' && (
            <section>
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#FFC700]">
                    Conteúdo público
                  </p>
                  <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Gestão de curtas</h2>
                  <p className="mt-3 text-sm text-[#737373]">
                    Cadastre, edite e remova filmes sem misturar dados de audiência.
                  </p>
                </div>
                <p className="text-xs text-[#8A8A8A]">
                  A capa de cada curta é enviada no próprio formulário.
                </p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {films.map((film) => {
                  const url = mediaURL(film.thumbnail)
                  return (
                    <form
                      key={film.id}
                      onSubmit={(event) => saveFilm(event, String(film.id))}
                      className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[.035] backdrop-blur-xl"
                    >
                      <div className="relative aspect-[16/6] bg-white/5">
                        {url && (
                          <img
                            src={url}
                            alt=""
                            className="absolute inset-0 size-full object-cover opacity-60"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                      </div>
                      <div className="grid gap-3 p-5">
                        <input
                          required
                          name="title"
                          defaultValue={film.title}
                          className="panel-input"
                          aria-label="Título"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            required
                            name="duration"
                            defaultValue={film.duration}
                            className="panel-input"
                            aria-label="Duração"
                          />
                          <input
                            required
                            name="genre"
                            defaultValue={film.genre}
                            className="panel-input"
                            aria-label="Gênero"
                          />
                        </div>
                        <textarea
                          name="synopsis"
                          defaultValue={film.synopsis || ''}
                          className="panel-input min-h-20 resize-none"
                          aria-label="Sinopse"
                        />
                        <input
                          name="youtubeURL"
                          defaultValue={film.youtubeURL || ''}
                          className="panel-input"
                          aria-label="URL do YouTube"
                        />
                        <input type="hidden" name="thumbnailUrl" defaultValue={url ?? ''} />
                        <label className="grid gap-1.5 text-[10px] text-[#777]">
                          Trocar capa (PNG, JPG ou WEBP, até 5 MB)
                          <input
                            type="file"
                            name="thumbnail"
                            accept="image/png,image/jpeg,image/webp"
                            className="panel-input file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button
                            disabled={pending}
                            className="rounded-full bg-white px-4 py-2 text-[10px] font-bold text-black hover:bg-[#FFC700]"
                          >
                            Salvar alterações
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem('short-films', String(film.id))}
                            className="rounded-full border border-red-500/20 px-4 py-2 text-[10px] text-red-300 hover:bg-red-500/10"
                          >
                            Apagar
                          </button>
                        </div>
                      </div>
                    </form>
                  )
                })}
                <form
                  onSubmit={(event) => saveFilm(event)}
                  className="grid content-start gap-3 rounded-[24px] border border-dashed border-white/15 bg-white/[.02] p-6"
                >
                  <p className="mb-2 text-sm font-medium">Cadastrar novo curta</p>
                  <input required name="title" placeholder="Título" className="panel-input" />
                  <div className="grid grid-cols-2 gap-3">
                    <input required name="duration" placeholder="Duração" className="panel-input" />
                    <input required name="genre" placeholder="Gênero" className="panel-input" />
                  </div>
                  <textarea
                    name="synopsis"
                    placeholder="Sinopse"
                    className="panel-input min-h-20 resize-none"
                  />
                  <input name="youtubeURL" placeholder="URL do YouTube" className="panel-input" />
                  <label className="grid gap-1.5 text-[10px] text-[#777]">
                    Capa (PNG, JPG ou WEBP, até 5 MB)
                    <input
                      type="file"
                      name="thumbnail"
                      accept="image/png,image/jpeg,image/webp"
                      className="panel-input file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"
                    />
                  </label>
                  <button
                    disabled={pending}
                    className="mt-2 rounded-full bg-white px-4 py-2.5 text-[10px] font-bold text-black hover:bg-[#FFC700]"
                  >
                    Adicionar curta
                  </button>
                </form>
              </div>
            </section>
          )}

          {activeTab === 'team' && (
            <section>
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#FFC700]">
                  Equipe criativa
                </p>
                <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em]">
                  Integrantes do projeto
                </h2>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {team.map((member) => {
                  const url = mediaURL(member.photo)
                  return (
                    <form
                      key={member.id}
                      onSubmit={(event) => saveTeam(event, String(member.id))}
                      className="grid gap-4 rounded-[24px] border border-white/8 bg-white/[.035] p-5 backdrop-blur-xl sm:grid-cols-[96px_1fr]"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/5">
                        {url && (
                          <img
                            src={url}
                            alt=""
                            className="absolute inset-0 size-full object-cover grayscale"
                          />
                        )}
                      </div>
                      <div className="grid gap-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            name="name"
                            defaultValue={member.name}
                            className="panel-input"
                            aria-label="Nome"
                          />
                          <input
                            name="role"
                            defaultValue={member.role}
                            className="panel-input"
                            aria-label="Função"
                          />
                        </div>
                        <textarea
                          name="bio"
                          defaultValue={member.bio || ''}
                          className="panel-input min-h-20 resize-none"
                          aria-label="Biografia"
                        />
                        <input type="hidden" name="photoUrl" defaultValue={url ?? ''} />
                        <label className="grid gap-1.5 text-[10px] text-[#777]">
                          Trocar foto (PNG, JPG ou WEBP, até 5 MB)
                          <input
                            type="file"
                            name="photo"
                            accept="image/png,image/jpeg,image/webp"
                            className="panel-input file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button
                            disabled={pending}
                            className="rounded-full bg-white px-4 py-2 text-[10px] font-bold text-black hover:bg-[#FFC700]"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem('team-members', String(member.id))}
                            className="rounded-full border border-red-500/20 px-4 py-2 text-[10px] text-red-300 hover:bg-red-500/10"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </form>
                  )
                })}
                <form
                  onSubmit={(event) => saveTeam(event)}
                  className="grid content-start gap-3 rounded-[24px] border border-dashed border-white/15 bg-white/[.02] p-6"
                >
                  <p className="mb-2 text-sm font-medium">Adicionar integrante</p>
                  <input required name="name" placeholder="Nome" className="panel-input" />
                  <input required name="role" placeholder="Função" className="panel-input" />
                  <textarea
                    name="bio"
                    placeholder="Breve biografia"
                    className="panel-input min-h-20 resize-none"
                  />
                  <label className="grid gap-1.5 text-[10px] text-[#777]">
                    Foto (PNG, JPG ou WEBP, até 5 MB)
                    <input
                      type="file"
                      name="photo"
                      accept="image/png,image/jpeg,image/webp"
                      className="panel-input file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"
                    />
                  </label>
                  <button
                    disabled={pending}
                    className="mt-2 rounded-full bg-white px-4 py-2.5 text-[10px] font-bold text-black hover:bg-[#FFC700]"
                  >
                    Adicionar integrante
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>
      </div>

      <AnimatePresence>
      {selectedApplication && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="application-detail-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURACAO.rapida }}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-xl sm:p-8"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedApplication(null)
          }}
        >
          <m.section
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: DURACAO.rapida, ease: CURVA.cinema }}
            className="relative my-auto w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#222222] bg-[#121212] shadow-[0_40px_140px_rgba(0,0,0,.85)]"
          >
            <div className="absolute -right-24 -top-24 size-64 rounded-full bg-[#FFC700]/8 blur-3xl" />
            <header className="relative flex items-start justify-between gap-6 border-b border-[#222222] px-6 py-6 sm:px-8">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#FFC700]">
                  Detalhes da inscrição
                </p>
                <h2
                  id="application-detail-title"
                  className="mt-3 text-2xl font-medium tracking-[-0.045em] sm:text-3xl"
                >
                  {selectedApplication.fullName}
                </h2>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => setSelectedApplication(null)}
                aria-label="Fechar detalhes"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-[#2A2A2A] text-[#8A8A8A] transition hover:border-[#FFC700]/50 hover:text-white"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 fill-none stroke-current"
                >
                  <path d="m6 6 12 12M18 6 6 18" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="relative max-h-[72vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
              <div className="grid gap-px overflow-hidden rounded-2xl border border-[#252525] bg-[#252525] sm:grid-cols-2">
                {[
                  [
                    'Área escolhida',
                    areaMeta.find(([key]) => key === selectedApplication.area)?.[1] ||
                      selectedApplication.area,
                  ],
                  [
                    'Tipo de usuário',
                    typeof selectedApplication.user === 'object' && selectedApplication.user
                      ? selectedApplication.user.role === 'staff'
                        ? 'Equipe'
                        : 'Público cadastrado'
                      : selectedApplication.user
                        ? 'Usuário cadastrado'
                        : 'Visitante',
                  ],
                  ['Nome', selectedApplication.fullName],
                  ['E-mail', selectedApplication.email],
                  ['Telefone', selectedApplication.phone],
                  [
                    'Status',
                    statusLabels[selectedApplication.status] || selectedApplication.status,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#121212] p-5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#666]">{label}</p>
                    <p className="mt-2 break-words text-sm leading-6 text-[#E2E2E2]">{value}</p>
                  </div>
                ))}
              </div>

              <label className="mt-6 grid gap-2 text-[9px] uppercase tracking-[0.2em] text-[#666]">
                Alterar status
                <select
                  value={selectedApplication.status}
                  onChange={(event) => changeStatus(selectedApplication.id, event.target.value)}
                  disabled={pending}
                  className="panel-input text-xs normal-case tracking-normal"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-6 rounded-2xl border border-[#252525] p-5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#666]">
                  Mensagem completa
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#B5B5B5]">
                  {selectedApplication.message || 'Nenhuma mensagem informada.'}
                </p>
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#666]">
                      Questionário obrigatório
                    </p>
                    <h3 className="mt-2 text-lg font-medium tracking-[-0.03em]">
                      Preferências do público
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#666]">
                    {typeof selectedApplication.user === 'object' &&
                    selectedApplication.user?.onboardingCompleted
                      ? '5 respostas'
                      : 'Não respondido'}
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {preferenceMeta.map(([key, label], index) => {
                    const relatedUser =
                      typeof selectedApplication.user === 'object' ? selectedApplication.user : null
                    const answered = Boolean(relatedUser?.onboardingCompleted)
                    const value = relatedUser?.preferences?.[key]
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-5 rounded-xl border border-[#252525] bg-black/15 px-4 py-3.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/5 text-[9px] text-[#777]">
                            0{index + 1}
                          </span>
                          <span className="text-xs leading-5 text-[#A8A8A8]">{label}</span>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-semibold ${
                            !answered
                              ? 'bg-white/5 text-[#666]'
                              : value
                                ? 'bg-[#FFC700]/12 text-[#FFC700]'
                                : 'bg-white/7 text-[#A0A0A0]'
                          }`}
                        >
                          {!answered ? 'Não respondida' : value ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <footer className="relative border-t border-[#222222] px-6 py-5 text-right sm:px-8">
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-black transition hover:bg-[#FFC700]"
              >
                Fechar detalhes
              </button>
            </footer>
          </m.section>
        </m.div>
      )}
      </AnimatePresence>
    </main>
  )
}

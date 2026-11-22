import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState, useTransition, type FormEvent } from 'react'
import { estiloParallax, temWebGL } from '../abertura/modo'
import { LimiteErro } from '../components/LimiteErro'
import { useCenaVisivel } from '../three/useCenaVisivel'
import { useNavigate } from 'react-router'
import { BarraRolagem, CartaoInclinavel } from '../components/animados'
import { CURVA, escalonar } from '../motion/tokens'
import {
  logoutAction,
  saveOnboardingAction,
  submitApplicationAction,
  type PublicMedia,
  type PublicShortFilm,
  type PublicTeamMember,
} from '../api'
import { Brand } from '../components/brand'

const questions = [
  { key: 'likesShortFilms', label: 'Você costuma assistir a curtas-metragens?' },
  { key: 'wantsBehindTheScenes', label: 'Gostaria de conhecer os bastidores das produções?' },
  { key: 'interestedInActing', label: 'Você tem interesse em atuar diante das câmeras?' },
  { key: 'interestedInProduction', label: 'Tem curiosidade por roteiro, direção ou produção?' },
  { key: 'wantsProjectNews', label: 'Quer acompanhar as próximas estreias do projeto?' },
]

const aboutCards = [
  {
    index: '01',
    title: 'Voz estudantil',
    text: 'Um espaço para transformar vivências, repertórios e inquietações dos estudantes em narrativas audiovisuais.',
  },
  {
    index: '02',
    title: 'Aprender fazendo',
    text: 'Roteiro, fotografia, atuação, som e montagem se tornam uma experiência prática, coletiva e interdisciplinar.',
  },
  {
    index: '03',
    title: 'Cinema acessível',
    text: 'Produções possíveis, feitas com criatividade e recursos reais, mostrando que toda boa história merece uma tela.',
  },
  {
    index: '04',
    title: 'Memória da escola',
    text: 'Cada filme registra um recorte do nosso tempo e fortalece a identidade cultural da comunidade ETEC.',
  },
]

// three.js só baixa se o hero 3D for mostrado
const RoloDeFilme = lazy(() => import('../three/RoloDeFilme'))

function mediaValue(value: PublicMedia | string | number | null | undefined) {
  return typeof value === 'object' && value?.url ? value : null
}

function PlayIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`${className} fill-current`}>
      <path d="m8 5 11 7-11 7V5Z" />
    </svg>
  )
}

export function ProjectExperience({
  team,
  films,
}: {
  team: PublicTeamMember[]
  films: PublicShortFilm[]
}) {
  const navigate = useNavigate()
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [applicationMessage, setApplicationMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)
  // parallax do topo: o título desce e some enquanto a página sobe
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress: progressoHero } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const yTitulo = useTransform(progressoHero, [0, 1], [0, 220])
  const escalaTitulo = useTransform(progressoHero, [0, 1], [1, 0.88])
  const opacidadeHero = useTransform(progressoHero, [0, 0.75], [1, 0])
  const reduzirMovimento = useReducedMotion()
  const [mostrar3D] = useState(() => temWebGL())
  const heroVisivel = useCenaVisivel(heroRef)

  useEffect(() => {
    const shouldOpen = window.localStorage.getItem('etec:onboarding') === 'pending'
    if (shouldOpen) setOnboardingOpen(true)

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible')
        })
      },
      { threshold: 0.12 },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const answerQuestion = (value: boolean) => {
    const key = questions[questionIndex].key
    const nextAnswers = { ...answers, [key]: value }
    setAnswers(nextAnswers)
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((current) => current + 1)
      return
    }
    startTransition(async () => {
      const result = await saveOnboardingAction(nextAnswers)
      if (result.ok) {
        window.localStorage.removeItem('etec:onboarding')
        setOnboardingOpen(false)
      }
    })
  }

  const submitApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      const result = await submitApplicationAction({
        fullName: String(data.get('fullName') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? ''),
        area: String(data.get('area') ?? ''),
        message: String(data.get('message') ?? ''),
      })
      setApplicationMessage(result.message)
      if (result.ok) form.reset()
    })
  }

  const logout = () => {
    startTransition(async () => {
      await logoutAction()
      navigate('/acesso')
    })
  }

  return (
    <main className="relative overflow-clip bg-[#030303] text-white">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-[#030303]/72 backdrop-blur-2xl">
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto] items-center px-5 sm:px-8 md:grid-cols-[1fr_auto_1fr] lg:px-12">
          <a href="#inicio" aria-label="ETEC em Cena — início" className="justify-self-start">
            <Brand />
          </a>
          <nav className="hidden items-center gap-7 text-[11px] font-medium text-[#A1A1A1] md:flex">
            {[
              ['Início', '#inicio'],
              ['Projeto', '#sobre'],
              ['Equipe', '#equipe'],
              ['Curtas', '#curtas'],
              ['Inscrição', '#inscricao'],
            ].map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-[#FFC700]">
                {label}
              </a>
            ))}
          </nav>
          <div className="justify-self-end">
            <a
              href="/painel"
              className="hidden rounded-full border border-[#FFC700]/45 px-4 py-2 text-[10px] font-semibold text-white transition hover:bg-[#FFC700] hover:text-black md:inline-flex"
            >
              Painel Admin
            </a>
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-9 place-items-center rounded-full border border-white/12 md:hidden"
            >
              <span className="flex w-4 flex-col gap-1">
                <i className="h-px w-full bg-white" />
                <i className="h-px w-full bg-white" />
              </span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="grid gap-1 border-t border-white/8 bg-[#060606] p-4 md:hidden">
            {[
              ['Início', '#inicio'],
              ['Projeto', '#sobre'],
              ['Equipe', '#equipe'],
              ['Curtas', '#curtas'],
              ['Inscrição', '#inscricao'],
              ['Painel Admin', '/painel'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm text-[#BDBDBD] hover:bg-white/5 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>
      <BarraRolagem />

      <div>
        <section ref={heroRef} id="inicio" className="poster-hero relative min-h-screen overflow-hidden">
          {mostrar3D && !reduzirMovimento && (
            <m.div style={{ opacity: opacidadeHero }} className="pointer-events-none absolute inset-0 opacity-90">
              <LimiteErro plano={null}>
                <Suspense fallback={null}>
                  <RoloDeFilme progresso={progressoHero} ativo={heroVisivel} />
                </Suspense>
              </LimiteErro>
            </m.div>
          )}
          <div className="absolute inset-x-6 top-24 flex items-center gap-4 sm:inset-x-10 lg:inset-x-14">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-[#FFC700]">
              <path d="M12 1.5c.5 6.7 3.8 10 10.5 10.5-6.7.5-10 3.8-10.5 10.5C11.5 15.8 8.2 12.5 1.5 12 8.2 11.5 11.5 8.2 12 1.5Z" />
            </svg>
            <span className="h-px flex-1 bg-gradient-to-r from-[#FFC700]/50 via-white/20 to-transparent" />
            <span className="text-[9px] uppercase tracking-[0.32em] text-[#686868]">
              Studio mode / 01
            </span>
          </div>

          <m.div
            style={{ opacity: opacidadeHero, ...estiloParallax(reduzirMovimento, { y: yTitulo, scale: escalaTitulo }) }}
            className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 pt-16 text-center"
          >
            <m.p
              initial={{ opacity: 0, letterSpacing: '0.9em' }}
              animate={{ opacity: 1, letterSpacing: '0.42em' }}
              transition={{ duration: 1.1, ease: CURVA.cinema }}
              className="mb-7 text-[10px] font-semibold uppercase tracking-[0.42em] text-[#FFC700]"
            >
              Projeto estudantil de audiovisual
            </m.p>
            <m.h1
              className="text-[18vw] font-semibold leading-[.72] tracking-[-0.095em] text-white sm:text-[14vw] lg:text-[12.5vw]"
            >
              {/* cada linha sobe por trás de uma máscara, como letreiro de abertura */}
              {['ETEC', 'EM CENA'].map((linha, i) => (
                <span key={linha} className="block overflow-hidden pb-[0.06em]">
                  <m.span
                    initial={{ y: '105%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 1, delay: 0.15 + i * 0.14, ease: CURVA.cinema }}
                    className={`block ${i === 1 ? 'text-[#FFC700]' : ''}`}
                  >
                    {linha}
                  </m.span>
                </span>
              ))}
            </m.h1>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: CURVA.cinema }}
              className="flex flex-col items-center"
            >
              <p className="mt-10 text-sm tracking-[0.16em] text-[#A1A1A1] sm:text-base">Onde histórias ganham vida</p>
              <a
                href="#curtas"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-xs font-bold text-black transition hover:scale-105 hover:bg-[#FFC700] hover:shadow-[0_0_40px_rgba(255,199,0,0.45)]"
              >
                <PlayIcon className="size-3.5" />
                Assistir Curtas
              </a>
            </m.div>
          </m.div>

          <div className="absolute bottom-7 left-6 text-[9px] uppercase tracking-[0.24em] text-[#707070] sm:left-10 lg:left-14">
            24 FPS <span className="mx-2 text-[#FFC700]">/</span> 4K
          </div>
          <div className="absolute bottom-7 right-6 text-right text-[9px] uppercase tracking-[0.24em] text-[#707070] sm:right-10 lg:right-14">
            ETEC EM CENA <span className="mx-2 text-[#FFC700]">/</span> 2026
          </div>
        </section>

        <section id="sobre" className="section-shell relative py-28 sm:py-36">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:gap-24">
              <div data-reveal className="reveal-block lg:sticky lg:top-28 lg:self-start">
                <p className="eyebrow">01 / O Projeto &amp; Como Funciona</p>
                <h2 className="section-title mt-5">Cinema como lugar de encontro.</h2>
                <p className="mt-8 max-w-lg text-base leading-8 text-[#9A9A9A]">
                  A ETEC em Cena transforma a escola em set, laboratório e tela. Um manifesto sobre
                  aprender criando, ocupar espaços com novas narrativas e registrar a memória de
                  quem vive a escola agora.
                </p>
                <div className="mt-9 flex items-center gap-4 text-[10px] uppercase tracking-[0.24em] text-[#737373]">
                  <span className="size-2 rounded-full bg-[#FFC700] shadow-[0_0_18px_#FFC700]" />
                  Projeto ativo · Administração 2026
                </div>
              </div>
              <div className="border-t border-[#222]">
                {aboutCards.map((card) => (
                  <article
                    key={card.index}
                    data-reveal
                    className="reveal-block grid gap-5 border-b border-[#222] py-8 sm:grid-cols-[64px_1fr] lg:grid-cols-[64px_.8fr_1.2fr] lg:items-start"
                  >
                    <span className="text-[10px] font-semibold tracking-[0.22em] text-[#FFC700]">
                      {card.index}
                    </span>
                    <h3 className="text-xl font-medium tracking-[-0.035em]">{card.title}</h3>
                    <p className="text-sm leading-7 text-[#8A8A8A] sm:col-start-2 lg:col-start-auto">
                      {card.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="equipe" className="section-shell relative py-28 sm:py-36">
          <div className="section-glow section-glow-left" />
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div
              data-reveal
              className="reveal-block mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end"
            >
              <div>
                <p className="eyebrow">02 / A Equipe</p>
                <h2 className="section-title mt-5">Pessoas antes dos créditos.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#8D8D8D]">
                Um coletivo multidisciplinar que aprende, experimenta e constrói cada cena em
                conjunto.
              </p>
            </div>

            {team.length > 0 ? (
              <m.div
                variants={escalonar(0.09)}
                initial="oculto"
                whileInView="visivel"
                viewport={{ once: true, amount: 0.2 }}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
              >
                {team.map((member, index) => {
                  const photo = mediaValue(member.photo)
                  return (
                    <CartaoInclinavel key={member.id} className="aspect-[4/5]">
                    <article className="relative size-full overflow-hidden rounded-[24px] border border-[#222] bg-[#0D0D0D] transition-colors duration-500 group-hover:border-[#FFC700]/40">
                      {photo?.url ? (
                        <img
                          src={photo.url}
                          alt={photo.alt || `Retrato de ${member.name}`}
                          className="absolute inset-0 size-full object-cover grayscale contrast-125 transition duration-700 group-hover:scale-[1.06] group-hover:grayscale-0 group-hover:contrast-100"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,#3a2c08,transparent_55%)]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 via-35% to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5" style={{ transform: 'translateZ(40px)' }}>
                        <span className="mb-3 block text-[9px] uppercase tracking-[0.24em] text-[#FFC700]">
                          0{index + 1}
                        </span>
                        <h3 className="text-base font-medium leading-tight tracking-[-0.03em] text-balance">{member.name}</h3>
                        <p className="mt-1 text-xs text-[#A1A1A1]">{member.role}</p>
                        <p className="mt-4 max-h-0 overflow-hidden text-xs leading-5 text-[#B0B0B0] opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100">
                          {member.bio}
                        </p>
                      </div>
                    </article>
                    </CartaoInclinavel>
                  )
                })}
              </m.div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/15 p-12 text-center text-sm text-[#777]">
                A equipe está preparando os perfis dos integrantes.
              </div>
            )}
          </div>
        </section>

        <section id="curtas" className="section-shell relative py-28 sm:py-36">
          <div className="section-glow section-glow-right" />
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div
              data-reveal
              className="reveal-block mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end"
            >
              <div>
                <p className="eyebrow">03 / Em exibição</p>
                <h2 className="section-title mt-5">Histórias em movimento.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#8D8D8D]">
                Experimentos, adaptações e narrativas autorais produzidas dentro da escola.
              </p>
            </div>

            {films.length > 0 ? (
              <m.div
                variants={escalonar(0.12)}
                initial="oculto"
                whileInView="visivel"
                viewport={{ once: true, amount: 0.15 }}
                className="grid gap-4 md:grid-cols-3"
              >
                {films.map((film, index) => {
                  const thumbnail = mediaValue(film.thumbnail)
                  return (
                    <CartaoInclinavel
                      key={film.id}
                      className={index === 0 ? 'aspect-[16/9] md:col-span-3 md:aspect-[16/7]' : 'aspect-[4/3]'}
                    >
                    <a
                      href={film.youtubeURL || '#'}
                      target={film.youtubeURL ? '_blank' : undefined}
                      rel={film.youtubeURL ? 'noreferrer' : undefined}
                      className="relative block size-full overflow-hidden rounded-[26px] border border-[#222] bg-[#0D0D0D] transition-colors duration-500 group-hover:border-[#FFC700]/40"
                    >
                      {thumbnail?.url ? (
                        <img
                          src={thumbnail.url}
                          alt={thumbnail.alt || `Cena de ${film.title}`}
                          className="absolute inset-0 size-full object-cover opacity-70 transition duration-700 group-hover:scale-[1.035] group-hover:opacity-90"
                        />
                      ) : (
                        // sem capa: fotogramas de película e o título gigante vazado
                        <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_60%_40%,#553a00,transparent_55%)]">
                          <div className="film-perfuracao absolute inset-x-0 top-3 h-3" />
                          <div className="film-perfuracao absolute inset-x-0 bottom-3 h-3" />
                          <span className="absolute -right-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-[9rem] font-bold leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_rgba(255,199,0,0.22)] transition duration-700 group-hover:translate-x-[-2rem]">
                            {film.title}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/10" />
                      <div className="absolute left-5 top-5 flex gap-2">
                        <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] backdrop-blur-lg">
                          {film.genre}
                        </span>
                        <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-[#CACACA] backdrop-blur-lg">
                          {film.duration}
                        </span>
                      </div>
                      <span className="absolute right-5 top-5 grid size-12 place-items-center rounded-full bg-white text-black transition group-hover:scale-110 group-hover:bg-[#FFC700]">
                        <PlayIcon />
                      </span>
                      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                        <span className="text-[9px] uppercase tracking-[0.25em] text-[#FFC700]">
                          Filme 0{index + 1}
                        </span>
                        <h3
                          className={`mt-2 font-medium tracking-[-0.045em] ${
                            index === 0 ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                          }`}
                        >
                          {film.title}
                        </h3>
                        <p
                          className={`mt-3 max-w-xl text-xs leading-5 text-[#B3B3B3] sm:text-sm ${
                            index === 0 ? 'block' : 'hidden sm:block'
                          }`}
                        >
                          {film.synopsis}
                        </p>
                      </div>
                    </a>
                    </CartaoInclinavel>
                  )
                })}
              </m.div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/15 p-12 text-center text-sm text-[#777]">
                Novas produções serão adicionadas em breve.
              </div>
            )}
          </div>
        </section>

        <section id="inscricao" className="relative py-28 sm:py-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,199,0,.10),transparent_32%),linear-gradient(to_bottom,#030303,#080704_50%,#030303)]" />
          <div className="relative mx-auto grid max-w-[1200px] gap-14 px-5 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-24 lg:px-12">
            <div data-reveal className="reveal-block self-center">
              <p className="eyebrow">04 / Faça parte</p>
              <h2 className="section-title mt-5">Seu olhar pode ser a próxima cena.</h2>
              <p className="mt-7 max-w-md text-sm leading-7 text-[#929292]">
                Não é preciso chegar sabendo. Procuramos curiosidade, compromisso e vontade de criar
                em equipe. Escolha a área que mais combina com você.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-xs">
                {['Roteiro', 'Direção', 'Fotografia', 'Atuação', 'Edição e som', 'Produção'].map(
                  (area) => (
                    <span key={area} className="bg-[#080808] px-4 py-3.5 text-[#A5A5A5]">
                      {area}
                    </span>
                  ),
                )}
              </div>
            </div>

            <form
              data-reveal
              onSubmit={submitApplication}
              className="reveal-block grid gap-5 rounded-[28px] border border-[#242424] bg-[#0D0D0D]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-9"
            >
              <div className="mb-2">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#777]">
                  Formulário de interesse
                </p>
                <h3 className="mt-3 text-2xl font-medium tracking-[-0.04em]">
                  Vamos criar juntos.
                </h3>
              </div>
              <label className="form-label">
                Nome completo
                <input
                  required
                  name="fullName"
                  className="form-input"
                  placeholder="Como você gostaria de ser chamado?"
                />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="form-label">
                  E-mail
                  <input
                    required
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="voce@exemplo.com"
                  />
                </label>
                <label className="form-label">
                  WhatsApp
                  <input
                    required
                    name="phone"
                    className="form-input"
                    placeholder="(11) 99999-9999"
                  />
                </label>
              </div>
              <label className="form-label">
                Área desejada
                <select required name="area" defaultValue="" className="form-input appearance-none">
                  <option value="" disabled>
                    Selecione uma área
                  </option>
                  <option value="roteiro">Roteiro</option>
                  <option value="direcao">Direção</option>
                  <option value="fotografia">Fotografia</option>
                  <option value="atuacao">Atriz / Ator</option>
                  <option value="figurino">Figurino</option>
                  <option value="cenografia">Cenografia</option>
                  <option value="maquiagem">Maquiagem</option>
                  <option value="edicao-som">Edição e som</option>
                  <option value="producao">Produção</option>
                </select>
              </label>
              <label className="form-label">
                Mensagem
                <textarea
                  name="message"
                  maxLength={1000}
                  rows={4}
                  className="form-input min-h-28 resize-none py-3"
                  placeholder="Conte um pouco sobre seu interesse no projeto"
                />
              </label>
              {applicationMessage && (
                <p
                  role="status"
                  className="rounded-xl border border-white/8 bg-white/[.03] px-4 py-3 text-xs text-[#BDBDBD]"
                >
                  {applicationMessage}
                </p>
              )}
              <button
                disabled={pending}
                className="mt-2 flex h-13 items-center justify-between rounded-full bg-white px-6 text-sm font-bold text-black transition hover:bg-[#FFC700] disabled:opacity-60"
              >
                {pending ? 'Enviando...' : 'Enviar inscrição'}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 fill-none stroke-current"
                >
                  <path d="M5 12h14M14 7l5 5-5 5" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </form>
          </div>
        </section>
      </div>

      <footer className="relative border-t border-white/8 bg-[#030303]">
        <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-center">
            <Brand />
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs text-[#858585]">
              <a
                href="https://instagram.com/prj.cinema"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#FFC700]"
              >
                @prj.cinema
              </a>
              <a href="mailto:contato@etecemcena.com.br" className="hover:text-[#FFC700]">
                contato@etecemcena.com.br
              </a>
              <button type="button" onClick={logout} className="hover:text-[#FFC700]">
                Sair
              </button>
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-white/8 pt-6 text-[9px] uppercase tracking-[0.2em] text-[#565656] sm:flex-row">
            <span>Turma de Administração 2026</span>
            <span>Projeto escolar de audiovisual</span>
          </div>
        </div>
      </footer>

      {onboardingOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-xl"
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/12 bg-[#0D0D0D]/95 p-7 shadow-[0_40px_120px_rgba(0,0,0,.8)] sm:p-9">
            <div className="absolute -right-24 -top-24 size-64 rounded-full bg-[#FFC700]/10 blur-3xl" />
            <div className="relative">
              <p className="eyebrow">Personalize sua sessão</p>
              <h2
                id="onboarding-title"
                className="mt-5 text-2xl font-medium leading-tight tracking-[-0.04em] sm:text-3xl"
              >
                Responda a 5 perguntas rápidas para personalizar sua experiência.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#909090]">
                Leva menos de um minuto e ajuda a equipe a entender o que você quer ver por aqui.
              </p>
              <div className="mt-8 flex gap-1.5">
                {questions.map((question, index) => (
                  <span
                    key={question.key}
                    className={`h-1 flex-1 rounded-full ${
                      index <= questionIndex ? 'bg-[#FFC700]' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-7 text-[10px] uppercase tracking-[0.22em] text-[#666]">
                Pergunta {questionIndex + 1} de {questions.length}
              </p>
              <p className="mt-3 min-h-16 text-lg font-medium leading-7">
                {questions[questionIndex].label}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => answerQuestion(true)}
                  className="rounded-full bg-white px-5 py-3.5 text-sm font-bold text-black transition hover:bg-[#FFC700]"
                >
                  Sim
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => answerQuestion(false)}
                  className="rounded-full border border-white/15 px-5 py-3.5 text-sm font-semibold text-white transition hover:border-[#FFC700]/60 hover:text-[#FFC700]"
                >
                  Não
                </button>
              </div>
              <p className="mt-5 text-center text-[10px] uppercase tracking-[0.18em] text-[#666]">
                Resposta necessária para continuar
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

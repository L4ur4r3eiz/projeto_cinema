'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction, signUpAction } from '../actions'
import { Brand } from '@/components/brand'

type FieldErrors = Partial<Record<'email' | 'password' | 'confirmPassword' | 'form', string>>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#EF4444]" role="alert">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="size-3.5 shrink-0 fill-none stroke-current"
      >
        <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" />
        <path d="M10 6.3v4.5M10 13.7h.01" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {message}
    </p>
  )
}

export function AuthScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [pending, startTransition] = useTransition()

  const submit = (formData: FormData) => {
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')
    const errors: FieldErrors = {}

    if (!email) errors.email = 'Campo obrigatório.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'E-mail inválido.'

    if (!password) errors.password = 'Campo obrigatório.'
    else if (password.length < 8) errors.password = 'Use no mínimo 8 caracteres.'

    if (mode === 'signup') {
      if (!confirmPassword) errors.confirmPassword = 'Campo obrigatório.'
      else if (password !== confirmPassword) errors.confirmPassword = 'As senhas não coincidem.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    startTransition(async () => {
      const result =
        mode === 'signup'
          ? await signUpAction({ email, password })
          : await loginAction({ email, password })
      if (result.ok) {
        window.localStorage.setItem('etec:onboarding', 'pending')
        router.push('/transicao')
        return
      }
      setFieldErrors({
        form: result.message,
      })
    })
  }

  return (
    <main className="min-h-screen bg-[#030303] px-3 py-3 text-white md:px-5 md:py-5">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1440px] overflow-hidden rounded-[28px] border border-white/8 bg-[#050505] md:min-h-[calc(100vh-40px)] md:grid-cols-[1.05fr_.95fr]">
        <section className="auth-visual relative hidden overflow-hidden p-12 md:flex md:flex-col lg:p-16">
          <div className="relative z-10">
            <Brand />
          </div>
          <div className="relative z-10 grid flex-1 place-items-center">
            <div className="text-center">
              <span className="mx-auto mb-7 block h-px w-16 bg-gradient-to-r from-transparent via-[#FFC700] to-transparent" />
              <h1 className="text-3xl font-medium tracking-[-0.055em] lg:text-5xl">
                Onde histórias
                <br />
                ganham vida
              </h1>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-6 py-14 sm:px-12 lg:px-20">
          <div className="absolute left-6 top-6 md:hidden">
            <Brand />
          </div>
          <div className="w-full max-w-md">
            <div className="mb-10 flex rounded-full border border-white/10 bg-[#0A0A0A] p-1">
              {(['signup', 'login'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setMode(tab)
                    setFieldErrors({})
                  }}
                  className={`flex-1 rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                    mode === tab ? 'bg-white text-black' : 'text-[#8B8B8B] hover:text-white'
                  }`}
                >
                  {tab === 'signup' ? 'Criar conta' : 'Entrar'}
                </button>
              ))}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#FFC700]">
              {mode === 'signup' ? 'Primeiro acesso' : 'Bem-vindo de volta'}
            </p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-0.045em] sm:text-4xl">
              {mode === 'signup' ? 'Crie sua conta' : 'Entre na sua conta'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#8F8F8F]">
              {mode === 'signup'
                ? 'Apenas o essencial. Você estará em cena em poucos segundos.'
                : 'Continue de onde parou e explore nossas produções.'}
            </p>

            <form action={submit} noValidate className="mt-9 grid gap-5">
              <label className="grid gap-2 text-xs font-medium text-[#D0D0D0]">
                E-mail
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={`h-13 rounded-xl border bg-[#0D0D0D] px-4 text-sm text-white outline-none transition placeholder:text-[#565656] focus:ring-2 ${
                    fieldErrors.email
                      ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/10'
                      : 'border-[#242424] focus:border-[#FFC700]/70 focus:ring-[#FFC700]/10'
                  }`}
                />
                <FieldError message={fieldErrors.email} />
              </label>
              <label className="grid gap-2 text-xs font-medium text-[#D0D0D0]">
                Senha
                <span className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="Mínimo de 8 caracteres"
                    aria-invalid={Boolean(fieldErrors.password)}
                    className={`h-13 w-full rounded-xl border bg-[#0D0D0D] px-4 pr-14 text-sm text-white outline-none transition placeholder:text-[#565656] focus:ring-2 ${
                      fieldErrors.password
                        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/10'
                        : 'border-[#242424] focus:border-[#FFC700]/70 focus:ring-[#FFC700]/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-widest text-[#777] hover:text-[#FFC700]"
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </span>
                <FieldError message={fieldErrors.password} />
              </label>
              {mode === 'signup' && (
                <label className="grid gap-2 text-xs font-medium text-[#D0D0D0]">
                  Confirmar senha
                  <input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Digite a senha novamente"
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    className={`h-13 rounded-xl border bg-[#0D0D0D] px-4 text-sm text-white outline-none transition placeholder:text-[#565656] focus:ring-2 ${
                      fieldErrors.confirmPassword
                        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/10'
                        : 'border-[#242424] focus:border-[#FFC700]/70 focus:ring-[#FFC700]/10'
                    }`}
                  />
                  <FieldError message={fieldErrors.confirmPassword} />
                </label>
              )}
              <FieldError message={fieldErrors.form} />
              <button
                disabled={pending}
                className="group mt-2 flex h-13 items-center justify-between rounded-full bg-white px-6 text-sm font-bold text-[#030303] transition hover:bg-[#FFC700] disabled:cursor-wait disabled:opacity-60"
              >
                {pending
                  ? 'Processando...'
                  : mode === 'signup'
                    ? 'Criar conta e continuar'
                    : 'Entrar na plataforma'}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 fill-none stroke-current transition group-hover:translate-x-1"
                >
                  <path d="M5 12h14M14 7l5 5-5 5" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
              className="mt-7 w-full text-center text-xs text-[#777] transition hover:text-white"
            >
              {mode === 'signup'
                ? 'Já tem uma conta? Entrar'
                : 'Ainda não tem uma conta? Criar agora'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

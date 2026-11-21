// Login dos administradores (contas separadas das contas da plataforma, como no /admin do Payload).
// O primeiro administrador é criado no servidor: uv run python -m app.cli criar-admin <email>
import { useEffect, useState, useTransition, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { adminLoginAction, buscar } from '../api'
import { Brand } from '../components/brand'

export function Admin() {
  const navigate = useNavigate()
  const [erro, setErro] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    buscar('/admin/me').then(({ status }) => status === 200 && navigate('/painel', { replace: true }))
  }, [navigate])

  const entrar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await adminLoginAction({
        email: String(data.get('email') ?? ''),
        password: String(data.get('password') ?? ''),
      })
      if (result.ok) navigate('/painel')
      else setErro(result.message)
    })
  }

  const campo =
    'h-13 rounded-xl border border-[#242424] bg-[#0D0D0D] px-4 text-sm text-white outline-none transition placeholder:text-[#565656] focus:border-[#FFC700]/70 focus:ring-2 focus:ring-[#FFC700]/10'

  return (
    <main className="grid min-h-screen place-items-center bg-[#030303] px-6 py-14 text-white">
      <section className="w-full max-w-md rounded-[28px] border border-[#222] bg-[#0D0D0D] p-8">
        <Brand />
        <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#FFC700]">Administração</p>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em]">Entrar como administrador</h1>
        <p className="mt-3 text-sm leading-6 text-[#8F8F8F]">
          Acesso exclusivo para quem administra o projeto. Contas do público entram pela tela de acesso.
        </p>
        <form onSubmit={entrar} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-xs font-medium text-[#D0D0D0]">
            E-mail
            <input name="email" type="email" required autoComplete="username" className={campo} />
          </label>
          <label className="grid gap-2 text-xs font-medium text-[#D0D0D0]">
            Senha
            <input name="password" type="password" required autoComplete="current-password" className={campo} />
          </label>
          {erro && (
            <p className="text-[11px] font-medium text-[#EF4444]" role="alert">
              {erro}
            </p>
          )}
          <button
            disabled={pending}
            className="mt-2 h-13 rounded-full bg-white px-6 text-sm font-bold text-[#030303] transition hover:bg-[#FFC700] disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? 'Processando...' : 'Entrar no painel'}
          </button>
        </form>
        <Link to="/acesso" className="mt-7 block text-center text-xs text-[#777] transition hover:text-white">
          Voltar à tela de acesso
        </Link>
      </section>
    </main>
  )
}

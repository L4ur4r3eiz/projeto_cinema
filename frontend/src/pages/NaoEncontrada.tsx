import { Link } from 'react-router'

export function NaoEncontrada() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-8 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="mt-4 text-[#929292]">O endereço que você procura não existe ou foi movido.</p>
      <Link className="mt-6 font-medium text-[#FFC700] underline-offset-4 hover:underline" to="/">
        &larr; Voltar ao início
      </Link>
    </main>
  )
}

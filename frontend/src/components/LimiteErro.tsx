import { Component, type ReactNode } from 'react'

// Se um pedaço carregado sob demanda falhar (chunk que não baixou, WebGL que travou),
// mostra o plano B em vez de derrubar a página inteira.
export class LimiteErro extends Component<{ plano: ReactNode; children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false }

  static getDerivedStateFromError() {
    return { falhou: true }
  }

  render() {
    return this.state.falhou ? this.props.plano : this.props.children
  }
}

export function FalhaAoCarregar() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#030303] px-6 text-center text-white">
      <div>
        <p className="text-sm text-[#A1A1A1]">Não foi possível carregar esta tela.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-full bg-white px-6 py-2.5 text-xs font-bold text-black transition hover:bg-[#FFC700]"
        >
          Recarregar a página
        </button>
      </div>
    </div>
  )
}

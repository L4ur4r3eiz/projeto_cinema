// Chamadas ao FastAPI. Os nomes seguem as antigas Server Actions do Next para as telas mudarem pouco.
export type ActionResult = { ok: boolean; message: string; url?: string }

export type PublicMedia = { url?: string | null; alt?: string | null }

export type PublicTeamMember = {
  id: string
  name: string
  role: string
  bio?: string | null
  photo?: PublicMedia | null
  order?: number | null
}

export type PublicShortFilm = {
  id: string
  title: string
  duration: string
  genre: string
  synopsis?: string | null
  youtubeURL?: string | null
  thumbnail?: PublicMedia | null
  order?: number | null
}

async function chamar(caminho: string, metodo = 'GET', corpo?: unknown): Promise<Response> {
  const formulario = corpo instanceof FormData
  return fetch(`/api${caminho}`, {
    method: metodo,
    credentials: 'same-origin',
    headers: corpo === undefined || formulario ? undefined : { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : formulario ? corpo : JSON.stringify(corpo),
  })
}

// ações: nunca lançam erro, sempre devolvem {ok, message} para a tela mostrar
async function acao(caminho: string, metodo: string, corpo?: unknown): Promise<ActionResult> {
  try {
    const resposta = await chamar(caminho, metodo, corpo)
    return (await resposta.json()) as ActionResult
  } catch {
    return { ok: false, message: 'Não foi possível conectar ao servidor. Tente novamente em instantes.' }
  }
}

// leituras: devolvem o status HTTP para a tela decidir (ex.: 403 no painel)
export async function buscar<T>(caminho: string): Promise<{ status: number; dados: T | null }> {
  const resposta = await chamar(caminho)
  return { status: resposta.status, dados: resposta.ok ? ((await resposta.json()) as T) : null }
}

type Credenciais = { email: string; password: string }

export const signUpAction = (dados: Credenciais) => acao('/auth/signup', 'POST', dados)
export const loginAction = (dados: Credenciais) => acao('/auth/login', 'POST', dados)
export const logoutAction = () => acao('/auth/logout', 'POST')
export const saveOnboardingAction = (answers: Record<string, boolean>) =>
  acao('/me/onboarding', 'PUT', { answers })
export const submitApplicationAction = (dados: {
  fullName: string
  email: string
  phone: string
  area: string
  message: string
}) => acao('/applications', 'POST', dados)

export const saveTeamMemberAction = ({ id, ...dados }: {
  id?: string
  name: string
  role: string
  bio: string
  photoUrl?: string
}) => acao(id ? `/team-members/${id}` : '/team-members', id ? 'PUT' : 'POST', dados)
export const saveFilmAction = ({ id, ...dados }: {
  id?: string
  title: string
  duration: string
  genre: string
  synopsis: string
  youtubeURL: string
  thumbnailUrl?: string
}) => acao(id ? `/short-films/${id}` : '/short-films', id ? 'PUT' : 'POST', dados)
export const removeCatalogItemAction = ({ kind, id }: { kind: 'team-members' | 'short-films'; id: string }) =>
  acao(`/${kind}/${id}`, 'DELETE')

export function uploadImageAction(arquivo: File) {
  const corpo = new FormData()
  corpo.append('arquivo', arquivo)
  return acao('/uploads', 'POST', corpo)
}
export const updateApplicationStatusAction = (id: string, status: string) =>
  acao(`/applications/${id}/status`, 'PATCH', { status })
export const updateUserRoleAction = (id: string, role: 'audience' | 'staff') =>
  acao(`/users/${id}/role`, 'PATCH', { role })

export const adminLoginAction = (dados: Credenciais) => acao('/admin/login', 'POST', dados)
export const adminLogoutAction = () => acao('/admin/logout', 'POST')

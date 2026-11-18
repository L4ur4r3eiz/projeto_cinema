'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { appAuth } from '@/lib/app-auth'
import { getCurrentProjectOperator } from '@/lib/project-operator'

export type ActionResult = {
  ok: boolean
  message: string
}

const cleanEmail = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

const cleanText = (value: unknown, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export async function signUpAction(input: {
  email: string
  password: string
}): Promise<ActionResult> {
  const email = cleanEmail(input.email)
  const password = typeof input.password === 'string' ? input.password : ''
  if (!validEmail(email)) return { ok: false, message: 'Informe um e-mail válido.' }
  if (password.length < 8)
    return { ok: false, message: 'A senha precisa ter pelo menos 8 caracteres.' }

  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        role: 'audience',
        onboardingCompleted: false,
      },
      draft: false,
      overrideAccess: false,
    })
    await appAuth.login(email, password)
    return { ok: true, message: 'Conta criada. Bem-vindo à sessão.' }
  } catch {
    return { ok: false, message: 'Este e-mail já está em uso ou os dados são inválidos.' }
  }
}

export async function loginAction(input: {
  email: string
  password: string
}): Promise<ActionResult> {
  const email = cleanEmail(input.email)
  const password = typeof input.password === 'string' ? input.password : ''
  if (!validEmail(email) || !password) {
    return { ok: false, message: 'Preencha e-mail e senha para entrar.' }
  }

  try {
    await appAuth.login(email, password)
    return { ok: true, message: 'Sessão iniciada.' }
  } catch {
    return { ok: false, message: 'E-mail ou senha incorretos.' }
  }
}

export async function logoutAction(): Promise<ActionResult> {
  await appAuth.logout()
  return { ok: true, message: 'Sessão encerrada.' }
}

export async function saveOnboardingAction(
  answers: Record<string, boolean>,
): Promise<ActionResult> {
  const user = await appAuth.currentUser()
  if (!user) return { ok: false, message: 'Entre novamente para salvar suas respostas.' }

  const payload = await getPayload({ config })
  const allowed = {
    likesShortFilms: Boolean(answers.likesShortFilms),
    wantsBehindTheScenes: Boolean(answers.wantsBehindTheScenes),
    interestedInActing: Boolean(answers.interestedInActing),
    interestedInProduction: Boolean(answers.interestedInProduction),
    wantsProjectNews: Boolean(answers.wantsProjectNews),
  }

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { onboardingCompleted: true, preferences: allowed },
    overrideAccess: false,
    user: user as never,
  })
  return { ok: true, message: 'Experiência personalizada.' }
}

export async function submitApplicationAction(input: {
  fullName: string
  email: string
  phone: string
  area: string
  message: string
}): Promise<ActionResult> {
  const fullName = cleanText(input.fullName, 120)
  const email = cleanEmail(input.email)
  const phone = cleanText(input.phone, 30)
  const allowedAreas = [
    'roteiro',
    'direcao',
    'fotografia',
    'atuacao',
    'figurino',
    'cenografia',
    'maquiagem',
    'edicao-som',
    'producao',
  ]
  const area = allowedAreas.includes(input.area)
    ? (input.area as
        | 'roteiro'
        | 'direcao'
        | 'fotografia'
        | 'atuacao'
        | 'figurino'
        | 'cenografia'
        | 'maquiagem'
        | 'edicao-som'
        | 'producao')
    : null
  const message = cleanText(input.message, 1000)

  if (fullName.length < 3 || !validEmail(email) || phone.length < 8 || !area) {
    return { ok: false, message: 'Revise os campos e tente novamente.' }
  }

  try {
    const payload = await getPayload({ config })
    const user = await appAuth.currentUser()
    await payload.create({
      collection: 'applications',
      data: { fullName, email, phone, area, message, status: 'new' },
      draft: false,
      overrideAccess: false,
      user: user as never,
    })
    return { ok: true, message: 'Inscrição recebida. A equipe entrará em contato.' }
  } catch {
    return { ok: false, message: 'Não foi possível enviar agora. Tente novamente em instantes.' }
  }
}

export async function saveTeamMemberAction(input: {
  id?: string
  name: string
  role: string
  bio: string
}): Promise<ActionResult> {
  const user = await getCurrentProjectOperator()
  if (!user) return { ok: false, message: 'Acesso restrito à equipe.' }
  const name = cleanText(input.name, 100)
  const role = cleanText(input.role, 100)
  const bio = cleanText(input.bio, 500)
  if (!name || !role) return { ok: false, message: 'Nome e função são obrigatórios.' }

  const payload = await getPayload({ config })
  if (input.id) {
    await payload.update({
      collection: 'team-members',
      id: input.id,
      data: { name, role, bio },
      overrideAccess: false,
      user: user as never,
    })
  } else {
    await payload.create({
      collection: 'team-members',
      data: { name, role, bio },
      overrideAccess: false,
      user: user as never,
    })
  }
  return { ok: true, message: input.id ? 'Integrante atualizado.' : 'Integrante adicionado.' }
}

export async function saveFilmAction(input: {
  id?: string
  title: string
  duration: string
  genre: string
  synopsis: string
  youtubeURL: string
}): Promise<ActionResult> {
  const user = await getCurrentProjectOperator()
  if (!user) return { ok: false, message: 'Acesso restrito à equipe.' }
  const data = {
    title: cleanText(input.title, 140),
    duration: cleanText(input.duration, 30),
    genre: cleanText(input.genre, 80),
    synopsis: cleanText(input.synopsis, 500),
    youtubeURL: cleanText(input.youtubeURL, 500),
  }
  if (!data.title || !data.duration || !data.genre) {
    return { ok: false, message: 'Título, duração e gênero são obrigatórios.' }
  }

  const payload = await getPayload({ config })
  if (input.id) {
    await payload.update({
      collection: 'short-films',
      id: input.id,
      data,
      overrideAccess: false,
      user: user as never,
    })
  } else {
    await payload.create({
      collection: 'short-films',
      data,
      overrideAccess: false,
      user: user as never,
    })
  }
  return { ok: true, message: input.id ? 'Curta atualizado.' : 'Curta adicionado.' }
}

export async function removeCatalogItemAction(input: {
  kind: 'team-members' | 'short-films'
  id: string
}): Promise<ActionResult> {
  const user = await getCurrentProjectOperator()
  if (!user) return { ok: false, message: 'Acesso restrito à equipe.' }
  const payload = await getPayload({ config })
  await payload.delete({
    collection: input.kind,
    id: input.id,
    overrideAccess: false,
    user: user as never,
  })
  return { ok: true, message: 'Item removido.' }
}

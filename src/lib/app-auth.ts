import 'server-only'

import config from '@payload-config'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

const SESSION_COOKIE = 'app-session'

export type AppUser = {
  id: string | number
  collection: 'users'
  email?: string | null
  role?: 'audience' | 'staff' | null
  onboardingCompleted?: boolean | null
}

export function createAppAuth(collection: 'users') {
  return {
    async currentUser(): Promise<AppUser | null> {
      const token = (await cookies()).get(SESSION_COOKIE)?.value
      if (!token) return null

      const payload = await getPayload({ config })
      const authHeaders = new Headers({ Authorization: `JWT ${token}` })
      const { user } = await payload.auth({ headers: authHeaders })
      if (!user || user.collection !== collection) return null
      return user as AppUser
    },

    async login(email: string, password: string): Promise<AppUser> {
      const payload = await getPayload({ config })
      const result = await payload.login({
        collection,
        data: { email, password },
        overrideAccess: false,
      })
      if (!result.token || !result.user) throw new Error('Não foi possível iniciar a sessão.')

      const cookieStore = await cookies()
      cookieStore.set(SESSION_COOKIE, result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: result.exp
          ? Math.max(result.exp - Math.floor(Date.now() / 1000), 60)
          : 60 * 60 * 24 * 7,
      })
      return result.user as AppUser
    },

    async logout(): Promise<void> {
      ;(await cookies()).delete(SESSION_COOKIE)
    },
  }
}

export const appAuth = createAppAuth('users')

import 'server-only'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { appAuth } from '@/lib/app-auth'

export async function getCurrentProjectOperator() {
  const appUser = await appAuth.currentUser()
  if (appUser?.role === 'staff') return appUser

  const payload = await getPayload({ config })
  const { user: cmsUser } = await payload.auth({ headers: await headers() })
  if (cmsUser?.collection === 'admins') return cmsUser

  return null
}

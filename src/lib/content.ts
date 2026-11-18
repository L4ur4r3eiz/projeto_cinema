import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

export type PublicMedia = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

export type PublicTeamMember = {
  id: string | number
  name: string
  role: string
  bio?: string | null
  photo?: PublicMedia | string | number | null
  order?: number | null
}

export type PublicShortFilm = {
  id: string | number
  title: string
  duration: string
  genre: string
  synopsis?: string | null
  youtubeURL?: string | null
  thumbnail?: PublicMedia | string | number | null
  order?: number | null
}

export const getHomeContent = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const [team, films] = await Promise.all([
      payload.find({
        collection: 'team-members',
        depth: 1,
        limit: 20,
        overrideAccess: false,
        sort: 'order',
      }),
      payload.find({
        collection: 'short-films',
        depth: 1,
        limit: 20,
        overrideAccess: false,
        sort: 'order',
      }),
    ])

    return {
      team: team.docs as unknown as PublicTeamMember[],
      films: films.docs as unknown as PublicShortFilm[],
    }
  },
  ['etec-home-content'],
  { tags: ['home-content'] },
)

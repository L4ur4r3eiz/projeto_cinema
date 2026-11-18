import type { Access } from 'payload'

type ProjectUser = {
  id: string | number
  collection?: string
  role?: 'audience' | 'staff'
}

export const isProjectStaff = (user: unknown): boolean => {
  const candidate = user as ProjectUser | null
  return (
    candidate?.collection === 'admins' ||
    (candidate?.collection === 'users' && candidate.role === 'staff')
  )
}

export const staffOnly: Access = ({ req }) => isProjectStaff(req.user)

export const staffOrSelf: Access = ({ req }) => {
  if (isProjectStaff(req.user)) return true
  if (req.user?.collection !== 'users') return false
  return { id: { equals: req.user.id } }
}

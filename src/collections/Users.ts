import type { CollectionConfig } from 'payload'
import { isProjectStaff, staffOrSelf } from '@/access/project-access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Conta da plataforma',
    plural: 'Contas da plataforma',
  },
  auth: true,
  access: {
    create: () => true,
    read: staffOrSelf,
    update: staffOrSelf,
    delete: ({ req }) => isProjectStaff(req.user),
  },
  admin: {
    group: 'Comunidade',
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'onboardingCompleted', 'createdAt'],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'audience',
      required: true,
      saveToJWT: true,
      options: [
        { label: 'Público', value: 'audience' },
        { label: 'Equipe', value: 'staff' },
      ],
      access: {
        create: ({ req }) => isProjectStaff(req.user),
        update: ({ req }) => isProjectStaff(req.user),
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'onboardingCompleted',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'preferences',
      type: 'group',
      fields: [
        { name: 'likesShortFilms', type: 'checkbox', label: 'Gosta de curtas-metragens' },
        { name: 'wantsBehindTheScenes', type: 'checkbox', label: 'Quer ver bastidores' },
        { name: 'interestedInActing', type: 'checkbox', label: 'Tem interesse em atuação' },
        { name: 'interestedInProduction', type: 'checkbox', label: 'Tem interesse em produção' },
        { name: 'wantsProjectNews', type: 'checkbox', label: 'Quer receber novidades' },
      ],
    },
  ],
  versions: false,
}

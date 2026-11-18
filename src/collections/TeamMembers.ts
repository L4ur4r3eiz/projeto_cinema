import type { CollectionConfig } from 'payload'
import { staffOnly } from '@/access/project-access'
import { revalidateHomeAfterChange, revalidateHomeAfterDelete } from '@/hooks/revalidate-home'

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  labels: { singular: 'Integrante', plural: 'Integrantes' },
  access: {
    create: staffOnly,
    delete: staffOnly,
    read: () => true,
    update: staffOnly,
  },
  admin: {
    group: 'Catálogo',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'order'],
  },
  hooks: {
    afterChange: [revalidateHomeAfterChange],
    afterDelete: [revalidateHomeAfterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'bio', type: 'textarea' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
  versions: false,
}

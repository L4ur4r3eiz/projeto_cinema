import type { CollectionConfig } from 'payload'
import { staffOnly } from '@/access/project-access'
import { revalidateHomeAfterChange, revalidateHomeAfterDelete } from '@/hooks/revalidate-home'

export const ShortFilms: CollectionConfig = {
  slug: 'short-films',
  labels: { singular: 'Curta-metragem', plural: 'Curtas-metragens' },
  access: {
    create: staffOnly,
    delete: staffOnly,
    read: () => true,
    update: staffOnly,
  },
  admin: {
    group: 'Catálogo',
    useAsTitle: 'title',
    defaultColumns: ['title', 'genre', 'duration', 'order'],
  },
  hooks: {
    afterChange: [revalidateHomeAfterChange],
    afterDelete: [revalidateHomeAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'duration', type: 'text', required: true },
    { name: 'genre', type: 'text', required: true },
    { name: 'synopsis', type: 'textarea' },
    { name: 'youtubeURL', type: 'text' },
    { name: 'thumbnail', type: 'upload', relationTo: 'media' },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
  versions: false,
}

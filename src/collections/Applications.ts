import type { CollectionConfig } from 'payload'
import { isProjectStaff, staffOnly } from '@/access/project-access'

export const Applications: CollectionConfig = {
  slug: 'applications',
  labels: { singular: 'Inscrição', plural: 'Inscrições' },
  access: {
    create: () => true,
    delete: staffOnly,
    read: staffOnly,
    update: staffOnly,
  },
  admin: {
    group: 'Comunidade',
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'area', 'status', 'createdAt'],
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create') {
          if (req.user?.collection === 'users') data.user = req.user.id
          else delete data.user
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'fullName', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', required: true },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      access: {
        create: () => false,
        update: ({ req }) => isProjectStaff(req.user),
      },
      admin: { position: 'sidebar' },
    },
    { name: 'message', type: 'textarea', maxLength: 1000 },
    {
      name: 'area',
      type: 'select',
      required: true,
      options: [
        { label: 'Roteiro', value: 'roteiro' },
        { label: 'Direção', value: 'direcao' },
        { label: 'Fotografia', value: 'fotografia' },
        { label: 'Atriz / Ator', value: 'atuacao' },
        { label: 'Figurino', value: 'figurino' },
        { label: 'Cenografia', value: 'cenografia' },
        { label: 'Maquiagem', value: 'maquiagem' },
        { label: 'Edição e som', value: 'edicao-som' },
        { label: 'Produção', value: 'producao' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      required: true,
      options: [
        { label: 'Nova', value: 'new' },
        { label: 'Em contato', value: 'contacted' },
        { label: 'Aprovada', value: 'approved' },
        { label: 'Arquivada', value: 'archived' },
      ],
      access: {
        create: () => false,
        update: ({ req }) =>
          req.user?.collection === 'admins' ||
          (req.user?.collection === 'users' && (req.user as { role?: string }).role === 'staff'),
      },
      admin: { position: 'sidebar' },
    },
  ],
  versions: false,
}

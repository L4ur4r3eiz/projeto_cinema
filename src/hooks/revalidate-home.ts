import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

export const revalidateHomeAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidateTag('home-content', 'max')
  return doc
}

export const revalidateHomeAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateTag('home-content', 'max')
  return doc
}

import type { Entry } from '@ecency/sdk'

export const resolveMetadata = (metadata: Entry['json_metadata']) => {
  if (!metadata) return {}
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata)
    } catch {
      return {}
    }
  }
  return metadata
}

export const resolveTags = (metadata: Entry['json_metadata']) => {
  const resolved = resolveMetadata(metadata)
  if (!Array.isArray(resolved?.tags)) return []
  return resolved.tags
}

export const resolveApp = (metadata: Entry['json_metadata']) => {
  const resolved = resolveMetadata(metadata)
  if (!resolved || typeof resolved.app !== 'string') return undefined
  const [app] = resolved.app.split('/')
  return app?.trim() || undefined
}

export const resolveImages = (metadata: Entry['json_metadata']): string[] => {
  const resolved = resolveMetadata(metadata)
  if (!Array.isArray(resolved?.image)) return []
  return resolved.image.filter((img: unknown): img is string => typeof img === 'string')
}

export const resolveCoverImageUrl = (metadata: Entry['json_metadata']): string | undefined => {
  const images = resolveImages(metadata)
  return images[0]
}

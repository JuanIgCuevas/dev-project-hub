export function safeExternalUrl(value: string | null | undefined) {
  const candidate = value?.trim()
  if (!candidate) return null

  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:' ? candidate : null
  } catch {
    return null
  }
}

export const isSafeExternalUrl = (value: string | null | undefined) => Boolean(safeExternalUrl(value))

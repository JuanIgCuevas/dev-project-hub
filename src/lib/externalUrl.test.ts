import { describe, expect, it } from 'vitest'
import { isSafeExternalUrl, safeExternalUrl } from './externalUrl'

describe('external URLs', () => {
  it('accepts only complete HTTP and HTTPS links', () => {
    expect(safeExternalUrl(' https://example.com/project ')).toBe('https://example.com/project')
    expect(isSafeExternalUrl('http://localhost:4173')).toBe(true)
    expect(safeExternalUrl('/relative-path')).toBeNull()
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(safeExternalUrl('data:text/html,test')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import vercelConfig from '../../vercel.json'

describe('production security headers', () => {
  it('keeps the core browser protections enabled', () => {
    const globalRule = vercelConfig.headers.find(rule => rule.source === '/(.*)')
    const headers = Object.fromEntries(globalRule?.headers.map(header => [header.key, header.value]) ?? [])

    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Permissions-Policy']).toContain('camera=()')
    expect(headers['Content-Security-Policy']).toContain("object-src 'none'")
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'")
    expect(headers['Content-Security-Policy']).not.toContain("script-src 'self' 'unsafe-inline'")
  })
})

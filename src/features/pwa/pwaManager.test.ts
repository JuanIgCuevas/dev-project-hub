import { describe, expect, it, vi } from 'vitest'
import { getPwaState, promptInstall, registerPwa } from './pwaManager'

describe('pwaManager', () => {
  it('tracks the connection and captures the browser install prompt', async () => {
    registerPwa()

    window.dispatchEvent(new Event('offline'))
    expect(getPwaState().online).toBe(false)

    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted'; platform: string }>
    }
    event.prompt = prompt
    event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' })
    window.dispatchEvent(event)

    expect(getPwaState().canInstall).toBe(true)
    await expect(promptInstall()).resolves.toBe(true)
    expect(prompt).toHaveBeenCalledOnce()
    expect(getPwaState().canInstall).toBe(false)
  })
})

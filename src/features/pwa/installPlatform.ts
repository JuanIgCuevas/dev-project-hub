export type InstallPlatform = 'android' | 'ios' | 'desktop'

export function detectInstallPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'desktop'
  const userAgent = navigator.userAgent.toLowerCase()
  const isIPadDesktopMode = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (/iphone|ipad|ipod/.test(userAgent) || isIPadDesktopMode) return 'ios'
  if (userAgent.includes('android')) return 'android'
  return 'desktop'
}

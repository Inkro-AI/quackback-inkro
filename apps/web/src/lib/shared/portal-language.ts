import { normalizeLocale, resolveLocale } from './i18n'

export const PORTAL_LANGUAGES = ['sk', 'cs', 'en'] as const
export type PortalLanguage = (typeof PORTAL_LANGUAGES)[number]
export type PortalLanguagePreference = PortalLanguage | 'auto'
export const PORTAL_LANGUAGE_COOKIE = 'inkro_portal_language'

export function isPortalLanguage(value: unknown): value is PortalLanguage {
  return typeof value === 'string' && (PORTAL_LANGUAGES as readonly string[]).includes(value)
}

export function readPortalLanguagePreference(
  cookie: string | null | undefined
): PortalLanguagePreference {
  const entry = cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PORTAL_LANGUAGE_COOKIE}=`))
  const value = entry?.slice(PORTAL_LANGUAGE_COOKIE.length + 1)
  return isPortalLanguage(value) ? value : 'auto'
}

export function resolvePortalLanguage(
  acceptLanguage: string | null | undefined,
  cookie?: string | null
): PortalLanguage {
  const preference = readPortalLanguagePreference(cookie)
  if (preference !== 'auto') return preference
  // Keep the browser's quality weights, including q=0 exclusions, while
  // considering only the three languages offered by this portal.
  const supported = acceptLanguage
    ?.split(',')
    .filter((entry) => isPortalLanguage(normalizeLocale(entry.split(';')[0].trim())))
    .join(',')
  return resolveLocale(supported) as PortalLanguage
}

export function portalLanguageCookie(
  preference: PortalLanguagePreference,
  secure: boolean
): string {
  const value = isPortalLanguage(preference) ? preference : ''
  return `${PORTAL_LANGUAGE_COOKIE}=${value}; Path=/; Max-Age=${value ? 31536000 : 0}; SameSite=Lax${secure ? '; Secure' : ''}`
}

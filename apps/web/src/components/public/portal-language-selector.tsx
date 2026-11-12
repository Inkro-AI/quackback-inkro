import { useState } from 'react'
import { useRouteContext, useRouter } from '@tanstack/react-router'
import { useIntl } from 'react-intl'
import { LanguageIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import {
  isPortalLanguage,
  portalLanguageCookie,
  readPortalLanguagePreference,
  type PortalLanguagePreference,
} from '@/lib/shared/portal-language'

/** A host-only cookie also lets SSR use the choice on the very first paint. */
export function PortalLanguageSelector() {
  const intl = useIntl()
  const router = useRouter()
  const preference = useRouteContext({
    from: '__root__',
    select: (context) => context.portalLanguagePreference ?? 'auto',
  })
  const [pending, setPending] = useState(false)
  const label = intl.formatMessage({ id: 'portal.language.label', defaultMessage: 'Language' })

  async function changeLanguage(value: string) {
    if (value !== 'auto' && !isPortalLanguage(value)) return
    setPending(true)
    try {
      document.cookie = portalLanguageCookie(
        value as PortalLanguagePreference,
        location.protocol === 'https:'
      )
      if (readPortalLanguagePreference(document.cookie) !== value)
        throw new Error('Cookie unavailable')
      // Invalidates the root context and route catalogs without discarding a
      // visitor's unsent feedback or navigating away from the current page.
      await router.invalidate()
    } catch {
      toast.error(
        intl.formatMessage({
          id: 'portal.language.error',
          defaultMessage: 'Could not change the language. Allow cookies and try again.',
        })
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <label className="portal-language-selector me-1 inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--header-border)] px-2 py-1.5 text-[var(--header-foreground)]">
      <LanguageIcon aria-hidden="true" className="h-4 w-4" />
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={preference}
        disabled={pending}
        onChange={(event) => void changeLanguage(event.target.value)}
        className="max-w-[7rem] cursor-pointer bg-transparent text-sm outline-offset-2 disabled:opacity-50"
      >
        <option value="auto">
          {intl.formatMessage({ id: 'portal.language.auto', defaultMessage: 'Automatic' })}
        </option>
        <option value="sk" lang="sk">
          Slovenčina
        </option>
        <option value="cs" lang="cs">
          Čeština
        </option>
        <option value="en" lang="en">
          English
        </option>
      </select>
    </label>
  )
}

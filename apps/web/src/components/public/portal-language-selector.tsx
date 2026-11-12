import { useState } from 'react'
import { useRouteContext, useRouter } from '@tanstack/react-router'
import { useIntl } from 'react-intl'
import { LanguageIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/shared/utils'
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="portal-language-selector h-9 w-9"
          aria-label={label}
          title={label}
          disabled={pending}
        >
          <LanguageIcon aria-hidden="true" className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {[
          {
            value: 'auto',
            label: intl.formatMessage({
              id: 'portal.language.auto',
              defaultMessage: 'Automatic',
            }),
          },
          { value: 'sk', label: 'Slovenčina', lang: 'sk' },
          { value: 'cs', label: 'Čeština', lang: 'cs' },
          { value: 'en', label: 'English', lang: 'en' },
        ].map((language) => (
          <DropdownMenuItem
            key={language.value}
            onClick={() => void changeLanguage(language.value)}
            aria-current={preference === language.value ? true : undefined}
            lang={language.lang}
            disabled={pending}
            className={cn(preference === language.value && 'bg-accent')}
          >
            {language.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

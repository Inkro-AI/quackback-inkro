/** Translate only the shipped English status names, never custom names or content. */
const labels: Record<string, Record<string, string>> = {
  sk: {
    Open: 'Otvorené',
    'Under Review': 'Posudzujeme',
    Planned: 'Plánované',
    'In Progress': 'Pracujeme na tom',
    Complete: 'Dokončené',
    Closed: 'Uzavreté',
  },
  cs: {
    Open: 'Otevřeno',
    'Under Review': 'Posuzujeme',
    Planned: 'Plánováno',
    'In Progress': 'Pracujeme na tom',
    Complete: 'Dokončeno',
    Closed: 'Uzavřeno',
  },
}

export function portalStatusLabel(name: string, locale: string): string {
  return labels[locale]?.[name] ?? name
}

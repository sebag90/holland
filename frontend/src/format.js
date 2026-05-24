// German date/time formatting helpers: DD.MM.YYYY and DD.MM.YYYY HH:MM
const datePartsFmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric',
})
const dateTimePartsFmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
})

export function fmtDateTime(input) {
  if (!input) return ''
  const d = input instanceof Date ? input : new Date(input)
  // Intl gives "DD.MM.YYYY, HH:MM" — drop the comma to match spec
  return dateTimePartsFmt.format(d).replace(',', '')
}

export function fmtDate(input) {
  if (!input) return ''
  // ISO date string ("YYYY-MM-DD") -> avoid TZ shift by parsing parts
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split('-')
    return `${d}.${m}.${y}`
  }
  const d = input instanceof Date ? input : new Date(input)
  return datePartsFmt.format(d)
}

export function fmtMonth(date) {
  return new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(date)
}

export const DOW_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function parseDateInput(value: string): Date | null {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

export function dateInputToTimestamp(value: string, hours = 0, minutes = 0): number | null {
  const date = parseDateInput(value)
  if (!date) return null

  date.setHours(hours, minutes, 0, 0)
  return date.getTime()
}

export function timestampToDateInput(value: number | null | undefined): string {
  if (value == null) return ''
  return formatDateInput(new Date(value))
}

export function formatDateLabel(
  value: number | string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string {
  if (value == null || value === '') return ''

  if (typeof value === 'string') {
    const parsed = parseDateInput(value)
    return parsed
      ? parsed.toLocaleDateString('de-DE', options)
      : value
  }

  return new Date(value).toLocaleDateString('de-DE', options)
}

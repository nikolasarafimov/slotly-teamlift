export function getLocalDateKey(value: string): string {
  const date = new Date(value)

  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

export function formatShortDate(
  value: string,
): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function getTimeZone(): string {
  return (
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone || 'Local time'
  )
}

export function getSlotEndTime(
  startsAt: string,
  durationMinutes: number,
): string {
  const end = new Date(
    new Date(startsAt).getTime() +
      durationMinutes * 60_000,
  )

  return formatTime(end.toISOString())
}
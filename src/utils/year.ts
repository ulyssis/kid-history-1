/** Astronomical year: negative = BCE (year -1 = 1 BCE). No year 0. */
export function formatYear(year: number, lang: string): string {
  if (year < 0) {
    const abs = Math.abs(year)
    if (lang === 'de') return `${abs} v. Chr.`
    if (lang === 'zh') return `公元前${abs}年`
    return `${abs} BCE`
  }
  if (lang === 'de') return `${year} n. Chr.`
  if (lang === 'zh') return `公元${year}年`
  return `${year} CE`
}

export function formatYearRange(
  startYear: number,
  endYear: number,
  lang: string,
): string {
  if (startYear === endYear) return formatYear(startYear, lang)
  return `${formatYear(startYear, lang)} – ${formatYear(endYear, lang)}`
}

/** Instant events stay visible in a scrubbing window so kids can find them. */
export function isEventVisible(
  startYear: number,
  endYear: number,
  year: number,
  window = 20,
): boolean {
  if (startYear === endYear) {
    return Math.abs(year - startYear) <= window
  }
  return year >= startYear && year <= endYear
}

export const MIN_YEAR = -4000
export const MAX_YEAR = new Date().getFullYear()

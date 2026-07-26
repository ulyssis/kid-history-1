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

/** Show event only while the timeline year is inside [startYear, endYear]. */
export function isEventVisible(
  startYear: number,
  endYear: number,
  year: number,
): boolean {
  const lo = Math.min(startYear, endYear)
  const hi = Math.max(startYear, endYear)
  return year >= lo && year <= hi
}

export const MIN_YEAR = -3700
export const MAX_YEAR = new Date().getFullYear()

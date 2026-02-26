/**
 * Congés scolaires de la Fédération Wallonie-Bruxelles (FWB)
 * Sources:
 *   - 2025-2026: https://www.rtbf.be/article/voici-le-calendrier-des-vacances-pour-l-annee-scolaire-2025-2026-en-federation-wallonie-bruxelles-11470484
 *   - 2026-2027: https://www.rtbf.be/article/voici-les-dates-conges-scolaires-pour-l-annee-2026-2027-en-federation-wallonie-bruxelles-11576448
 */

const SCHOOL_HOLIDAYS = [
  // ── 2025-2026 ──
  { start: '2025-10-20', end: '2025-10-31', label: 'Congé de Toussaint' },
  { start: '2025-11-11', end: '2025-11-11', label: 'Armistice' },
  { start: '2025-12-22', end: '2026-01-02', label: 'Congé de Noël' },
  { start: '2026-02-16', end: '2026-02-27', label: 'Congé de Carnaval' },
  { start: '2026-04-06', end: '2026-04-06', label: 'Lundi de Pâques' },
  { start: '2026-04-27', end: '2026-05-08', label: 'Congé de printemps' },
  { start: '2026-05-14', end: '2026-05-14', label: 'Ascension' },
  { start: '2026-05-25', end: '2026-05-25', label: 'Lundi de Pentecôte' },
  { start: '2026-07-01', end: '2026-08-23', label: 'Vacances d\'été' },

  // ── 2026-2027 ──
  { start: '2026-10-19', end: '2026-10-30', label: 'Congé de Toussaint' },
  { start: '2026-11-02', end: '2026-11-02', label: 'Toussaint' },
  { start: '2026-11-11', end: '2026-11-11', label: 'Armistice' },
  { start: '2026-12-21', end: '2027-01-01', label: 'Congé de Noël' },
  { start: '2027-02-09', end: '2027-02-09', label: 'Mardi Gras' },
  { start: '2027-02-22', end: '2027-03-05', label: 'Congé de Carnaval' },
  { start: '2027-03-29', end: '2027-03-29', label: 'Lundi de Pâques' },
  { start: '2027-04-26', end: '2027-05-07', label: 'Congé de printemps' },
  { start: '2027-05-06', end: '2027-05-06', label: 'Ascension' },
  { start: '2027-05-17', end: '2027-05-17', label: 'Lundi de Pentecôte' },
  { start: '2027-07-01', end: '2027-08-22', label: 'Vacances d\'été' },
]

/**
 * Returns the school holiday for a given date string (YYYY-MM-DD), or null.
 */
export function getSchoolHoliday(dateStr) {
  return SCHOOL_HOLIDAYS.find((h) => dateStr >= h.start && dateStr <= h.end) || null
}

/**
 * Returns true if the given date string falls within a school holiday.
 */
export function isSchoolHoliday(dateStr) {
  return SCHOOL_HOLIDAYS.some((h) => dateStr >= h.start && dateStr <= h.end)
}

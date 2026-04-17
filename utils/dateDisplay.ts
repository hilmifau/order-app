const pad2 = (n: number) => String(n).padStart(2, '0');

/** Indonesian short weekday labels (getDay: 0 = Sunday). */
const WEEKDAY_SHORT_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function toDdMmYyyy(year: number, month1to12: number, day: number) {
  return `${pad2(day)}-${pad2(month1to12)}-${year}`;
}

/**
 * Normalizes API / ISO / yyyy-mm-dd strings to display as dd-mm-yyyy.
 * Returns '-' for empty; passes through unparseable strings unchanged.
 */
export function formatDateDdMmYyyy(input: string | Date | null | undefined): string {
  if (input == null || input === '') return '-';
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return '-';
    return toDdMmYyyy(input.getFullYear(), input.getMonth() + 1, input.getDate());
  }
  const s = String(input).trim();
  const dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return `${dmy[1]}-${dmy[2]}-${dmy[3]}`;
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return toDdMmYyyy(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  return s;
}

/** Readable label for pickers: "Sen, 17-04-2026". */
export function formatDateLabelWithWeekday(date: Date): string {
  const wd = WEEKDAY_SHORT_ID[date.getDay()] ?? '';
  return `${wd}, ${formatDateDdMmYyyy(date)}`;
}

export function formatNowDdMmYyyy(): string {
  return formatDateDdMmYyyy(new Date());
}

export function formatTime24h(date: Date = new Date()): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

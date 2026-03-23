import KoreanLunarCalendar from 'korean-lunar-calendar';

/**
 * 음력 날짜를 양력 날짜로 변환
 * @param lunarYear 음력 연도
 * @param lunarMonth 음력 월
 * @param lunarDay 음력 일
 * @param isLeapMonth 윤달 여부
 * @returns 양력 날짜 문자열 (YYYY-MM-DD) 또는 null (변환 실패)
 */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth = false
): string | null {
  try {
    const cal = new KoreanLunarCalendar();
    const success = cal.setLunarDate(lunarYear, lunarMonth, lunarDay, isLeapMonth);
    if (!success) return null;
    const solar = cal.getSolarCalendar();
    if (!solar.year) return null;
    const y = String(solar.year);
    const m = String(solar.month).padStart(2, '0');
    const d = String(solar.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return null;
  }
}

/**
 * 양력 날짜를 음력 날짜로 변환 (프로필 표시용)
 */
export function solarToLunar(
  solarYear: number,
  solarMonth: number,
  solarDay: number
): { year: number; month: number; day: number; isLeapMonth: boolean } | null {
  try {
    const cal = new KoreanLunarCalendar();
    const success = cal.setSolarDate(solarYear, solarMonth, solarDay);
    if (!success) return null;
    const lunar = cal.getLunarCalendar();
    return {
      year: lunar.year,
      month: lunar.month,
      day: lunar.day,
      isLeapMonth: !!lunar.intercalation,
    };
  } catch {
    return null;
  }
}

/**
 * 특정 음력 연월에 해당하는 최대 일수를 반환
 */
export function getLunarMonthDays(year: number, month: number, isLeapMonth = false): number {
  try {
    const cal = new KoreanLunarCalendar();
    for (let day = 30; day >= 28; day--) {
      const success = cal.setLunarDate(year, month, day, isLeapMonth);
      if (success) return day;
    }
    return 29;
  } catch {
    return 29;
  }
}

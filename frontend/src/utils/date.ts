export interface SessionDateInfo {
  dateStr: string;     // "2026-07-01"
  dayNameKor: string;  // "수"
  dayNameEng: string;  // "Wed"
  formatted: string;   // "7/1(수)"
  date: Date;
}

export function getSessionDatesForWeek(startDateStr: string, endDateStr: string, weekNum: number): SessionDateInfo[] {
  const daysEng = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysKor = ["일", "월", "화", "수", "목", "금", "토"];

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return [];
  }

  // Calculate all dates in range
  const allDates: SessionDateInfo[] = [];
  let curr = new Date(start);
  while (curr <= end) {
    const dayIndex = curr.getDay();
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const dateVal = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dateVal}`;

    allDates.push({
      dateStr,
      dayNameKor: daysKor[dayIndex],
      dayNameEng: daysEng[dayIndex],
      formatted: `${curr.getMonth() + 1}/${curr.getDate()}(${daysKor[dayIndex]})`,
      date: new Date(curr)
    });

    curr.setDate(curr.getDate() + 1);
  }

  // Paginate by week (7 days per week)
  const startIndex = (weekNum - 1) * 7;
  return allDates.slice(startIndex, startIndex + 7);
}

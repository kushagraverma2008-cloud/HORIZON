// horizon/public/js/parser.js
// Natural language date/time & priority parser for Horizon quick-add

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

const WEEKDAY_MAP = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6
};

/**
 * Parses natural language task input.
 * @param {string} input - The raw quick-add text
 * @param {Date} [baseNow=new Date()] - Reference point for time calculations
 * @returns {{
 *   parsed: boolean,
 *   title: string,
 *   rawTitle: string,
 *   dueAt: Date | null,
 *   priority: "low" | "medium" | "high",
 *   matchedSegments: string[]
 * }}
 */
export function parseQuickAdd(input, baseNow = new Date()) {
  if (!input || typeof input !== 'string') {
    return {
      parsed: false,
      title: '',
      rawTitle: '',
      dueAt: null,
      priority: 'medium',
      matchedSegments: []
    };
  }

  const rawTitle = input.trim();
  let workingText = rawTitle;
  const matchedSegments = [];

  // 1. Extract Priority tags: !high, !low, !med, !medium
  let priority = 'medium';
  const priorityRegex = /(?:^|\s)!(high|low|medium|med)(?:\s|$)/i;
  const priMatch = workingText.match(priorityRegex);
  if (priMatch) {
    const p = priMatch[1].toLowerCase();
    priority = (p === 'high') ? 'high' : (p === 'low') ? 'low' : 'medium';
    matchedSegments.push(priMatch[0].trim());
    workingText = workingText.replace(priMatch[0], ' ');
  }

  let foundDate = null; // { year, month (0-11), day }
  let foundTime = null; // { hours (0-23), minutes (0-59) }

  // 2. Parse Relative expressions: "day after tomorrow", "tomorrow", "tonight", "today"
  const dayAfterTomorrowRegex = /\b(?:the\s+)?day\s+after\s+tomorrow\b/i;
  if (dayAfterTomorrowRegex.test(workingText)) {
    const match = workingText.match(dayAfterTomorrowRegex)[0];
    matchedSegments.push(match);
    workingText = workingText.replace(match, ' ');
    const d = new Date(baseNow.getFullYear(), baseNow.getMonth(), baseNow.getDate() + 2);
    foundDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }

  const tomorrowRegex = /\btomorrow\b/i;
  if (!foundDate && tomorrowRegex.test(workingText)) {
    const match = workingText.match(tomorrowRegex)[0];
    matchedSegments.push(match);
    workingText = workingText.replace(match, ' ');
    const d = new Date(baseNow.getFullYear(), baseNow.getMonth(), baseNow.getDate() + 1);
    foundDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }

  const tonightRegex = /\btonight\b/i;
  if (!foundDate && tonightRegex.test(workingText)) {
    const match = workingText.match(tonightRegex)[0];
    matchedSegments.push(match);
    workingText = workingText.replace(match, ' ');
    foundDate = { year: baseNow.getFullYear(), month: baseNow.getMonth(), day: baseNow.getDate() };
    if (!foundTime) {
      foundTime = { hours: 21, minutes: 0 }; // 9:00 PM
    }
  }

  const todayRegex = /\btoday\b/i;
  if (!foundDate && todayRegex.test(workingText)) {
    const match = workingText.match(todayRegex)[0];
    matchedSegments.push(match);
    workingText = workingText.replace(match, ' ');
    foundDate = { year: baseNow.getFullYear(), month: baseNow.getMonth(), day: baseNow.getDate() };
  }

  // 3. "in X days / weeks / months / hours / mins"
  const inRegex = /\bin\s+(\d+)\s*(min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|m|mo|month|months)\b/i;
  const inMatch = workingText.match(inRegex);
  if (!foundDate && inMatch) {
    const count = parseInt(inMatch[1], 10);
    const unit = inMatch[2].toLowerCase();
    matchedSegments.push(inMatch[0]);
    workingText = workingText.replace(inMatch[0], ' ');

    if (unit.startsWith('min')) {
      const d = new Date(baseNow.getTime() + count * 60 * 1000);
      foundDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      foundTime = { hours: d.getHours(), minutes: d.getMinutes() };
    } else if (unit.startsWith('h')) {
      const d = new Date(baseNow.getTime() + count * 3600 * 1000);
      foundDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      foundTime = { hours: d.getHours(), minutes: d.getMinutes() };
    } else if (unit.startsWith('d')) {
      const d = new Date(baseNow.getFullYear(), baseNow.getMonth(), baseNow.getDate() + count);
      foundDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    } else if (unit.startsWith('w')) {
      const d = new Date(baseNow.getFullYear(), baseNow.getMonth(), baseNow.getDate() + count * 7);
      foundDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    } else if (unit.startsWith('m')) {
      // Month addition with clamping
      const targetYear = baseNow.getFullYear();
      const targetMonth = baseNow.getMonth() + count;
      const targetDay = baseNow.getDate();
      const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const clampedDay = Math.min(targetDay, maxDaysInTargetMonth);
      const d = new Date(targetYear, targetMonth, clampedDay);
      foundDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    }
  }

  // 4. "next week", "next month"
  const nextWeekRegex = /\bnext\s+week\b/i;
  if (!foundDate && nextWeekRegex.test(workingText)) {
    const match = workingText.match(nextWeekRegex)[0];
    matchedSegments.push(match);
    workingText = workingText.replace(match, ' ');
    const d = new Date(baseNow.getFullYear(), baseNow.getMonth(), baseNow.getDate() + 7);
    foundDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }

  const nextMonthRegex = /\bnext\s+month\b/i;
  if (!foundDate && nextMonthRegex.test(workingText)) {
    const match = workingText.match(nextMonthRegex)[0];
    matchedSegments.push(match);
    workingText = workingText.replace(match, ' ');
    const targetMonth = baseNow.getMonth() + 1;
    const targetYear = baseNow.getFullYear();
    const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
    const clampedDay = Math.min(baseNow.getDate(), maxDays);
    const d = new Date(targetYear, targetMonth, clampedDay);
    foundDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }

  // 5. Weekday names: e.g. "friday", "next friday", "on wednesday"
  const weekdayRegex = /\b(?:on\s+)?(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\b/i;
  const wdMatch = workingText.match(weekdayRegex);
  if (!foundDate && wdMatch) {
    const isNext = Boolean(wdMatch[1]);
    const dayStr = wdMatch[2].toLowerCase();
    const targetDayIndex = WEEKDAY_MAP[dayStr];
    matchedSegments.push(wdMatch[0]);
    workingText = workingText.replace(wdMatch[0], ' ');

    const currentDayIndex = baseNow.getDay();
    let daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;
    if (daysToAdd === 0) {
      daysToAdd = 7; // today is that weekday, so target is next week's occurrence
    }
    if (isNext && daysToAdd < 7) {
      daysToAdd += 7;
    }
    const d = new Date(baseNow.getFullYear(), baseNow.getMonth(), baseNow.getDate() + daysToAdd);
    foundDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }

  // 6. Explicit Calendar Dates:
  // Examples: "20 nov", "20 november", "nov 20", "november 20", "20/11", "20/11/2026"
  const slashDateRegex = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;
  const slashMatch = workingText.match(slashDateRegex);
  if (!foundDate && slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1; // 0-indexed
    let year = slashMatch[3] ? parseInt(slashMatch[3], 10) : baseNow.getFullYear();
    if (year < 100) year += 2000;
    matchedSegments.push(slashMatch[0]);
    workingText = workingText.replace(slashMatch[0], ' ');
    foundDate = { year, month, day };
  }

  // "20 nov", "20 november"
  const dayMonthRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)(?:\s+(\d{4}))?\b/i;
  const dmMatch = workingText.match(dayMonthRegex);
  if (!foundDate && dmMatch) {
    const day = parseInt(dmMatch[1], 10);
    const month = MONTH_MAP[dmMatch[2].toLowerCase()];
    let year = dmMatch[3] ? parseInt(dmMatch[3], 10) : baseNow.getFullYear();
    matchedSegments.push(dmMatch[0]);
    workingText = workingText.replace(dmMatch[0], ' ');
    // If no year specified and date has passed this year, roll over to next year
    if (!dmMatch[3]) {
      const testDate = new Date(year, month, day, 23, 59, 59);
      if (testDate.getTime() < baseNow.getTime() - 24 * 3600 * 1000) {
        year += 1;
      }
    }
    foundDate = { year, month, day };
  }

  // "nov 20", "november 20"
  const monthDayRegex = /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\b/i;
  const mdMatch = workingText.match(monthDayRegex);
  if (!foundDate && mdMatch) {
    const month = MONTH_MAP[mdMatch[1].toLowerCase()];
    const day = parseInt(mdMatch[2], 10);
    let year = mdMatch[3] ? parseInt(mdMatch[3], 10) : baseNow.getFullYear();
    matchedSegments.push(mdMatch[0]);
    workingText = workingText.replace(mdMatch[0], ' ');
    if (!mdMatch[3]) {
      const testDate = new Date(year, month, day, 23, 59, 59);
      if (testDate.getTime() < baseNow.getTime() - 24 * 3600 * 1000) {
        year += 1;
      }
    }
    foundDate = { year, month, day };
  }

  // 7. Parse Times:
  // "5pm", "5:30 pm", "5:30pm", "17:30", "noon", "midnight", "at 5pm"
  const noonRegex = /\bnoon\b/i;
  if (!foundTime && noonRegex.test(workingText)) {
    const match = workingText.match(noonRegex)[0];
    matchedSegments.push(match);
    workingText = workingText.replace(match, ' ');
    foundTime = { hours: 12, minutes: 0 };
  }

  const midnightRegex = /\bmidnight\b/i;
  if (!foundTime && midnightRegex.test(workingText)) {
    const match = workingText.match(midnightRegex)[0];
    matchedSegments.push(match);
    workingText = workingText.replace(match, ' ');
    foundTime = { hours: 23, minutes: 59 };
  }

  // "5pm", "5:30 pm", "5:30pm", "5 am", "at 7am"
  const ampmRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const ampmMatch = workingText.match(ampmRegex);
  if (!foundTime && ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPm = ampmMatch[3].toLowerCase() === 'pm';
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
    matchedSegments.push(ampmMatch[0]);
    workingText = workingText.replace(ampmMatch[0], ' ');
    foundTime = { hours, minutes };
  }

  // 24-hour format: "17:30", "at 08:00"
  const militaryRegex = /\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/i;
  const milMatch = workingText.match(militaryRegex);
  if (!foundTime && milMatch) {
    const hours = parseInt(milMatch[1], 10);
    const minutes = parseInt(milMatch[2], 10);
    matchedSegments.push(milMatch[0]);
    workingText = workingText.replace(milMatch[0], ' ');
    foundTime = { hours, minutes };
  }

  // 8. Clean up title
  // Remove leftover "at", "by", "on" if dangling at end or start
  let cleanTitle = workingText
    .replace(/\s+/g, ' ')
    .replace(/^(?:at|by|on)\s+/i, '')
    .replace(/\s+(?:at|by|on)$/i, '')
    .trim();

  // If title became completely empty but raw input had text, keep raw input minus priority
  if (!cleanTitle && rawTitle) {
    cleanTitle = rawTitle.replace(priorityRegex, '').trim();
  }

  // 9. Combine Date & Time according to rules:
  // - Date only -> 11:59 PM (23:59)
  // - Time only -> today if that time is still in the future, else tomorrow
  // - Nothing parsed -> parsed = false
  if (!foundDate && !foundTime) {
    return {
      parsed: false,
      title: cleanTitle || rawTitle,
      rawTitle,
      dueAt: null,
      priority,
      matchedSegments
    };
  }

  let finalDate = null;
  if (foundDate && foundTime) {
    finalDate = new Date(foundDate.year, foundDate.month, foundDate.day, foundTime.hours, foundTime.minutes, 0, 0);
  } else if (foundDate && !foundTime) {
    finalDate = new Date(foundDate.year, foundDate.month, foundDate.day, 23, 59, 0, 0);
  } else if (!foundDate && foundTime) {
    // Time only: check today vs tomorrow
    const todayCandidate = new Date(
      baseNow.getFullYear(),
      baseNow.getMonth(),
      baseNow.getDate(),
      foundTime.hours,
      foundTime.minutes,
      0,
      0
    );
    if (todayCandidate.getTime() > baseNow.getTime()) {
      finalDate = todayCandidate;
    } else {
      finalDate = new Date(
        baseNow.getFullYear(),
        baseNow.getMonth(),
        baseNow.getDate() + 1,
        foundTime.hours,
        foundTime.minutes,
        0,
        0
      );
    }
  }

  return {
    parsed: true,
    title: cleanTitle || 'New Task',
    rawTitle,
    dueAt: finalDate,
    priority,
    matchedSegments
  };
}

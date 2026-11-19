// horizon/public/js/time.js
// Date and time manipulation, formatting, and humanizing utilities

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Format a Date to 12-hour string with AM/PM (e.g. "5:00 PM", "11:59 PM")
 */
export function formatTime(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minStr} ${ampm}`;
}

/**
 * Format date in Day-first DD/MM/YYYY format
 */
export function formatDateDDMMYYYY(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date for native HTML5 <input type="date"> -> YYYY-MM-DD
 */
export function formatDateForInput(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time for native HTML5 <input type="time"> -> HH:mm (24-hour)
 */
export function formatTimeForInput(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '23:59';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Combine dateStr ("YYYY-MM-DD") and timeStr ("HH:mm") in local time into a Date object
 */
export function parseDateTimeInputs(dateStr, timeStr = '23:59') {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '23:59').split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}

/**
 * Check if two dates are the same local calendar day
 */
export function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if date is today in local time
 */
export function isToday(d, now = new Date()) {
  return isSameDay(d, now);
}

/**
 * Check if date is tomorrow in local time
 */
export function isTomorrow(d, now = new Date()) {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return isSameDay(d, tomorrow);
}

/**
 * Check if date is yesterday in local time
 */
export function isYesterday(d, now = new Date()) {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return isSameDay(d, yesterday);
}

/**
 * Friendly stem/list date text:
 * "Tomorrow · 11:59 PM", "Today · 5:00 PM", "Fri 20 Nov · 6:00 PM"
 */
export function formatFriendlyDue(dateInput, now = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const time = formatTime(d);
  if (isToday(d, now)) {
    return `Today · ${time}`;
  }
  if (isTomorrow(d, now)) {
    return `Tomorrow · ${time}`;
  }
  if (isYesterday(d, now)) {
    return `Yesterday · ${time}`;
  }
  const dayName = WEEKDAY_NAMES_SHORT[d.getDay()];
  const monthName = MONTH_NAMES[d.getMonth()];
  const dayNum = d.getDate();
  const yearSuffix = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${dayName} ${dayNum} ${monthName}${yearSuffix} · ${time}`;
}

/**
 * Full date string for popover details (e.g. "Friday, 20 Nov 2026")
 */
export function formatFullDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const dayName = WEEKDAY_NAMES_FULL[d.getDay()];
  const monthName = MONTH_NAMES[d.getMonth()];
  return `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()}`;
}

/**
 * Live countdown format: "in 1d 7h", "in 2d 4h 10m", "in 45m", "overdue by 2h"
 */
export function formatCountdown(dateInput, now = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const diffMs = d.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const totalMinutes = Math.floor(absDiff / (60 * 1000));
  const totalHours = Math.floor(absDiff / (60 * 60 * 1000));
  const days = Math.floor(absDiff / (24 * 60 * 60 * 1000));
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  let str = '';
  if (days > 0) {
    str = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  } else if (hours > 0) {
    str = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    str = `${Math.max(1, minutes)}m`;
  }

  return isPast ? `${str} overdue` : `in ${str}`;
}

/**
 * Relative time for task list: "in 1 day", "in 4 days", "2 hours ago", "just now"
 */
export function formatRelativeShort(dateInput, now = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const diffMs = d.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const mins = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) {
    const unit = mins === 1 ? 'min' : 'mins';
    return isPast ? `${mins} ${unit} ago` : `in ${mins} ${unit}`;
  }
  if (hours < 24) {
    const unit = hours === 1 ? 'hour' : 'hours';
    return isPast ? `${hours} ${unit} ago` : `in ${hours} ${unit}`;
  }
  if (days === 1) {
    return isPast ? 'yesterday' : 'in 1 day';
  }
  if (days < 30) {
    return isPast ? `${days} days ago` : `in ${days} days`;
  }
  const months = Math.floor(days / 30);
  return isPast ? `${months}mo ago` : `in ${months}mo`;
}

/**
 * Humanize a time gap between two timestamps for gap chips:
 * "+5h", "+2d", "+1w 4d", "+2w", "+1m 2w"
 */
export function humanizeGap(diffMs) {
  const abs = Math.abs(diffMs);
  const hours = Math.round(abs / (3600 * 1000));
  const days = Math.floor(abs / (86400 * 1000));
  const remHours = hours % 24;

  if (hours < 24) {
    return `+${Math.max(1, hours)}h`;
  }
  if (days < 7) {
    return remHours >= 12 ? `+${days + 1}d` : `+${days}d`;
  }
  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  if (weeks < 4) {
    return remDays > 0 ? `+${weeks}w ${remDays}d` : `+${weeks}w`;
  }
  const months = Math.floor(days / 30);
  const remWeeks = Math.floor((days % 30) / 7);
  return remWeeks > 0 ? `+${months}mo ${remWeeks}w` : `+${months}mo`;
}

/**
 * RFC 5545 .ics calendar file content generator for a task
 */
export function generateIcs(task) {
  const d = new Date(task.dueAt);
  const endD = new Date(d.getTime() + 60 * 60 * 1000); // 1 hour duration default

  function toUtcIcs(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  const dtStart = toUtcIcs(d);
  const dtEnd = toUtcIcs(endD);
  const dtStamp = toUtcIcs(new Date());
  const uid = (task.id || crypto.randomUUID?.() || Date.now()) + '@horizon.local';
  const cleanTitle = (task.title || 'Horizon Task').replace(/[\r\n]+/g, ' ');
  const cleanNotes = (task.notes || '').replace(/[\r\n]+/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Horizon//Timeline Task App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanNotes}`,
    `PRIORITY:${task.priority === 'high' ? '1' : task.priority === 'low' ? '9' : '5'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

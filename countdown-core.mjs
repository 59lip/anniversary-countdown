const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const REPEAT_TYPES = new Set(['none', 'weekly', 'monthly', 'yearly']);
const ICONS = new Set(['heart','cake','book','train','wallet','home','clock','gift','star','calendar','plane','briefcase']);
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function dateOnly(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthLastDay(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function normalizeRepeatType(value) {
  const repeatType = String(value || 'none').trim();
  return REPEAT_TYPES.has(repeatType) ? repeatType : 'none';
}

function normalizeTime(value) {
  const time = String(value || '').trim();
  if (!time) return '';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('具体时间必须是 HH:MM');
  return time;
}

function normalizeRepeatValue(repeatType, value, date) {
  if (repeatType === 'none') return '';
  const sourceDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) ? dateOnly(date) : new Date();
  const raw = String(value || '').trim();
  if (repeatType === 'weekly') {
    const weekday = Number(raw || sourceDate.getDay());
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error('每周循环必须选择星期几');
    return String(weekday);
  }
  if (repeatType === 'monthly') {
    const day = Number(raw || sourceDate.getDate());
    if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error('每月循环日期必须是 1 到 31 号');
    return String(day);
  }
  const monthDay = raw || `${String(sourceDate.getMonth() + 1).padStart(2, '0')}-${String(sourceDate.getDate()).padStart(2, '0')}`;
  if (!/^\d{2}-\d{2}$/.test(monthDay)) throw new Error('每年循环日期必须是 MM-DD');
  const [month, day] = monthDay.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > monthLastDay(2024, month - 1)) throw new Error('每年循环日期无效');
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeUpdatedAt(value) {
  const updatedAt = String(value || '').trim();
  if (!updatedAt) return '';
  return Number.isNaN(Date.parse(updatedAt)) ? '' : updatedAt;
}

function eventTimestamp(event) {
  const parsed = Date.parse(event?.updatedAt || '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

function eventDeletedAt(event) {
  return normalizeUpdatedAt(event?.deletedAt || event?.deleted_at);
}

function combineDateTime(date, time) {
  const result = dateOnly(date);
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    result.setHours(hours, minutes, 0, 0);
  }
  return result;
}

function sameOrFutureByTime(date, time, baseDate) {
  if (!time) return dateOnly(date) >= new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  return combineDateTime(date, time) >= baseDate;
}

function addMonthsClamped(base, monthOffset, day) {
  const year = base.getFullYear();
  const month = base.getMonth() + monthOffset;
  return new Date(year, month, Math.min(day, monthLastDay(year, month)));
}

function minuteParts(totalMinutes) {
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push({ value: String(days), unit: '天' });
  if (hours) parts.push({ value: String(hours), unit: '小时' });
  if (minutes || parts.length === 0) parts.push({ value: String(minutes), unit: '分钟' });
  return parts;
}

function calendarDuration(startDate, endDate) {
  let start = dateOnly(startDate);
  let end = dateOnly(endDate);
  if (start > end) [start, end] = [end, start];
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += previousMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} 年 ${months} 个月 ${days} 天`;
}

export function daysBetween(targetDate, baseDate = new Date()) {
  const target = dateOnly(targetDate);
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  return Math.round((target.getTime() - base.getTime()) / DAY_MS);
}

export function describeDateDistance(targetDate, baseDate = new Date()) {
  const days = daysBetween(targetDate, baseDate);
  if (days > 0) return { tone: 'future', label: `还有 ${days} 天` };
  if (days < 0) return { tone: 'past', label: `已过去 ${Math.abs(days)} 天` };
  return { tone: 'today', label: '就是今天' };
}

export function getNextOccurrence(event, baseDate = new Date()) {
  const repeatType = normalizeRepeatType(event?.repeatType);
  const repeatValue = normalizeRepeatValue(repeatType, event?.repeatValue, event?.date);
  const time = normalizeTime(event?.time);
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  if (repeatType === 'none') return event.date;
  if (repeatType === 'weekly') {
    const targetWeekday = Number(repeatValue);
    const diff = (targetWeekday - base.getDay() + 7) % 7;
    const target = new Date(base);
    target.setDate(base.getDate() + diff);
    if (time && combineDateTime(formatDate(target), time) < baseDate) target.setDate(target.getDate() + 7);
    return formatDate(target);
  }
  if (repeatType === 'monthly') {
    const day = Number(repeatValue);
    let target = addMonthsClamped(base, 0, day);
    if (!sameOrFutureByTime(formatDate(target), time, baseDate)) target = addMonthsClamped(base, 1, day);
    return formatDate(target);
  }
  const [month, day] = repeatValue.split('-').map(Number);
  let target = new Date(base.getFullYear(), month - 1, day);
  if (!sameOrFutureByTime(formatDate(target), time, baseDate)) target = new Date(base.getFullYear() + 1, month - 1, day);
  return formatDate(target);
}

export function describeEventDistance(event, baseDate = new Date()) {
  const normalized = normalizeEvent(event);
  const nextDate = getNextOccurrence(normalized, baseDate);
  const targetDateTime = combineDateTime(nextDate, normalized.time);
  if (normalized.time) {
    const rawMinutes = Math.ceil((targetDateTime.getTime() - baseDate.getTime()) / MINUTE_MS);
    const tone = rawMinutes > 0 ? 'future' : rawMinutes < 0 ? 'past' : 'today';
    const totalMinutes = Math.abs(rawMinutes);
    const absDays = Math.floor(totalMinutes / (24 * 60));
    return {
      tone,
      num: String(minuteParts(totalMinutes)[0].value),
      unit: minuteParts(totalMinutes)[0].unit,
      parts: minuteParts(totalMinutes),
      label: tone === 'future' ? `还有 ${totalMinutes} 分钟` : tone === 'past' ? `已过去 ${totalMinutes} 分钟` : '就是现在',
      titleText: tone === 'future' ? `距离${normalized.title}还有` : tone === 'past' ? `${normalized.title}已过去` : `${normalized.title}就是现在`,
      longText: absDays > 1000 ? calendarDuration(formatDate(baseDate), nextDate) : '',
      nextDate
    };
  }
  const days = daysBetween(nextDate, baseDate);
  const absDays = Math.abs(days);
  const tone = days > 0 ? 'future' : days < 0 ? 'past' : 'today';
  return {
    tone,
    num: String(absDays),
    unit: '天',
    parts: [{ value: String(absDays), unit: '天' }],
    label: tone === 'future' ? `还有 ${absDays} 天` : tone === 'past' ? `已过去 ${absDays} 天` : '就是今天',
    titleText: tone === 'future' ? `距离${normalized.title}还有` : tone === 'past' ? `${normalized.title}已过去` : `${normalized.title}就是今天`,
    longText: absDays > 1000 ? calendarDuration(formatDate(baseDate), nextDate) : '',
    nextDate
  };
}

export function formatEventRule(event) {
  const repeatType = normalizeRepeatType(event?.repeatType);
  const repeatValue = normalizeRepeatValue(repeatType, event?.repeatValue, event?.date);
  const time = normalizeTime(event?.time);
  const suffix = time ? ` ${time}` : '';
  if (repeatType === 'weekly') return `每周${WEEKDAY_LABELS[Number(repeatValue)]}${suffix}`;
  if (repeatType === 'monthly') return `每月${Number(repeatValue)}日${suffix}`;
  if (repeatType === 'yearly') {
    const [month, day] = repeatValue.split('-');
    return `每年${month}月${day}日${suffix}`;
  }
  return `${event.date}${suffix}`;
}

export function normalizeEvent(event) {
  const title = String(event?.title || '').trim();
  const date = String(event?.date || '').trim();
  const time = normalizeTime(event?.time);
  const category = String(event?.category || 'custom').trim() || 'custom';
  const icon = ICONS.has(String(event?.icon || '').trim()) ? String(event.icon).trim() : '';
  const repeatType = normalizeRepeatType(event?.repeatType);
  const repeatValue = normalizeRepeatValue(repeatType, event?.repeatValue, date);
  const updatedAt = normalizeUpdatedAt(event?.updatedAt || event?.updated_at);
  const deletedAt = eventDeletedAt(event);
  const note = String(event?.note || '').trim();
  if (!title) throw new Error('标题不能为空');
  if (!date) throw new Error('日期不能为空');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('日期格式必须是 YYYY-MM-DD');
  return { id: String(event?.id || '').trim(), title, date, time, category, icon, repeatType, repeatValue, updatedAt, deletedAt, note };
}

export function isDeletedEvent(event) {
  return Boolean(eventDeletedAt(event));
}

export function activeEvents(events) {
  return (events || []).filter(event => !isDeletedEvent(event));
}

export function sortEvents(events, baseDate = new Date()) {
  return activeEvents(events).sort((a, b) => {
    const dayA = daysBetween(getNextOccurrence(a, baseDate), baseDate);
    const dayB = daysBetween(getNextOccurrence(b, baseDate), baseDate);
    if (dayA >= 0 && dayB < 0) return -1;
    if (dayA < 0 && dayB >= 0) return 1;
    return Math.abs(dayA) - Math.abs(dayB);
  });
}

export function filterEvents(events, filter = 'all', baseDate = new Date()) {
  const sorted = sortEvents(events, baseDate);
  if (filter === 'today') return sorted.filter(event => daysBetween(getNextOccurrence(event, baseDate), baseDate) === 0);
  if (filter === 'recent') return sorted.filter(event => {
    const days = daysBetween(getNextOccurrence(event, baseDate), baseDate);
    return days >= 0 && days <= 30;
  });
  return sorted;
}

export function shouldKeepLocalAfterCloudPull(localEvents, cloudEvents, options = {}) {
  return Boolean(options.missingColumns && Array.isArray(localEvents) && localEvents.length > 0 && Array.isArray(cloudEvents) && cloudEvents.length === 0);
}

export function mergeEventsForSync(localEvents, cloudEvents) {
  const merged = new Map();
  for (const rawEvent of [...(localEvents || []), ...(cloudEvents || [])]) {
    const event = normalizeEvent(rawEvent);
    if (!event.id) continue;
    const existing = merged.get(event.id);
    if (!existing || eventTimestamp(event) >= eventTimestamp(existing)) merged.set(event.id, event);
  }
  return [...merged.values()];
}

export function serializeEvents(events) {
  const json = JSON.stringify(events.map(normalizeEvent));
  return btoa(unescape(encodeURIComponent(json)));
}

export function deserializeEvents(payload) {
  const json = decodeURIComponent(escape(atob(payload)));
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('分享数据格式不正确');
  return parsed.map(normalizeEvent);
}

export function createOwnerKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `owner-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeSupabaseConfig(config) {
  const rawUrl = String(config?.url || '').trim();
  const key = String(config?.key || '').trim().replace(/\s+/g, '_');
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Supabase URL 必须是 https://xxxx.supabase.co');
  }
  if (!parsed.hostname.endsWith('.supabase.co')) throw new Error('Supabase URL 必须是 https://xxxx.supabase.co');
  return { url: `${parsed.protocol}//${parsed.hostname}`, key };
}

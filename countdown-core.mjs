const DAY_MS = 24 * 60 * 60 * 1000;
const REPEAT_TYPES = new Set(['none', 'weekly', 'monthly', 'yearly']);
const ICONS = new Set([
  'heart',
  'cake',
  'book',
  'train',
  'wallet',
  'home',
  'clock',
  'gift',
  'star',
  'calendar',
  'plane',
  'briefcase'
]);
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
  if (month < 1 || month > 12 || day < 1 || day > monthLastDay(2024, month - 1)) {
    throw new Error('每年循环日期无效');
  }
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function daysBetween(targetDate, baseDate = new Date()) {
  const target = dateOnly(targetDate);
  const base = dateOnly(
    `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`
  );
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
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  if (repeatType === 'none') return event.date;

  if (repeatType === 'weekly') {
    const targetWeekday = Number(repeatValue);
    const diff = (targetWeekday - base.getDay() + 7) % 7;
    const target = new Date(base);
    target.setDate(base.getDate() + diff);
    return formatDate(target);
  }

  if (repeatType === 'monthly') {
    const day = Number(repeatValue);
    let target = new Date(base.getFullYear(), base.getMonth(), Math.min(day, monthLastDay(base.getFullYear(), base.getMonth())));
    if (target < base) {
      const nextMonth = base.getMonth() + 1;
      target = new Date(base.getFullYear(), nextMonth, Math.min(day, monthLastDay(base.getFullYear(), nextMonth)));
    }
    return formatDate(target);
  }

  const [month, day] = repeatValue.split('-').map(Number);
  let target = new Date(base.getFullYear(), month - 1, day);
  if (target < base) target = new Date(base.getFullYear() + 1, month - 1, day);
  return formatDate(target);
}

export function describeEventDistance(event, baseDate = new Date()) {
  const nextDate = getNextOccurrence(event, baseDate);
  const days = daysBetween(nextDate, baseDate);
  if (days > 0) return { tone: 'future', num: String(days), unit: '天', label: `还有 ${days} 天`, nextDate };
  if (days < 0) return { tone: 'past', num: String(Math.abs(days)), unit: '天', label: `已过去 ${Math.abs(days)} 天`, nextDate };
  return { tone: 'today', num: '0', unit: '天', label: '就是今天', nextDate };
}

export function formatEventRule(event) {
  const repeatType = normalizeRepeatType(event?.repeatType);
  const repeatValue = normalizeRepeatValue(repeatType, event?.repeatValue, event?.date);
  if (repeatType === 'weekly') return `每周${WEEKDAY_LABELS[Number(repeatValue)]}`;
  if (repeatType === 'monthly') return `每月${Number(repeatValue)}日`;
  if (repeatType === 'yearly') {
    const [month, day] = repeatValue.split('-');
    return `每年${month}月${day}日`;
  }
  return event.date;
}

export function normalizeEvent(event) {
  const title = String(event?.title || '').trim();
  const date = String(event?.date || '').trim();
  const category = String(event?.category || 'custom').trim() || 'custom';
  const icon = ICONS.has(String(event?.icon || '').trim()) ? String(event.icon).trim() : '';
  const repeatType = normalizeRepeatType(event?.repeatType);
  const repeatValue = normalizeRepeatValue(repeatType, event?.repeatValue, date);
  const note = String(event?.note || '').trim();

  if (!title) throw new Error('标题不能为空');
  if (!date) throw new Error('日期不能为空');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('日期格式必须是 YYYY-MM-DD');

  return {
    id: String(event?.id || '').trim(),
    title,
    date,
    category,
    icon,
    repeatType,
    repeatValue,
    note
  };
}

export function sortEvents(events, baseDate = new Date()) {
  return [...events].sort((a, b) => {
    const dayA = daysBetween(getNextOccurrence(a, baseDate), baseDate);
    const dayB = daysBetween(getNextOccurrence(b, baseDate), baseDate);
    if (dayA >= 0 && dayB < 0) return -1;
    if (dayA < 0 && dayB >= 0) return 1;
    return Math.abs(dayA) - Math.abs(dayB);
  });
}

export function shouldKeepLocalAfterCloudPull(localEvents, cloudEvents, options = {}) {
  return Boolean(
    options.missingColumns &&
    Array.isArray(localEvents) &&
    localEvents.length > 0 &&
    Array.isArray(cloudEvents) &&
    cloudEvents.length === 0
  );
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

  if (!parsed.hostname.endsWith('.supabase.co')) {
    throw new Error('Supabase URL 必须是 https://xxxx.supabase.co');
  }

  return {
    url: `${parsed.protocol}//${parsed.hostname}`,
    key
  };
}

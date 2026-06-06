import assert from 'node:assert/strict';
import {
  describeEventDistance,
  filterEvents,
  formatEventRule,
  getNextOccurrence,
  normalizeEvent,
  sortEvents
} from './countdown-core.mjs';

const base = new Date(2026, 5, 11); // 2026-06-11

assert.equal(getNextOccurrence({ repeatType: 'none', date: '2026-06-20' }, base), '2026-06-20');
assert.equal(getNextOccurrence({ repeatType: 'monthly', repeatValue: '10' }, base), '2026-07-10');
assert.equal(getNextOccurrence({ repeatType: 'monthly', repeatValue: '12' }, base), '2026-06-12');
assert.equal(getNextOccurrence({ repeatType: 'weekly', repeatValue: '5' }, base), '2026-06-12');
assert.equal(getNextOccurrence({ repeatType: 'yearly', repeatValue: '09-06' }, base), '2026-09-06');
assert.equal(getNextOccurrence({ repeatType: 'yearly', repeatValue: '06-10' }, base), '2027-06-10');

assert.deepEqual(
  normalizeEvent({ title: '发工资', date: '2026-06-10', category: 'work', icon: 'wallet', repeatType: 'monthly', repeatValue: '10' }),
  { id: '', title: '发工资', date: '2026-06-10', category: 'work', icon: 'wallet', repeatType: 'monthly', repeatValue: '10', updatedAt: '', deletedAt: '', note: '' }
);

assert.equal(normalizeEvent({ title: '高考', date: '2026-06-07' }).repeatType, 'none');
assert.equal(formatEventRule({ repeatType: 'monthly', repeatValue: '10', date: '2026-06-10' }), '每月10日');
assert.equal(formatEventRule({ repeatType: 'weekly', repeatValue: '5', date: '2026-06-12' }), '每周五');
assert.equal(formatEventRule({ repeatType: 'yearly', repeatValue: '09-06', date: '2026-09-06' }), '每年09月06日');

const salary = describeEventDistance({ repeatType: 'monthly', repeatValue: '10', date: '2026-06-10' }, base);
assert.equal(salary.num, '29');
assert.equal(salary.label, '还有 29 天');
assert.equal(salary.nextDate, '2026-07-10');

const sampleEvents = [
  { title: '下月发工资', date: '2026-06-10', repeatType: 'monthly', repeatValue: '10' },
  { title: '明天周五', date: '2026-06-12', repeatType: 'weekly', repeatValue: '5' },
  { title: '今天', date: '2026-06-11' },
  { title: '很远', date: '2026-08-01' },
  { title: '已删除', date: '2026-06-11', deletedAt: '2026-06-11T10:00:00.000Z' }
];

const sorted = sortEvents(sampleEvents, base);
assert.equal(sorted[0].title, '今天');
assert.deepEqual(filterEvents(sampleEvents, 'today', base).map(event => event.title), ['今天']);
assert.deepEqual(filterEvents(sampleEvents, 'recent', base).map(event => event.title), ['今天', '明天周五', '下月发工资']);
assert.equal(filterEvents(sampleEvents, 'all', base).some(event => event.title === '已删除'), false);

console.log('event recurrence tests passed');

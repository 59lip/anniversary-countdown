import assert from 'node:assert/strict';
import { mergeEventsForSync, shouldKeepLocalAfterCloudPull } from './countdown-core.mjs';

const localEvents = [{ id: 'local-1', title: '发工资', date: '2026-06-10' }];

assert.equal(
  shouldKeepLocalAfterCloudPull(localEvents, [], { missingColumns: true }),
  true,
  'keeps local events when old Supabase schema returns no rows'
);

assert.equal(
  shouldKeepLocalAfterCloudPull(localEvents, [], { missingColumns: false }),
  false,
  'allows normal cloud empty state to clear local events'
);

assert.equal(
  shouldKeepLocalAfterCloudPull(localEvents, [{ id: 'cloud-1' }], { missingColumns: true }),
  false,
  'uses cloud rows when old Supabase schema still has data'
);

assert.deepEqual(
  mergeEventsForSync(
    [{ id: 'phone-1', title: '手机添加', date: '2026-06-10', updatedAt: '2026-06-06T10:00:00.000Z' }],
    [{ id: 'pc-1', title: '电脑添加', date: '2026-06-11', updatedAt: '2026-06-06T11:00:00.000Z' }]
  ).map(event => event.title),
  ['手机添加', '电脑添加'],
  'merges events added on different devices'
);

assert.equal(
  mergeEventsForSync(
    [{ id: 'same-1', title: '旧标题', date: '2026-06-10', updatedAt: '2026-06-06T10:00:00.000Z' }],
    [{ id: 'same-1', title: '新标题', date: '2026-06-10', updatedAt: '2026-06-06T11:00:00.000Z' }]
  )[0].title,
  '新标题',
  'keeps the newest version when two devices edit the same event'
);

assert.equal(
  mergeEventsForSync(
    [{ id: 'same-delete', title: '手机旧记录', date: '2026-06-10', updatedAt: '2026-06-06T10:00:00.000Z' }],
    [{ id: 'same-delete', title: '手机旧记录', date: '2026-06-10', updatedAt: '2026-06-06T12:00:00.000Z', deletedAt: '2026-06-06T12:00:00.000Z' }]
  )[0].deletedAt,
  '2026-06-06T12:00:00.000Z',
  'keeps a newer deletion tombstone so deleted events do not reappear'
);

console.log('cloud sync tests passed');

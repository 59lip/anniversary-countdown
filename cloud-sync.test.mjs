import assert from 'node:assert/strict';
import { shouldKeepLocalAfterCloudPull } from './countdown-core.mjs';

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

console.log('cloud sync tests passed');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert.match(html, /id="sidebarToggle"/, 'has a collapsible sidebar toggle');
assert.match(html, /class="app-sidebar"/, 'has left app sidebar');
assert.match(html, /data-view-target="home"/, 'sidebar links to home view');
assert.match(html, /data-view-target="cloud"/, 'sidebar links to cloud settings view');
assert.match(html, /id="homeView"/, 'has home view');
assert.match(html, /id="cloudView"/, 'has cloud settings view');
assert.match(html, /id="addEventButton"/, 'has a top-right add button');
assert.match(html, /id="eventDialog"/, 'has an add/edit modal dialog');
assert.match(html, /id="iconPicker"/, 'add dialog has an icon picker');
assert.match(html, /id="repeatType"/, 'add dialog has repeat type selector');
assert.match(html, /id="weeklyValue"/, 'add dialog supports weekly recurrence');
assert.match(html, /id="monthlyValue"/, 'add dialog supports monthly recurrence');
assert.match(html, /id="yearlyValue"/, 'add dialog supports yearly recurrence');
assert.match(html, /isMissingCloudColumns/, 'cloud sync tolerates old Supabase schemas');

const eventsIndex = html.indexOf('id="eventsSection"');
const dialogIndex = html.indexOf('id="eventDialog"');
const cloudViewIndex = html.indexOf('id="cloudView"');

assert.ok(eventsIndex >= 0, 'home contains all countdowns section');
assert.ok(dialogIndex > eventsIndex, 'add form lives in modal after home content');
assert.ok(cloudViewIndex > eventsIndex, 'cloud settings view is separate from home countdowns');
assert.equal(html.includes('id="addSection"'), false, 'home does not contain inline add form section');
assert.equal(html.includes('id="homeSyncSection"'), false, 'home does not contain inline sync panel');
assert.equal(html.includes('下一次 ${escapeHtml(distance.nextDate)}'), false, 'cards do not show the next occurrence date');

console.log('ui layout tests passed');

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
assert.match(html, /id="homeSync"/, 'has a home sync button');
assert.match(html, /id="eventDialog"/, 'has an add/edit modal dialog');
assert.match(html, /id="time" type="time"/, 'add dialog has optional event time');
assert.match(html, /id="iconPicker"/, 'add dialog has an icon picker');
assert.match(html, /id="repeatType"/, 'add dialog has repeat type selector');
assert.match(html, /id="weeklyValue"/, 'add dialog supports weekly recurrence');
assert.match(html, /id="monthlyValue"/, 'add dialog supports monthly recurrence');
assert.match(html, /id="yearlyValue"/, 'add dialog supports yearly recurrence');
assert.match(html, /data-filter="all"/, 'all filter is clickable');
assert.match(html, /data-filter="recent"/, 'recent filter is clickable');
assert.match(html, /data-filter="today"/, 'today filter is clickable');
assert.match(html, /filterEvents/, 'home filters use core filtering');
assert.match(html, /titleText/, 'cards render unified countdown titles');
assert.match(html, /renderParts/, 'cards render multi-part timed countdowns');
assert.match(html, /longText/, 'cards render long-distance helper text');
assert.match(html, /select\('id,title,date,time,category,icon,repeat_type,repeat_value,updated_at,deleted_at,note'\)/, 'cloud sync includes optional time');
assert.match(html, /isMissingCloudColumns/, 'cloud sync tolerates old Supabase schemas');
assert.match(html, /await pullCloud\(\);\s*await pushCloud\(\);\s*await pullCloud\(\);/s, 'sync performs a merge round trip');
assert.match(html, /setTimeout\(\(\)\s*=>\s*\{\s*el\.status\.textContent\s*=\s*'';/s, 'status auto clears');

const eventsIndex = html.indexOf('id="eventsSection"');
const dialogIndex = html.indexOf('id="eventDialog"');
const cloudViewIndex = html.indexOf('id="cloudView"');

assert.ok(eventsIndex >= 0, 'home contains all countdowns section');
assert.ok(dialogIndex > eventsIndex, 'add form lives in modal after home content');
assert.ok(cloudViewIndex > eventsIndex, 'cloud settings view is separate from home countdowns');
assert.equal(html.includes('id="addSection"'), false, 'home does not contain inline add form section');
assert.equal(html.includes('id="homeSyncSection"'), false, 'home does not contain inline sync panel');
assert.equal(html.includes('searchParams.set(\'data\''), false, 'sync links do not embed event data');
assert.equal(html.includes('卡片式倒计时'), false, 'home removes eyebrow copy');
assert.equal(html.includes('用清晰'), false, 'home removes descriptive copy');
assert.equal(html.includes('brand-title'), false, 'sidebar no longer shows the brand title');
assert.equal(html.includes('brand-mark'), false, 'sidebar no longer shows the cloud-like brand icon');
assert.equal(html.includes('每一迹'), false, 'sidebar no longer shows 每一迹');
assert.equal(html.includes('下一次 ${escapeHtml(distance.nextDate)}'), false, 'cards do not show the next occurrence date');

console.log('ui layout tests passed');

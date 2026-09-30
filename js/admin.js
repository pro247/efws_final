const me = Auth.require('admin');
const $ = s => document.querySelector(s), page = document.body.dataset.page;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NAV = [['overview', 'Overview', 'overview.html'], ['devices', 'Devices', 'devices.html'], ['sms-log', 'SMS log', 'sms-log.html'], ['alerts', 'Alerts', 'alerts.html'],
['analytics', 'Analytics', 'coming-soon.html?p=Analytics', 1], ['users', 'Users', 'coming-soon.html?p=Users', 1], ['settings', 'Settings', 'coming-soon.html?p=Settings', 1]];
const rawName = new URLSearchParams(location.search).get('p') || 'This page';
let alerts = FW.alerts.map(a => ({ ...a })), sel = FW.devices[0].id;
const toast = m => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2500); };
const tag = (c, t) => `<span class="pill ${c}">${esc(t)}</span>`;
const pill = s => tag(FW.cls(s), s);
const state = a => a.ack ? tag('ok', 'Acknowledged') : tag('warn', 'Open');
const kpi = (l, v, n = '') => `<div class="card kpi"><span>${l}</span><b>${v}</b><small>${n}</small></div>`;
const table = (h, r) => `<div class="scroll"><table class="tbl"><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${r.join('')}</table></div>`;
const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);

const views = {
    overview() {
        const on = FW.devices.filter(d => d.status === 'Online').length, open = alerts.filter(a => !a.ack).length;
        const sent = sum(FW.sms, 'n'), ok = sum(FW.sms, 'ok'), bat = (sum(FW.devices, 'bat') / FW.devices.length).toFixed(1);
        return {
            title: 'Overview', html: `<div class="kpis">${kpi('Nodes online', on + ' / ' + FW.devices.length)}${kpi('Open alerts', open)}${kpi('SMS delivered', Math.round(ok / sent * 100) + '%', 'recent messages')}${kpi('Average battery', bat + ' V')}</div>
<div class="grid half"><div class="card"><h3>Node status</h3>${table(['Node', 'Status', 'Battery', 'Signal', 'Last seen'], FW.devices.map(d => `<tr><td>${d.id} ${d.name}</td><td>${pill(d.status)}</td><td>${d.bat} V</td><td>${d.rssi ?? 'None'}</td><td>${d.seen}</td></tr>`))}</div>
<div class="card"><h3>Recent events</h3><ul class="events">${alerts.map(a => `<li>${state(a)} <b>${esc(a.st)}</b>: ${esc(a.type)}<br><small>${a.since}</small></li>`).join('')}</ul></div></div>
<div class="card"><div class="head"><h3>Chikwawa water level, 7 days</h3></div><div id="chart" class="chart"></div></div>`,
            init() { FloodChart.render($('#chart'), FW.series(FW.stations[0]).filter(p => p.t >= Date.now() - 7 * 864e5), { limits: FW.limits }); }
        };
    },
    devices() {
        const d = FW.devices.find(x => x.id === sel), st = FW.stations.find(s => s.id === sel), c = FW.series(st).filter(p => !p.f).pop(), off = d.status === 'Offline';
        const fact = (a, b) => `<div><span>${a}</span><b>${b}</b></div>`;
        return {
            title: 'Devices', html: `<div class="grid two" style="grid-template-columns:minmax(0,3fr) minmax(0,2fr)">
<div class="card"><h3>All nodes</h3>${table(['Node', 'Status', 'Battery', 'Signal', 'Last seen'], FW.devices.map(x => `<tr data-dev="${x.id}" class="${x.id === sel ? 'sel' : ''}"><td>${x.id} ${x.name}</td><td>${pill(x.status)}</td><td>${x.bat} V</td><td>${x.rssi ?? 'None'}</td><td>${x.seen}</td></tr>`))}</div>
<div class="card"><div class="head"><h3>${d.id} ${d.name}</h3>${pill(d.status)}</div><div class="facts">
${fact('Ultrasonic distance', off ? 'No data' : Math.round((FW.mount - c.v) * 100) + ' cm')}${fact('Turbidity', off ? 'No data' : c.tu + ' NTU (limit 7)')}${fact('Battery', d.bat + ' V')}${fact('GSM signal', d.rssi ? d.rssi + ' dBm' : 'None')}${fact('Firmware', 'v' + d.fw)}${fact('Failed uploads (24h)', d.fails)}${fact('Last seen', d.seen + ' ago')}</div>
<div class="row" style="margin-top:14px"><button class="btn" data-act="Ping sent to ${d.id}">Ping</button><button class="btn" data-act="Restart requested for ${d.id}">Restart</button><button class="btn" data-act="Calibration started for ${d.id}">Calibrate</button></div><small>Actions are demo buttons. Connect them to your API.</small></div></div>`
        };
    },
    'sms-log'() {
        const sent = sum(FW.sms, 'n'), ok = sum(FW.sms, 'ok'), bad = sum(FW.sms, 'fail');
        return {
            title: 'SMS log', html: `<div class="kpis">${kpi('Recipients reached', ok)}${kpi('Messages attempted', sent)}${kpi('Failed', bad)}${kpi('Delivery rate', Math.round(ok / sent * 100) + '%')}</div>
<div class="card"><h3>Message log</h3>${table(['Time', 'Station', 'Message', 'Recipients', 'Delivered', 'Failed', 'Status'], FW.sms.map(m => `<tr><td>${m.time}</td><td>${m.st}</td><td>${esc(m.msg)}</td><td>${m.n}</td><td>${m.ok}</td><td>${m.fail}</td><td>${pill(m.fail === 0 ? 'Delivered' : m.fail > m.n / 10 ? 'Failed' : 'Partial')}</td></tr>`))}</div>`
        };
    },
    alerts() {
        return {
            title: 'Alerts', html: `<div class="card"><h3>Active alerts</h3>${table(['Station', 'Alert', 'Since', 'State', ''], alerts.map(a => `<tr><td>${a.st}</td><td>${esc(a.type)}</td><td>${a.since}</td><td>${state(a)}</td><td><button class="btn" data-ack="${a.id}">${a.ack ? 'Reopen' : 'Acknowledge'}</button></td></tr>`))}</div>
<div class="card"><h3>Level thresholds (sample values)</h3><div class="facts">${Object.entries(FW.limits).map(([k, v]) => `<div><span>${k[0].toUpperCase() + k.slice(1)}</span><b>${v} m</b></div>`).join('')}</div><small>Editing thresholds will be built in Settings.</small></div>`
        };
    },
    soon() { return { title: rawName, html: `<div class="card soon"><h2>${esc(rawName)} is coming soon</h2><p>This page has not been built yet. A future team can add it in <code>admin/</code> following the README.</p></div>` }; }
};

const cur = page === 'soon' ? rawName.toLowerCase() : page;
$('#app').innerHTML = `<aside class="side"><a class="brand" href="overview.html">${FW.logo}FloodWatch <span>Admin</span></a>${NAV.map(n => `<a href="${n[2]}" class="${n[0] === cur ? 'on' : ''}">${n[1]}${n[3] ? '<em>Soon</em>' : ''}</a>`).join('')}</aside>
<div class="main"><div class="bar"><h1></h1><div class="row"><small>${esc(me.name)}</small><button class="btn" id="out">Sign out</button></div></div><div id="view" class="grid"></div></div>`;
$('#out').onclick = () => Auth.signOut();
function draw() { const v = (views[page] || views.soon)(); $('#view').innerHTML = v.html; $('h1').textContent = v.title; v.init && v.init(); }
document.addEventListener('click', e => {
    const r = e.target.closest('[data-dev]'), a = e.target.closest('[data-ack]'), x = e.target.closest('[data-act]');
    if (r) { sel = r.dataset.dev; draw(); }
    if (a) { const t = alerts.find(y => y.id == a.dataset.ack); t.ack = !t.ack; draw(); }
    if (x) toast(x.dataset.act);
});
draw();

const $ = s => document.querySelector(s);
const sel = $('#station'); sel.innerHTML = FW.stations.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
let range = 7;
const MSG = { Normal: 'Water levels are normal.', Watch: 'Watch: the river is high. Stay alert and avoid low-lying crossings.', Warning: 'Warning: flooding is possible. Prepare to move to higher ground.', Danger: 'Danger: flooding is likely. Follow instructions from local authorities.' };
function draw() {
    const st = FW.stations.find(s => s.id === sel.value), all = FW.series(st), obs = all.filter(p => !p.f);
    const cur = obs[obs.length - 1], ago = obs[obs.length - 7], fc = all[all.length - 1], s = FW.status(cur.v), diff = cur.v - ago.v;
    $('#level').textContent = cur.v.toFixed(1);
    $('#status').className = 'pill ' + FW.cls(s); $('#status').textContent = s;
    $('#trend').textContent = (diff >= 0 ? 'Rising ' : 'Falling ') + Math.abs(diff).toFixed(2) + ' m in 6h';
    $('#turb').textContent = cur.tu + ' NTU'; $('#fc').textContent = fc.v.toFixed(1) + ' m (' + FW.status(fc.v) + ')';
    $('#banner').className = 'banner ' + FW.cls(s); $('#banner').textContent = MSG[s];
    FloodChart.render($('#chart'), all.filter(p => p.t >= Date.now() - range * 864e5), { limits: FW.limits });
    let h = '';
    for (let i = 6; i >= 0; i--) {
        const a = new Date(); a.setHours(0, 0, 0, 0); const t = a.getTime() - i * 864e5;
        const m = Math.max(...obs.filter(p => p.t >= t && p.t < t + 864e5).map(p => p.v));
        h += `<div class="day${i ? '' : ' today'}"><small>${i ? new Date(t).toLocaleDateString('en-GB', { weekday: 'short' }) : 'Today'}</small><b>${m.toFixed(1)} m</b><i class="dot ${FW.cls(FW.status(m))}"></i></div>`;
    }
    $('#days').innerHTML = h;
}
sel.onchange = draw;
document.querySelectorAll('#range button').forEach(b => b.onclick = () => {
    range = +b.dataset.d; document.querySelectorAll('#range button').forEach(x => x.classList.toggle('on', x === b)); draw();
});
draw();

const me = Auth.require('partner'), $ = s => document.querySelector(s);
$('#who').textContent = me.name; $('#out').onclick = () => Auth.signOut();
$('#station').innerHTML = FW.stations.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
const cur = () => ({ st: FW.stations.find(s => s.id === $('#station').value), days: +$('#days').value });
const rows = (st, days) => FW.series(st).filter(p => !p.f && p.t >= Date.now() - days * 864e5);
const line = (st, p) => [new Date(p.t).toISOString(), st.id, p.v, Math.round((FW.mount - p.v) * 100), p.tu, FW.status(p.v), 'measured'];
const HEAD = ['timestamp', 'station_id', 'level_m', 'distance_cm', 'turbidity_ntu', 'status', 'quality_flag'];
function save(name, type, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
function draw() {
    const { st, days } = cur(), r = rows(st, days), vs = r.map(p => p.v), peak = Math.max(...vs);
    FloodChart.render($('#chart'), FW.series(st).filter(p => p.t >= Date.now() - days * 864e5), { limits: FW.limits });
    $('#kpis').innerHTML = [['Peak level', peak.toFixed(2) + ' m'], ['Average level', (vs.reduce((a, b) => a + b) / vs.length).toFixed(2) + ' m'], ['Hours above Watch', vs.filter(v => v >= FW.limits.watch).length + ' h'], ['Avg turbidity', (r.reduce((a, p) => a + p.tu, 0) / r.length).toFixed(1) + ' NTU']].map(([l, v]) => `<div class="card kpi"><span>${l}</span><b>${v}</b></div>`).join('');
    $('#tbody').innerHTML = r.slice(-12).reverse().map(p => `<tr><td>${new Date(p.t).toLocaleString('en-GB')}</td><td>${st.name}</td><td>${p.v.toFixed(2)} m</td><td>${p.tu} NTU</td><td><span class="pill ${FW.cls(FW.status(p.v))}">${FW.status(p.v)}</span></td></tr>`).join('');
}
$('#station').onchange = $('#days').onchange = draw;
$('#csv').onclick = () => { const { st, days } = cur(); save(`floodwatch-${st.id}-${days}d.csv`, 'text/csv', [HEAD, ...rows(st, days).map(p => line(st, p))].map(r => r.join(',')).join('\n')); };
$('#xls').onclick = () => { // HTML table saved as .xls: Excel opens it (may show a format warning). Use SheetJS for true .xlsx later.
    const { st, days } = cur(); const t = '<table><tr>' + HEAD.map(h => `<th>${h}</th>`).join('') + '</tr>' + rows(st, days).map(p => '<tr>' + line(st, p).map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</table>';
    save(`floodwatch-${st.id}-${days}d.xls`, 'application/vnd.ms-excel', t);
};
draw();

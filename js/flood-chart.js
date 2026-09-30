/* Flood Hub-style chart: smooth line, gradient fill, dashed forecast, threshold lines, hover tooltip.
   Usage: FloodChart.render(element, points, { limits }) where points = [{t, v, f}] */
const FloodChart = {
    smooth(p) {
        let d = `M${p[0][0]},${p[0][1]}`;
        for (let i = 0; i < p.length - 1; i++) {
            const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
            d += `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c[0]},${c[1]}`;
        }
        return d;
    },
    render(el, pts, opt = {}) {
        const W = 800, H = 320, L = 44, R = 14, T = 14, B = 28, lim = opt.limits || {}, id = 'g' + Math.random().toString(36).slice(2, 7);
        const vs = pts.map(p => p.v);
        const min = Math.max(0, Math.floor(Math.min(...vs) - 0.5)), max = Math.max(Math.ceil(Math.max(...vs) + 0.5), (lim.warning || 0) + 0.5);
        const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
        const X = t => L + (t - t0) / (t1 - t0) * (W - L - R), Y = v => T + (1 - (v - min) / (max - min)) * (H - T - B);
        const obs = pts.filter(p => !p.f), fc = [obs[obs.length - 1], ...pts.filter(p => p.f)];
        const path = a => this.smooth(a.map(p => [X(p.t), Y(p.v)]));
        const area = a => `${path(a)}L${X(a[a.length - 1].t)},${Y(min)}L${X(a[0].t)},${Y(min)}Z`;
        let g = '';
        for (let v = min; v <= max; v++) g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#D6E3EA"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${v} m</text>`;
        const days = (t1 - t0) / 864e5;
        for (let i = 0; i < 5; i++) {
            const t = t0 + (t1 - t0) * i / 4, d = new Date(t);
            g += `<text x="${X(t)}" y="${H - 8}" text-anchor="${i == 0 ? 'start' : i == 4 ? 'end' : 'middle'}">${days <= 2.5 ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</text>`;
        }
        [['warning', 'Warning', '#C38908'], ['danger', 'Danger', '#B3382C']].forEach(([k, n, c]) => {
            if (lim[k] && lim[k] <= max) g += `<line x1="${L}" x2="${W - R}" y1="${Y(lim[k])}" y2="${Y(lim[k])}" stroke="${c}" stroke-dasharray="5 4"/><text x="${W - R}" y="${Y(lim[k]) - 5}" text-anchor="end" style="fill:${c}">${n} ${lim[k]} m</text>`;
        });
        const nx = X(obs[obs.length - 1].t), ny = Y(obs[obs.length - 1].v);
        el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Water level chart">
<defs><linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0491C9" stop-opacity=".5"/><stop offset="1" stop-color="#0491C9" stop-opacity="0"/></linearGradient>
<linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAC706" stop-opacity=".45"/><stop offset="1" stop-color="#FAC706" stop-opacity="0"/></linearGradient></defs>
${g}<path d="${area(obs)}" fill="url(#${id}o)"/><path d="${path(obs)}" fill="none" stroke="#0675A2" stroke-width="2.5" stroke-linejoin="round"/>
<path d="${area(fc)}" fill="url(#${id}f)"/><path d="${path(fc)}" fill="none" stroke="#C38908" stroke-width="2.5" stroke-dasharray="6 5"/>
<line x1="${nx}" x2="${nx}" y1="${T}" y2="${H - B}" stroke="#4A6572" stroke-dasharray="2 3"/><text x="${nx - 6}" y="${T + 10}" text-anchor="end">Now</text>
<circle cx="${nx}" cy="${ny}" r="6" fill="#FAC706" stroke="#fff" stroke-width="2"/>
<line id="${id}v" y1="${T}" y2="${H - B}" stroke="#002A3F" stroke-opacity=".4" visibility="hidden"/><circle id="${id}c" r="5" fill="#0675A2" stroke="#fff" stroke-width="2" visibility="hidden"/>
<rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent" id="${id}h"/></svg><div class="tip"></div>`;
        const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), vl = svg.querySelector('#' + id + 'v'), dot = svg.querySelector('#' + id + 'c');
        const move = e => {
            const r = svg.getBoundingClientRect(), t = t0 + ((e.clientX - r.left) / r.width * W - L) / (W - L - R) * (t1 - t0);
            const p = pts.reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a);
            vl.setAttribute('x1', X(p.t)); vl.setAttribute('x2', X(p.t)); dot.setAttribute('cx', X(p.t)); dot.setAttribute('cy', Y(p.v));
            vl.setAttribute('visibility', 'visible'); dot.setAttribute('visibility', 'visible');
            tip.style.display = 'block'; tip.style.left = (X(p.t) / W * 100) + '%'; tip.style.top = (Y(p.v) / H * r.height) + 'px';
            tip.textContent = `${new Date(p.t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}: ${p.v.toFixed(2)} m${p.f ? ' (forecast)' : ''}`;
        };
        const hide = () => { tip.style.display = 'none'; vl.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); };
        const h = svg.querySelector('#' + id + 'h'); h.addEventListener('pointermove', move); h.addEventListener('pointerleave', hide);
    }
};

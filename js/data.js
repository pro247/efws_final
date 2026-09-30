/* SAMPLE DATA. Replace FW.series(), FW.devices etc. with fetch() calls to your Node/ESP32 API. */
const FW = {
    mount: 6.5,                                        // sensor height above river bed (m). PLACEHOLDER: calibrate per station
    limits: { watch: 3, warning: 4, danger: 5 },       // PLACEHOLDER thresholds: confirm with your supervisor
    logo: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z" fill="currentColor"/></svg>',
    stations: [
        { id: 'FW-01', name: 'Chikwawa', base: 3.1 }, { id: 'FW-02', name: 'Nsanje', base: 2.2 },
        { id: 'FW-03', name: 'Bangula', base: 2.7 }, { id: 'FW-04', name: 'Ngabu', base: 2.4 }
    ],
    status(l) { return l >= this.limits.danger ? 'Danger' : l >= this.limits.warning ? 'Warning' : l >= this.limits.watch ? 'Watch' : 'Normal'; },
    cls(s) { return { Normal: 'ok', Watch: 'watch', Warning: 'warn', Danger: 'bad', Online: 'ok', Degraded: 'warn', Offline: 'bad', Delivered: 'ok', Partial: 'warn', Failed: 'bad' }[s] || 'ok'; },
    series(st) { // 30 days hourly + 24h forecast (f:true)
        const hr = 36e5, now = Math.floor(Date.now() / hr) * hr, k = st.id.charCodeAt(4), out = [];
        for (let i = -720; i <= 24; i++) {
            const v = st.base + 0.45 * Math.sin(i / 70 + k) + 0.2 * Math.sin(i / 13) + (i > -96 ? (i + 96) * 0.0045 : 0);
            out.push({ t: now + i * hr, v: +v.toFixed(2), tu: +(4 + 1.5 * Math.sin(i / 30 + k)).toFixed(1), f: i > 0 });
        }
        return out;
    },
    devices: [
        { id: 'FW-01', name: 'Chikwawa', status: 'Online', bat: 4.1, rssi: -71, seen: '1 min', fw: '1.2.0', fails: 0 },
        { id: 'FW-02', name: 'Nsanje', status: 'Online', bat: 3.9, rssi: -84, seen: '2 min', fw: '1.2.0', fails: 1 },
        { id: 'FW-03', name: 'Bangula', status: 'Degraded', bat: 3.5, rssi: -102, seen: '9 min', fw: '1.1.4', fails: 7 },
        { id: 'FW-04', name: 'Ngabu', status: 'Offline', bat: 3.2, rssi: null, seen: '3 h', fw: '1.1.4', fails: 12 }
    ],
    sms: [
        { time: '08:12', st: 'Chikwawa', msg: 'Watch alert', n: 214, ok: 210, fail: 4 },
        { time: '06:40', st: 'Nsanje', msg: 'Test message', n: 12, ok: 12, fail: 0 },
        { time: 'Yesterday', st: 'Bangula', msg: 'Node low signal (admin)', n: 3, ok: 3, fail: 0 },
        { time: 'Yesterday', st: 'Chikwawa', msg: 'Watch cleared', n: 214, ok: 198, fail: 16 }
    ],
    alerts: [
        { id: 1, st: 'Chikwawa', type: 'Water level: Watch', since: '2 h ago', ack: false },
        { id: 2, st: 'Ngabu', type: 'Node offline', since: '3 h ago', ack: false },
        { id: 3, st: 'Bangula', type: 'Weak GSM signal', since: '9 min ago', ack: false }
    ]
};

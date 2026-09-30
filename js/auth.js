/* AUTH: DEMO MODE. Read this before shipping.
   Anything in browser JavaScript can be read and edited by the visitor, so this file cannot truly protect anything.
   It shows the correct FLOW and the rules the real server must enforce. To go live, set API to your Node server;
   the server must then (1) check the admin invite code, (2) store the role, (3) hash passwords (bcrypt/argon2),
   (4) issue an httpOnly session cookie, and (5) check the role on EVERY admin/partner API route. See README. */
const Auth = (() => {
    const API = null;                        // e.g. 'http://localhost:3000/api'  (null = demo mode using localStorage)
    const CODES = ['FW-ADMIN-2026'];         // DEMO ONLY. Real invite codes live on the server, one per person.
    const K = { u: 'fw_users', s: 'fw_session', a: 'fw_attempts' };
    const get = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d)), set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
    const fail = m => { throw new Error(m); };
    async function remote(path, body) {
        const r = await fetch(API + path, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const d = await r.json().catch(() => ({})); if (!r.ok) fail(d.error || 'Request failed'); return d;
    }
    const start = u => { const s = { email: u.email, name: u.name, role: u.role, exp: Date.now() + 30 * 60e3 }; sessionStorage.setItem(K.s, JSON.stringify(s)); return s; };
    return {
        async signUp(f) {
            f.email = f.email.trim().toLowerCase();
            if (!['partner', 'admin'].includes(f.role)) fail('Choose a valid account type.');
            if (!f.name.trim()) fail('Enter your full name.');
            if (!/^\S+@\S+\.\S+$/.test(f.email)) fail('Enter a valid email address.');
            if (f.password.length < 8 || !/\d/.test(f.password) || !/[a-z]/i.test(f.password)) fail('Password needs 8+ characters with letters and numbers.');
            if (f.role === 'partner' && !f.org.trim()) fail('Enter your organization.');
            if (API) return start(await remote('/auth/signup', f));
            const users = get(K.u, []);
            if (users.some(u => u.email === f.email)) fail('An account with this email already exists.');
            if (f.role === 'admin' && !CODES.includes(f.code.trim())) fail('Invalid admin invite code.');   // partners cannot become admins
            const salt = crypto.randomUUID(), u = { email: f.email, name: f.name.trim(), org: f.org.trim(), role: f.role, salt, hash: await sha(salt + f.password) };
            users.push(u); set(K.u, users); return start(u);
        },
        async signIn(f) {
            const email = f.email.trim().toLowerCase(), a = get(K.a, { n: 0, until: 0 });
            if (Date.now() < a.until) fail('Too many attempts. Try again in a minute.');
            if (API) return start(await remote('/auth/login', { ...f, email }));
            const u = get(K.u, []).find(x => x.email === email && x.role === f.role);     // role must match the tab used
            if (!u || u.hash !== await sha(u.salt + f.password)) { a.n++; if (a.n >= 5) { a.until = Date.now() + 60e3; a.n = 0; } set(K.a, a); fail('Invalid email or password.'); }
            set(K.a, { n: 0, until: 0 }); return start(u);
        },
        session() { const s = JSON.parse(sessionStorage.getItem(K.s) || 'null'); return s && s.exp > Date.now() ? s : null; },
        require(role) {                                                                   // call at the top of every protected page
            const s = this.session();
            if (!s || s.role !== role) { location.replace((document.body.dataset.root || '') + 'login.html?role=' + role); throw new Error('Not signed in'); }
            return s;
        },
        signOut() { sessionStorage.removeItem(K.s); location.href = (document.body.dataset.root || '') + 'index.html'; }
    };
})();

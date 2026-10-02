const f = document.getElementById('f'), err = document.getElementById('err');
let role = new URLSearchParams(location.search).get('role') === 'admin' ? 'admin' : 'partner', mode = 'in';
function sync() {
    f.dataset.role = role; f.dataset.mode = mode; err.textContent = '';
    document.querySelectorAll('#role button').forEach(b => b.classList.toggle('on', b.dataset.r === role));
    document.querySelectorAll('#mode button').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    document.getElementById('title').textContent = (mode === 'in' ? 'Sign in' : 'Create account') + ' as ' + role;
    document.getElementById('go').textContent = mode === 'in' ? 'Sign in' : 'Create account';
    f.password.autocomplete = mode === 'in' ? 'current-password' : 'new-password';
}
document.querySelectorAll('#role button').forEach(b => b.onclick = () => { role = b.dataset.r; sync(); });
document.querySelectorAll('#mode button').forEach(b => b.onclick = () => { mode = b.dataset.m; sync(); });
f.onsubmit = async e => {
    e.preventDefault(); err.textContent = '';
    const d = Object.fromEntries(new FormData(f)); d.role = role; d.name ||= ''; d.org ||= ''; d.code ||= '';
    try {
        const s = mode === 'in' ? await Auth.signIn(d) : await Auth.signUp(d);
        location.href = s.role === 'admin' ? 'overview.html' : 'partner-portal.html';
    } catch (x) { err.textContent = x.message; }
};
sync();

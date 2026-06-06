const API_URL    = 'https://script.google.com/macros/s/AKfycbzzYNxLgt1syGzrm5ZC0JYRmCwA6veoPWwIaBHrNV2D2A3T3FC6KY1Uoj3WzO2ZDFRHjw/exec';
const SESSION_KEY= 'qs_session';
const SESSION_TTL= 8 * 60 * 60 * 1000; // 8 hours
const USER_CACHE_KEY = 'qs_user_cache'; // stores users added via users.html
 
// ── Built-in demo credentials (always work without GAS) ──────
const BUILTIN = {
  admin:      { password:'admin123',      role:'admin',      fullName:'Administrator' },
  qs:         { password:'qs123',         role:'qs',         fullName:'Quantity Surveyor' },
  purchasing: { password:'purchasing123', role:'purchasing', fullName:'Purchasing Manager' },
};
 
// ── Redirect table ────────────────────────────────────────────
const ROLE_HOME = { admin:'dashboard.html', qs:'dashboard.html', purchasing:'dashboard.html' };
 
// Show timeout banner if redirected after session expiry
if (new URLSearchParams(location.search).get('timeout') === '1') {
  document.getElementById('sessionBanner').classList.add('show');
}
 
// ── Helper: load user cache (users added via users.html) ──────
function loadUserCache() {
  try { return JSON.parse(localStorage.getItem(USER_CACHE_KEY) || '[]'); }
  catch(e) { return []; }
}
 
// ── Helper: save user to cache (called from users.html) ───────
function saveUserToCache(u) {
  const cache = loadUserCache().filter(x => x.username !== u.username);
  cache.push(u);
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cache));
}
 
// ── Main login function ───────────────────────────────────────
async function doLogin() {
  const uname = document.getElementById('uname').value.trim();
  const pass  = document.getElementById('pass').value;
 
  if (!uname || !pass) { showMsg('Username dan password wajib diisi!', 'error'); return; }
  setBusy(true);
 
  let user = null;
 
  // 1️⃣  Built-in hardcoded credentials (always available)
  if (BUILTIN[uname]?.password === pass) {
    user = { username: uname, role: BUILTIN[uname].role, fullName: BUILTIN[uname].fullName };
  }
 
  // 2️⃣  Users added via User Management (cached in localStorage)
  if (!user) {
    const cached = loadUserCache().find(u => u.username === uname && u.password === pass && u.status !== 'nonaktif');
    if (cached) user = { username: cached.username, role: cached.role || 'qs', fullName: cached.fullName || uname };
  }
 
  // 3️⃣  GAS API auth (real users from Spreadsheet)
  if (!user && API_URL !== 'YOUR_GAS_WEBAPP_URL') {
    try {
      const url = `${API_URL}?action=login&username=${encodeURIComponent(uname)}&password=${encodeURIComponent(pass)}`;
      const r   = await fetch(url);
      const d   = await r.json();
      if (d.success && d.user) {
        user = d.user;
        // Cache this user locally so next login is instant
        saveUserToCache({ username: d.user.username, password: pass, role: d.user.role, fullName: d.user.fullName || uname, status: 'aktif' });
      }
    } catch(e) { /* network error — fallback to local cache already done */ }
  }
 
  if (user) {
    // Validate role — default to 'qs' if unknown role
    const validRoles = ['admin','qs','purchasing'];
    if (!validRoles.includes(user.role)) user.role = 'qs';
 
    const sess = { user, ts: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    showMsg('Login berhasil! Mengalihkan…', 'success');
    setTimeout(() => { location.href = ROLE_HOME[user.role] || 'dashboard.html'; }, 700);
  } else {
    showMsg('Username atau password salah, atau akun tidak aktif!', 'error');
    setBusy(false);
  }
}
 
function showMsg(t, type) {
  const el = document.getElementById('msg');
  document.getElementById('msgText').textContent = t;
  el.className = `msg ${type}`;
}
 
function setBusy(v) {
  const b = document.getElementById('loginBtn');
  b.disabled = v;
  b.innerHTML = v ? '<div class="spin"></div>&nbsp; Memverifikasi…' : '<i class="fas fa-sign-in-alt"></i> MASUK';
}
 
function togglePass() {
  const p = document.getElementById('pass'), i = document.getElementById('eyeIco');
  p.type = p.type === 'password' ? 'text' : 'password';
  i.className = p.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}
 
document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
 
// Auto-redirect if session still valid
try {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (raw) {
    const s = JSON.parse(raw);
    if (s?.user && Date.now() - s.ts < SESSION_TTL) {
      location.href = ROLE_HOME[s.user.role] || 'dashboard.html';
    }
  }
} catch(e) {}

/* ============================================================
   QS Manager — Shared Module v3.0
   Embed this <script> block in every page.
   ============================================================ */
 
// ── CONFIG ───────────────────────────────────────────────────
const API_URL = 'https://script.google.com/macros/s/AKfycbzauqH037ucWERfv8SL7xG7FnAhFZ0qFMZPSTn_5wcTrToTiIvnjfchGj2EBFoVPjZM/exec';
 
// ── RBAC ─────────────────────────────────────────────────────
const ROLE_PERMS = {
  admin:      ['dashboard','material','upah','alat','vendor','analisa','ahsp','conversion','users','delete','export','print'],
  qs:         ['dashboard','material','upah','alat','ahsp','conversion','export'],
  purchasing: ['dashboard','material','vendor','analisa','conversion','export','print']
};
 
const MENU_CONFIG = [
  { id:'dashboard', label:'Dashboard',      icon:'fa-chart-pie',      href:'dashboard.html',        section:'main' },
  { id:'material',  label:'Material',       icon:'fa-boxes-stacked',  href:'material.html',         section:'main' },
  { id:'upah',      label:'Upah',           icon:'fa-people-carry-box',href:'material.html#upah',   section:'main' },
  { id:'alat',      label:'Alat',           icon:'fa-wrench',         href:'material.html#alat',    section:'main' },
  { id:'vendor',    label:'Vendor',         icon:'fa-store',          href:'vendor.html',           section:'main' },
  { id:'analisa',   label:'Analisa Harga',  icon:'fa-chart-column',   href:'material.html#analisa', section:'main' },
  { id:'ahsp',      label:'AHSP Builder',   icon:'fa-calculator',     href:'ahsp.html',             section:'main' },
  { id:'conversion',label:'Unit Konversi',  icon:'fa-arrows-rotate',  href:'conversion.html',       section:'main' },
  { id:'users',     label:'User Management',icon:'fa-users-gear',     href:'users.html',            section:'admin'},
];
 
// ── SESSION ───────────────────────────────────────────────────
const QSAuth = {
  SESSION_KEY: 'qs_session',
  SESSION_TTL: 8 * 60 * 60 * 1000, // 8 hours
 
  save(user, token) {
    const sess = { user, token, ts: Date.now() };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sess));
  },
  load() {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      if (!raw) return null;
      const sess = JSON.parse(raw);
      if (Date.now() - sess.ts > this.SESSION_TTL) { this.clear(); return null; }
      return sess;
    } catch(e) { return null; }
  },
  clear() { sessionStorage.removeItem(this.SESSION_KEY); },
  getUser() { return this.load()?.user || null; },
  getRole() { return this.load()?.user?.role || null; },
  can(perm) { return (ROLE_PERMS[this.getRole()] || []).includes(perm); },
  requireAuth(redirectTo = 'index.html') {
    const sess = this.load();
    if (!sess) { location.href = redirectTo; return null; }
    return sess.user;
  },
  requirePerm(perm, redirectTo = 'dashboard.html') {
    const user = this.requireAuth();
    if (!user) return null;
    if (!this.can(perm)) { location.href = redirectTo; return null; }
    return user;
  }
};
 
// ── SIDEBAR BUILDER ────────────────────────────────────────────
function buildSidebar(activeId) {
  const role = QSAuth.getRole() || '';
  const perms = ROLE_PERMS[role] || [];
  const user  = QSAuth.getUser() || {};
 
  const ROLE_BADGE = { admin:'badge-red', qs:'badge-cyan', purchasing:'badge-purple' };
 
  const navItems = MENU_CONFIG.filter(m => perms.includes(m.id)).map(m => `
    <a href="${m.href}" class="nav-item${m.id === activeId ? ' active' : ''}" id="nav-${m.id}">
      <i class="fas ${m.icon}"></i> ${m.label}
    </a>`).join('');
 
  const adminSection = role === 'admin' ? `
    <div class="nav-section">Admin</div>
    <a href="users.html" class="nav-item${activeId === 'users' ? ' active' : ''}" id="nav-users">
      <i class="fas fa-users-gear"></i> User Management
    </a>` : '';
 
  return `
  <aside class="sidebar" id="sidebar">
    <div class="sb-top">
      <div class="logo">
        <div class="logo-ico"><i class="fas fa-hard-hat"></i></div>
        <div><div class="logo-nm">QS MANAGER</div><div class="logo-sub">Construction System</div></div>
      </div>
    </div>
    <nav class="sb-nav">
      <div class="nav-section">Menu</div>
      ${navItems}
      ${adminSection}
      <div class="nav-section">Akun</div>
      <a href="#" class="nav-item" onclick="logout();return false;"><i class="fas fa-sign-out-alt"></i> Keluar</a>
    </nav>
    <div class="sb-foot">
      <div class="user-card">
        <div class="user-av"><i class="fas fa-user"></i></div>
        <div>
          <div class="user-nm">${user.fullName || user.username || '—'}</div>
          <span class="badge ${ROLE_BADGE[role]||'badge-cyan'}" style="font-size:9px;margin-top:2px">${role.toUpperCase()}</span>
        </div>
        <button class="btn-logout" onclick="logout()" title="Logout"><i class="fas fa-sign-out-alt"></i></button>
      </div>
    </div>
  </aside>
  <div class="overlay" id="overlay" onclick="closeSidebar()"></div>`;
}
 
function initSidebar(activeId) {
  document.getElementById('sidebarMount').innerHTML = buildSidebar(activeId);
}
 
// ── SIDEBAR TOGGLE ─────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('open');
}
 
// ── AUTH ───────────────────────────────────────────────────────
function logout() { QSAuth.clear(); location.href = 'index.html'; }
 
// ── API HELPERS ────────────────────────────────────────────────
const QSApi = {
  // ── GET request to GAS Web App ─────────────────────────────
  async get(action, params = {}) {
    if (API_URL === 'https://script.google.com/macros/s/AKfycbzauqH037ucWERfv8SL7xG7FnAhFZ0qFMZPSTn_5wcTrToTiIvnjfchGj2EBFoVPjZM/exec') throw new Error('API_URL belum dikonfigurasi');
    const qs  = new URLSearchParams({ action, ...params }).toString();
    const url = `${API_URL}?${qs}`;
    const r   = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!r.ok) throw new Error(`HTTP ${r.status} — ${r.statusText}`);
    const text = await r.text();
    try   { return JSON.parse(text); }
    catch { throw new Error('Response bukan JSON. Pastikan GAS di-deploy dengan benar dan SPREADSHEET_ID sudah diisi.'); }
  },
  // ── POST request to GAS Web App ────────────────────────────
  async post(payload) {
    if (API_URL === 'https://script.google.com/macros/s/AKfycbzauqH037ucWERfv8SL7xG7FnAhFZ0qFMZPSTn_5wcTrToTiIvnjfchGj2EBFoVPjZM/exec') throw new Error('API_URL belum dikonfigurasi');
    const r = await fetch(API_URL, {
      method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    try   { return JSON.parse(text); }
    catch { throw new Error('Response bukan JSON dari GAS'); }
  }
};
// ── CONNECTION STATUS INDICATOR ────────────────────────────────
function setConnStatus(status, msg) {
  // status: 'checking' | 'connected' | 'demo' | 'error'
  let el = document.getElementById('connStatus');
  if (!el) return;
  const cfg = {
    checking:  { color: 'var(--warning)', icon: 'fa-circle-notch fa-spin', text: 'Menghubungkan…' },
    connected: { color: 'var(--success)', icon: 'fa-circle',               text: 'Terhubung ke Spreadsheet' },
    demo:      { color: 'var(--warning)', icon: 'fa-triangle-exclamation', text: 'Demo Mode — API_URL belum diisi' },
    error:     { color: 'var(--danger)',  icon: 'fa-circle-xmark',         text: msg || 'Koneksi GAS gagal' },
  };
  const c = cfg[status] || cfg.demo;
  el.innerHTML = `<i class="fas ${c.icon}" style="color:${c.color};font-size:10px"></i> <span style="color:${c.color};font-size:10.5px">${c.text}</span>`;
}
 
 
// ── FORMAT UTILS ───────────────────────────────────────────────
const Fmt = {
  rupiah: n => 'Rp\u00A0' + Number(n||0).toLocaleString('id-ID'),
  pct:    n => Number(n||0).toFixed(2).replace(/\.00$/,'') + '%',
  num:    n => Number(n||0).toLocaleString('id-ID'),
  dec:    (n, d=6) => parseFloat(n||0).toFixed(d).replace(/\.?0+$/,'')
};
 
// ── TOAST ──────────────────────────────────────────────────────
function toast(msg, type = 'success', duration = 3000) {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toastWrap'; wrap.style.cssText = 'position:fixed;top:18px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:8px'; document.body.appendChild(wrap); }
  const ICO = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle', warning:'fa-triangle-exclamation' };
  const COL = { success:'var(--success)', error:'var(--danger)', info:'var(--cyan)', warning:'var(--warning)' };
  const el = document.createElement('div');
  el.style.cssText = `display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:500;min-width:240px;background:rgba(22,27,39,.97);border:1px solid ${COL[type]||COL.info};color:${COL[type]||COL.info};box-shadow:0 8px 32px rgba(0,0,0,.5);animation:tin .3s ease;transition:opacity .4s`;
  el.innerHTML = `<i class="fas ${ICO[type]||ICO.info}"></i> ${msg}`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, duration);
}
 
// ── CONFIRM MODAL ──────────────────────────────────────────────
function showConfirm(title, body, onConfirm, confirmLabel = 'Hapus', confirmColor = 'var(--danger)') {
  let existing = document.getElementById('_confirmModal');
  if (existing) existing.remove();
  const m = document.createElement('div');
  m.id = '_confirmModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:8000;display:flex;align-items:center;justify-content:center;padding:16px';
  m.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:26px;max-width:400px;width:100%;animation:mIn .2s ease">
      <div style="font-family:var(--fdisp);font-size:20px;font-weight:700;margin-bottom:8px">${title}</div>
      <div style="color:var(--dim);font-size:13px;line-height:1.6;margin-bottom:20px">${body}</div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button onclick="document.getElementById('_confirmModal').remove()" style="padding:9px 20px;background:var(--card2);border:1px solid var(--border);border-radius:8px;color:var(--dim);font-size:13px;cursor:pointer">Batal</button>
        <button id="_confirmBtn" style="padding:9px 20px;background:${confirmColor};border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;cursor:pointer">${confirmLabel}</button>
      </div>
    </div>`;
  document.body.appendChild(m);
  document.getElementById('_confirmBtn').onclick = () => { m.remove(); onConfirm(); };
}
 
// ── DEBOUNCE ───────────────────────────────────────────────────
function debounce(fn, ms = 350) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
 
// ── CLOCK ──────────────────────────────────────────────────────
function startClock(elId) {
  const tick = () => {
    const el = document.getElementById(elId);
    if (el) el.textContent = new Date().toLocaleString('id-ID',{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  };
  tick(); setInterval(tick, 60000);
}
 
// ── EXPORT CSV ─────────────────────────────────────────────────
function exportCSV(headers, rows, filename) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = filename; a.click();
}
 
// ── SKELETON LOADING ────────────────────────────────────────────
function skeletonRows(cols, count = 5) {
  const cell = `<td><div style="height:12px;background:var(--card3);border-radius:4px;animation:pulse 1.5s ease infinite"></div></td>`;
  return Array(count).fill(`<tr>${cell.repeat(cols)}</tr>`).join('');
}
 
// ── LOCAL CACHE (mirrors index.html's qs_user_cache) ─────────
const USER_CACHE_KEY = 'qs_user_cache';
function loadUserCache(){ try{ return JSON.parse(localStorage.getItem(USER_CACHE_KEY)||'[]'); }catch(e){ return []; } }
function saveToCache(u){
  // Never cache built-in users to avoid password override
  const BUILTIN=['admin','qs','purchasing'];
  if(BUILTIN.includes(u.username)) return;
  const cache=loadUserCache().filter(x=>x.username!==u.username);
  // Only store if password was explicitly set (non-empty)
  if(u._newPassword) cache.push({username:u.username,password:u._newPassword,role:u.role||'qs',fullName:u.fullName||'',status:u.status||'aktif'});
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cache));
}
function removeFromCache(username){
  const cache=loadUserCache().filter(x=>x.username!==username);
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cache));
}
let users=[], usersFiltered=[];
const isDemo=()=>API_URL==='YOUR_GAS_WEBAPP_URL';
const DEMO_USERS=[
  {id:'USR-0001',username:'admin',fullName:'Administrator',role:'admin',status:'aktif',created:'01/01/2025'},
  {id:'USR-0002',username:'qs',fullName:'Quantity Surveyor',role:'qs',status:'aktif',created:'01/01/2025'},
  {id:'USR-0003',username:'purchasing',fullName:'Purchasing Manager',role:'purchasing',status:'aktif',created:'01/01/2025'},
];
 
async function loadUsers(){
  if(isDemo()){users=[...DEMO_USERS];}
  else{try{const r=await QSApi.get('getUsers');if(r.success)users=r.data||[];}catch(e){users=[...DEMO_USERS];}}
  filterUsers();
}
 
const debouncedFilter=debounce(filterUsers);
function filterUsers(){
  const q=(document.getElementById('userSearch').value||'').toLowerCase();
  const role=document.getElementById('userRoleFilter').value;
  usersFiltered=users.filter(u=>(!q||[u.username,u.fullName,u.id].join('|').toLowerCase().includes(q))&&(!role||u.role===role));
  document.getElementById('userCount').textContent=usersFiltered.length+' user';
  renderUsers();
}
 
const ROLE_BADGE_MAP={admin:'badge-red',qs:'badge-cyan',purchasing:'badge-purple'};
function renderUsers(){
  const me=QSAuth.getUser()?.username;
  document.getElementById('userBody').innerHTML=!usersFiltered.length
    ?`<tr><td colspan="7"><div class="empty-state"><i class="fas fa-users-slash"></i><p>Tidak ada pengguna</p></div></td></tr>`
    :usersFiltered.map(u=>`<tr>
      <td class="mono">${u.id}</td>
      <td class="fw-bold" style="color:var(--text)">${u.username}${u.username===me?` <span class="badge badge-yellow" style="font-size:8px">ANDA</span>`:''}</td>
      <td class="text-dim">${u.fullName||'—'}</td>
      <td><span class="badge ${ROLE_BADGE_MAP[u.role]||'badge-gray'}">${u.role?.toUpperCase()}</span></td>
      <td><span class="badge ${u.status==='aktif'?'badge-green':'badge-gray'}">${u.status}</span></td>
      <td class="mono text-muted" style="font-size:10px">${u.created||'—'}</td>
      <td><div class="act-btns">
        <button class="act-btn act-edit" onclick="editUser('${u.id}')" title="Edit"><i class="fas fa-pen"></i></button>
        ${u.username!==me?`<button class="act-btn act-del" onclick="deleteUser('${u.id}','${u.username}')" title="Hapus"><i class="fas fa-trash"></i></button>`:'<button class="act-btn" style="opacity:.2;cursor:not-allowed" disabled title="Tidak bisa hapus akun sendiri"><i class="fas fa-lock"></i></button>'}
      </div></td>
    </tr>`).join('');
}
 
async function saveUser(){
  const id=document.getElementById('userEditId').value;
  const username=document.getElementById('uUsername').value.trim();
  const fullName=document.getElementById('uFullName').value.trim();
  const password=document.getElementById('uPassword').value; // may be empty for updates
  const role=document.getElementById('uRole').value;
  const status=document.getElementById('uStatus').value;
 
  if(!username){toast('Username wajib diisi!','error');return;}
  if(!id&&!password){toast('Password wajib diisi untuk user baru!','error');return;}
 
  const data={id,username,fullName,password,role,status};
 
  // ── Write to localStorage cache so login works immediately ──
  const cacheEntry={username,role,fullName,status,_newPassword:password||null};
 
  if(isDemo()){
    if(id){
      const i=users.findIndex(u=>u.id===id);
      if(i!==-1) users[i]={...users[i],username,fullName,role,status};
    } else {
      const newId='USR-'+String(users.length+1).padStart(4,'0');
      users.push({id:newId,username,fullName,role,status,created:new Date().toLocaleDateString('id-ID')});
    }
    if(password) saveToCache(cacheEntry);
    cancelEditUser();filterUsers();
    toast(id?'User diperbarui! Login dengan password baru sudah aktif.':'User ditambahkan! User dapat login sekarang.');
    return;
  }
 
  const btn=document.getElementById('userSaveBtn');btn.disabled=true;
  try{
    const r=await QSApi.post({action:id?'updateUser':'addUser',data});
    if(r.success){
      if(password) saveToCache(cacheEntry); // cache password for immediate login
      toast(r.message+' — Login sudah aktif.');
      cancelEditUser();
      await loadUsers();
    } else toast(r.message,'error');
  }catch(e){toast('Koneksi error!','error');}
  btn.disabled=false;
}
 
function editUser(id){
  const u=users.find(x=>x.id===id);if(!u)return;
  document.getElementById('userEditId').value=u.id;
  document.getElementById('uUsername').value=u.username;
  document.getElementById('uFullName').value=u.fullName||'';
  document.getElementById('uPassword').value='';
  document.getElementById('uRole').value=u.role||'qs';
  document.getElementById('uStatus').value=u.status||'aktif';
  document.getElementById('userFormTitle').textContent='Edit User';
  document.getElementById('userSaveLbl').textContent='UPDATE USER';
  document.getElementById('passHint').style.display='inline';
  document.getElementById('userCancelBtn').style.display='block';
  document.getElementById('userFormCard').scrollIntoView({behavior:'smooth'});
}
 
function cancelEditUser(){
  ['userEditId','uUsername','uFullName','uPassword'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('uRole').value='qs';document.getElementById('uStatus').value='aktif';
  document.getElementById('userFormTitle').textContent='Tambah User';
  document.getElementById('userSaveLbl').textContent='SIMPAN USER';
  document.getElementById('userCancelBtn').style.display='none';
}
 
function deleteUser(id,username){
  showConfirm('Hapus User',`Hapus user "${username}"? Mereka tidak dapat login lagi.`,async()=>{
    removeFromCache(username); // remove from local login cache immediately
    if(isDemo()){users=users.filter(u=>u.id!==id);filterUsers();toast('User dihapus','info');return;}
    try{const r=await QSApi.post({action:'deleteUser',id});if(r.success){toast(r.message);await loadUsers();}else toast(r.message,'error');}
    catch(e){toast('Error','error');}
  });
}
 
function toggleUPass(){const p=document.getElementById('uPassword'),i=document.getElementById('uEye');p.type=p.type==='password'?'text':'password';i.className=p.type==='password'?'fas fa-eye':'fas fa-eye-slash';}
 
const _user=QSAuth.requirePerm('users');
if(_user){initSidebar('users');loadUsers();}

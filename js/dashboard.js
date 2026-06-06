/* ============================================================
   QS Manager — Shared Module v3.0
   Embed this <script> block in every page.
   ============================================================ */
 
// ── CONFIG ───────────────────────────────────────────────────
const API_URL    = 'https://script.google.com/macros/s/AKfycbzzYNxLgt1syGzrm5ZC0JYRmCwA6veoPWwIaBHrNV2D2A3T3FC6KY1Uoj3WzO2ZDFRHjw/exec';
 
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
    if (API_URL === 'YOUR_GAS_WEBAPP_URL') throw new Error('API_URL belum dikonfigurasi');
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
    if (API_URL === 'YOUR_GAS_WEBAPP_URL') throw new Error('API_URL belum dikonfigurasi');
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
 
// ── DEMO DATA ────────────────────────────────────────────────
function demoData(){
  return {
    totalMaterial:148,totalVendor:31,activeVendors:26,totalPekerjaan:22,totalUpah:38,totalAlat:15,totalUsers:5,
    topMaterials:[
      {nama:'Beton Ready Mix K-350',harga:1250000},{nama:'Pasir Beton',harga:325000},
      {nama:'Plywood 18mm Film Faced',harga:320000},{nama:'Agregat Kasar 2/3',harga:285000},
      {nama:'Cat Eksterior',harga:215000},{nama:'Keramik 60×60',harga:185000},
      {nama:'Semen Portland 50kg',harga:78000},{nama:'Bata Ringan AAC',harga:12500}
    ],
    byCategory:{'Beton':42,'Besi & Baja':25,'Finishing':28,'Keramik':18,'Kayu':20,'Plumbing':15},
    recent:[
      {id:'MAT-0148',nama:'Beton K-400',kategori:'Beton',harga:1350000,vendor:'PT Holcim',satuan:'m³'},
      {id:'MAT-0147',nama:'Besi D19',kategori:'Besi & Baja',harga:19200,vendor:'PT Krakatau Steel',satuan:'kg'},
      {id:'MAT-0146',nama:'Keramik 80×80',kategori:'Keramik',harga:265000,vendor:'PT Roman Tiles',satuan:'m²'},
      {id:'MAT-0145',nama:'Cat Dasar Interior',kategori:'Finishing',harga:95000,vendor:'CV Mitra Cat',satuan:'kg'},
      {id:'MAT-0144',nama:'Pipa PPR 3/4"',kategori:'Plumbing',harga:45000,vendor:'PT Wavin',satuan:'btg'}
    ],
    bestPrices:[
      {nama:'Besi Beton D16',minHarga:17800,vendor:'PT Ispatindo'},
      {nama:'Semen Portland 50kg',minHarga:76000,vendor:'PT Tiga Roda'},
      {nama:'Pasir Beton',minHarga:310000,vendor:'CV Pasir Jaya'},
      {nama:'Beton K-350',minHarga:1200000,vendor:'PT Holcim'},
      {nama:'Keramik 60×60',minHarga:175000,vendor:'PT Roman Tiles'}
    ]
  };
}
 
// ── RENDER ────────────────────────────────────────────────────
function renderStats(d){
  const cards=[
    {label:'Total Material',val:d.totalMaterial,sub:'jenis',icon:'fa-boxes-stacked',cls:'c-orange'},
    {label:'Vendor',val:d.totalVendor,sub:d.activeVendors+' aktif',icon:'fa-store',cls:'c-cyan'},
    {label:'AHSP',val:d.totalPekerjaan,sub:'pekerjaan',icon:'fa-calculator',cls:'c-green'},
    {label:'Upah',val:d.totalUpah,sub:'item tenaga',icon:'fa-people-carry-box',cls:'c-purple'},
    {label:'Alat',val:d.totalAlat,sub:'item alat',icon:'fa-wrench',cls:'c-yellow'},
    {label:'Users',val:d.totalUsers||'—',sub:'pengguna aktif',icon:'fa-users',cls:'c-red'},
  ];
  document.getElementById('statsGrid').innerHTML=cards.map(c=>`
    <div class="stat-card ${c.cls}">
      <div class="stat-label">${c.label}</div>
      <div class="stat-val">${c.val}</div>
      <div class="stat-sub">${c.sub}</div>
      <i class="fas ${c.icon} stat-ico"></i>
    </div>`).join('');
}
 
let chMat,chCat;
Chart.defaults.color='#526070';Chart.defaults.font.family="'JetBrains Mono',monospace";Chart.defaults.font.size=10;
 
function renderCharts(d){
  if(chMat)chMat.destroy();
  chMat=new Chart(document.getElementById('chartMaterial'),{type:'bar',
    data:{labels:d.topMaterials.map(m=>m.nama.length>20?m.nama.slice(0,18)+'…':m.nama),
      datasets:[{data:d.topMaterials.map(m=>m.harga),backgroundColor:'rgba(249,115,22,.65)',borderColor:'#F97316',borderWidth:1,borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'Rp '+ctx.raw.toLocaleString('id-ID')}}},
      scales:{x:{grid:{color:'rgba(255,255,255,.03)'},ticks:{font:{size:9},maxRotation:30}},
              y:{grid:{color:'rgba(255,255,255,.03)'},ticks:{callback:v=>v>=1e6?'Rp '+(v/1e6).toFixed(1)+'jt':'Rp '+v.toLocaleString('id-ID')}}}}});
 
  if(chCat)chCat.destroy();
  const cats=Object.keys(d.byCategory),vals=cats.map(c=>d.byCategory[c]);
  const cols=['#F97316','#22D3EE','#22C55E','#A78BFA','#EAB308','#EF4444','#F472B6','#34D399'];
  chCat=new Chart(document.getElementById('chartCategory'),{type:'doughnut',
    data:{labels:cats,datasets:[{data:vals,backgroundColor:cols.slice(0,cats.length),borderColor:'#141B26',borderWidth:3}]},
    options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'right',labels:{boxWidth:10,padding:10}},
      tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.raw} item`}}},cutout:'65%'}});
}
 
function renderRecent(rows){
  if(!rows.length){document.getElementById('recentTable').innerHTML='<div class="empty-state"><i class="fas fa-inbox"></i><p>Belum ada material</p></div>';return;}
  document.getElementById('recentTable').innerHTML=`<table class="tbl"><thead><tr><th>ID</th><th>Nama Material</th><th>Kategori</th><th>Vendor</th><th>Harga</th></tr></thead><tbody>
    ${rows.map(m=>`<tr><td class="mono">${m.id}</td><td class="fw-bold" style="color:var(--text)">${m.nama}</td><td><span class="badge badge-orange">${m.kategori||'—'}</span></td><td class="text-dim">${m.vendor||'—'}</td><td class="currency">${Fmt.rupiah(m.harga)}</td></tr>`).join('')}
  </tbody></table>`;
}
 
function renderBest(rows){
  if(!rows||!rows.length){document.getElementById('bestTable').innerHTML='<div class="empty-state"><i class="fas fa-chart-column"></i><p>Belum ada data analisa</p></div>';return;}
  document.getElementById('bestTable').innerHTML=`<table class="tbl"><thead><tr><th>Nama Material</th><th>Vendor Termurah</th><th>Harga Terendah</th><th></th></tr></thead><tbody>
    ${rows.map(r=>`<tr class="best-price-row"><td>${r.nama}</td><td class="text-dim">${r.vendor||'—'}</td><td class="currency">${Fmt.rupiah(r.minHarga)}</td><td><span class="badge badge-green">BEST PRICE</span></td></tr>`).join('')}
  </tbody></table>`;
}
 
async function loadDashboard(){
  document.getElementById('statsGrid').innerHTML='<div class="loader" style="grid-column:1/-1"><div class="spin"></div> Memuat…</div>';
  try {
    let d;
    if(API_URL==='YOUR_GAS_WEBAPP_URL') d=demoData();
    else { const r=await QSApi.get('getDashboard'); d=r.success?r.data:demoData(); }
    renderStats(d); renderCharts(d); renderRecent(d.recent||[]); renderBest(d.bestPrices||[]);
  } catch(e){ const d=demoData(); renderStats(d); renderCharts(d); renderRecent(d.recent); renderBest(d.bestPrices); }
}
 
// ── INIT ──────────────────────────────────────────────────────
const _user = QSAuth.requireAuth();
if(_user){ initSidebar('dashboard'); startClock('clock'); loadDashboard(); }

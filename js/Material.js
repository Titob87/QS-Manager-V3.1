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
 
// ── STATE ─────────────────────────────────────────────────────
let materials=[], upahList=[], alatList=[], vendorDB=[], analisaData=[], conversionRules=[];
let matFiltered=[], matPage=1, matPerPage=25, matSortKey='', matSortAsc=true;
let currentTab='material';
const VALID_TABS=['material','upah','alat','analisa'];
 
// ── TABS ──────────────────────────────────────────────────────
function buildTabs(role){
  const perms=ROLE_PERMS[role]||[];
  const tabDefs=[
    {id:'material',label:'Material',icon:'fa-boxes-stacked',perm:'material'},
    {id:'upah',label:'Upah',icon:'fa-user-tie',perm:'upah'},
    {id:'alat',label:'Alat',icon:'fa-wrench',perm:'alat'},
    {id:'analisa',label:'Analisa Harga',icon:'fa-chart-column',perm:'analisa'},
  ];
  document.getElementById('pageTabs').innerHTML=tabDefs.filter(t=>perms.includes(t.perm)).map(t=>`<div class="tab" id="tab-${t.id}" onclick="openTab('${t.id}')"><i class="fas ${t.icon}"></i> ${t.label}</div>`).join('');
}
 
function navTo(tab){openTab(tab);return false;}
function openTab(tab){switchTab(tab,true);}
function switchTab(tab,updateHash=false){
  const role=QSAuth.getRole()||'';const perms=ROLE_PERMS[role]||[];
  if(!perms.includes(tab==='analisa'?'analisa':tab)) tab=perms.includes('material')?'material':perms[0]||'material';
  if(!VALID_TABS.includes(tab)) tab='material';
  currentTab=tab;
  VALID_TABS.forEach(t=>{
    document.getElementById('tab-'+t)?.classList.toggle('active',t===tab);
    const p=document.getElementById('panel-'+t);if(p)p.className='panel'+(t===tab?' active':'');
  });
  if(updateHash) history.replaceState(null,'',location.pathname+(tab==='material'?'':'#'+tab));
  syncSidebarActive(tab==='analisa'?'analisa':tab==='material'?'material':tab==='upah'?'upah':'alat');
  // Build toolbar actions for current tab
  updateTopbarActions();
}
 
function syncSidebarActive(id){
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  document.getElementById('nav-'+id)?.classList.add('active');
}
 
function updateTopbarActions(){
  const role=QSAuth.getRole();
  let html='';
  if(currentTab==='analisa'&&(role==='purchasing'||role==='admin')) html+=`<button class="btn btn-success btn-sm" onclick="printAnalisaPDF()"><i class="fas fa-file-pdf"></i> Export PDF</button>`;
  if(currentTab==='material') html+=`<button class="btn btn-secondary btn-sm" onclick="exportMatCSV()"><i class="fas fa-file-csv"></i> CSV</button>`;
  document.getElementById('topbarActions').innerHTML=html;
}
 
function initHashRouting(){
  function apply(){
    const hash=location.hash.replace('#','');
    switchTab(VALID_TABS.includes(hash)?hash:'material',false);
  }
  apply(); window.addEventListener('hashchange',apply);
}
 
// ── DEMO DATA ─────────────────────────────────────────────────
function demoMaterials(){return[
  {id:'MAT-0001',kategori:'Beton',subKategori:'Ready Mix',nama:'Beton K-350',spesifikasi:'Ready mix slump 12cm',satuan:'m³',harga:1250000,vendor:'PT Holcim Indonesia'},
  {id:'MAT-0002',kategori:'Beton',subKategori:'Ready Mix',nama:'Beton K-350',spesifikasi:'Ready mix',satuan:'m³',harga:1200000,vendor:'PT Merak Jaya Beton'},
  {id:'MAT-0003',kategori:'Besi & Baja',subKategori:'Tulangan',nama:'Besi Beton D16',spesifikasi:'BJTS 420B',satuan:'kg',harga:18500,vendor:'PT Krakatau Steel'},
  {id:'MAT-0004',kategori:'Besi & Baja',subKategori:'Tulangan',nama:'Besi Beton D16',spesifikasi:'BJTS 420B',satuan:'kg',harga:17800,vendor:'PT Ispatindo'},
  {id:'MAT-0005',kategori:'Besi & Baja',subKategori:'Tulangan',nama:'Besi Beton D12',spesifikasi:'BJTS 420B',satuan:'kg',harga:17500,vendor:'PT Krakatau Steel'},
  {id:'MAT-0006',kategori:'Beton',subKategori:'Material Dasar',nama:'Semen Portland 50kg',spesifikasi:'OPC Type I',satuan:'sak',harga:78000,vendor:'PT Tiga Roda'},
  {id:'MAT-0007',kategori:'Beton',subKategori:'Material Dasar',nama:'Semen Portland 50kg',spesifikasi:'OPC Type I',satuan:'sak',harga:76000,vendor:'PT Holcim'},
  {id:'MAT-0008',kategori:'Beton',subKategori:'Material Dasar',nama:'Pasir Beton',spesifikasi:'Pasir sungai',satuan:'m³',harga:325000,vendor:'CV Pasir Jaya'},
  {id:'MAT-0009',kategori:'Beton',subKategori:'Material Dasar',nama:'Pasir Beton',spesifikasi:'Pasir sungai',satuan:'m³',harga:310000,vendor:'CV Bumi Makmur'},
  {id:'MAT-0010',kategori:'Kayu',subKategori:'Bekisting',nama:'Plywood 18mm',spesifikasi:'Film Faced 4×8ft',satuan:'lbr',harga:320000,vendor:'UD Kayu Mas'},
  {id:'MAT-0011',kategori:'Finishing',subKategori:'Cat',nama:'Cat Eksterior',spesifikasi:'Weathershield 20kg',satuan:'kg',harga:215000,vendor:'CV Mitra Cat'},
  {id:'MAT-0012',kategori:'Keramik',subKategori:'Lantai',nama:'Keramik 60×60 Polished',spesifikasi:'Grade A',satuan:'m²',harga:185000,vendor:'PT Roman Tiles'},
  {id:'MAT-0013',kategori:'Keramik',subKategori:'Lantai',nama:'Keramik 60×60 Polished',spesifikasi:'Grade A',satuan:'m²',harga:175000,vendor:'PT Platinum'},
];}
function demoUpah(){return[
  {id:'UPH-0001',nama:'Mandor',satuan:'OH',harga:350000},{id:'UPH-0002',nama:'Kepala Tukang',satuan:'OH',harga:300000},
  {id:'UPH-0003',nama:'Tukang Batu',satuan:'OH',harga:250000},{id:'UPH-0004',nama:'Tukang Besi',satuan:'OH',harga:260000},
  {id:'UPH-0005',nama:'Pembantu Tukang',satuan:'OH',harga:180000},
];}
function demoAlat(){return[
  {id:'ALT-0001',nama:'Concrete Mixer 0.3m³',satuan:'jam',harga:45000,vendor:'PT Sewa Alat'},
  {id:'ALT-0002',nama:'Concrete Vibrator',satuan:'jam',harga:35000,vendor:'PT Sewa Alat'},
  {id:'ALT-0003',nama:'Bar Cutter & Bender',satuan:'hari',harga:150000,vendor:'CV Rental Konstruksi'},
  {id:'ALT-0004',nama:'Tower Crane 30 ton',satuan:'hari',harga:3500000,vendor:'PT Heavy Lift'},
];}
 
function demoVendors(){return[
  {id:'VND-0001',namaVendor:'PT Holcim Indonesia',kota:'Jakarta',kategori:'Semen & Beton',status:'Aktif'},
  {id:'VND-0002',namaVendor:'PT Krakatau Steel',kota:'Cilegon',kategori:'Besi & Baja',status:'Aktif'},
  {id:'VND-0003',namaVendor:'PT Roman Tiles',kota:'Bekasi',kategori:'Keramik & Granit',status:'Aktif'},
  {id:'VND-0004',namaVendor:'CV Mitra Cat',kota:'Bandung',kategori:'Finishing',status:'Aktif'},
  {id:'VND-0005',namaVendor:'PT Wavin Indonesia',kota:'Tangerang',kategori:'Plumbing',status:'Aktif'},
  {id:'VND-0006',namaVendor:'CV Pasir Jaya',kota:'Solo',kategori:'Material Bangunan',status:'Aktif'},
  {id:'VND-0007',namaVendor:'PT Ispatindo',kota:'Surabaya',kategori:'Besi & Baja',status:'Aktif'},
  {id:'VND-0008',namaVendor:'UD Kayu Mas',kota:'Semarang',kategori:'Kayu & Plywood',status:'Aktif'},
  {id:'VND-0009',namaVendor:'PT Sewa Alat',kota:'Jakarta',kategori:'Alat & Mesin',status:'Aktif'},
  {id:'VND-0010',namaVendor:'CV Rental Konstruksi',kota:'Depok',kategori:'Alat & Mesin',status:'Aktif'},
  {id:'VND-0011',namaVendor:'PT Tiga Roda',kota:'Jakarta',kategori:'Semen & Beton',status:'Aktif'},
  {id:'VND-0012',namaVendor:'PT Platinum',kota:'Surabaya',kategori:'Keramik & Granit',status:'Aktif'},
];}
 
function demoConvRules(){return[
  {id:'CONV-0001',namaMaterial:'Kabel NYM',kategori:'Elektrikal',unitVendor:'Roll',faktor:100,unitDasar:'m',wastePct:5,purchasePct:2,aktif:true},
  {id:'CONV-0002',namaMaterial:'Wiremesh',kategori:'Besi & Baja',unitVendor:'Lembar',faktor:5.4,unitDasar:'m²',wastePct:5,purchasePct:2,aktif:true},
  {id:'CONV-0003',namaMaterial:'Cat',kategori:'Finishing',unitVendor:'Pail',faktor:20,unitDasar:'liter',wastePct:3,purchasePct:0,aktif:true},
  {id:'CONV-0004',namaMaterial:'Pipa',kategori:'Plumbing',unitVendor:'Batang',faktor:4,unitDasar:'m',wastePct:5,purchasePct:0,aktif:true},
  {id:'CONV-0005',namaMaterial:'Keramik',kategori:'Keramik',unitVendor:'Dus',faktor:1.44,unitDasar:'m²',wastePct:5,purchasePct:0,aktif:true},
  {id:'CONV-0006',namaMaterial:'Granit',kategori:'Keramik',unitVendor:'Dus',faktor:1.08,unitDasar:'m²',wastePct:5,purchasePct:0,aktif:true},
  {id:'CONV-0007',namaMaterial:'Besi Beton',kategori:'Besi & Baja',unitVendor:'Ton',faktor:1000,unitDasar:'kg',wastePct:2,purchasePct:0,aktif:true},
  {id:'CONV-0008',namaMaterial:'Semen',kategori:'Beton',unitVendor:'Ton',faktor:20,unitDasar:'sak',wastePct:1,purchasePct:0,aktif:true},
];}
 
// ── CONVERSION ENGINE (client-side) ───────────────────────────
function findConvRule(namaMaterial,unitVendor){
  if(!conversionRules.length) return null;
  const nm=String(namaMaterial||'').toLowerCase().trim();
  const uv=String(unitVendor||'').toLowerCase().trim();
  let rule=conversionRules.find(c=>c.aktif&&c.namaMaterial.toLowerCase()===nm&&c.unitVendor.toLowerCase()===uv);
  if(!rule) rule=conversionRules.find(c=>c.aktif&&nm.includes(c.namaMaterial.toLowerCase())&&c.unitVendor.toLowerCase()===uv&&c.namaMaterial.length>2);
  return rule||null;
}
function calcConversion(hargaVendor,faktor,wastePct,purchasePct){
  const h=parseFloat(hargaVendor)||0,f=parseFloat(faktor)||1,w=parseFloat(wastePct)||0,p=parseFloat(purchasePct)||0;
  const base=h/f,withWaste=base*(1+w/100),final=withWaste*(1+p/100);
  return{base:Math.round(base),wasteAmt:Math.round(base*w/100),purchaseAmt:Math.round(withWaste*p/100),final:Math.round(final)};
}
function toggleConvSection(){
  const on=document.getElementById('convToggle').checked;
  document.getElementById('convSection').style.display=on?'block':'none';
  if(!on) document.getElementById('convResult').style.display='none';
}
function autoConvertPrice(){
  const nama=document.getElementById('matNama').value.trim();
  const uv=document.getElementById('convUnitVendor').value;
  const harga=parseFloat(document.getElementById('convHargaVendor').value)||0;
  let faktor=parseFloat(document.getElementById('convFaktor').value)||0;
  let waste=parseFloat(document.getElementById('convWaste').value)||0;
  let purchase=parseFloat(document.getElementById('convPurchase').value)||0;
  const rule=findConvRule(nama,uv);
  const badge=document.getElementById('convRuleBadge');
  if(rule&&!faktor){
    faktor=rule.faktor;waste=rule.wastePct||0;purchase=rule.purchasePct||0;
    document.getElementById('convFaktor').value=faktor;
    document.getElementById('convWaste').value=waste||'';
    document.getElementById('convPurchase').value=purchase||'';
    badge.innerHTML=`<span style="font-size:10.5px;color:var(--success);display:flex;align-items:center;gap:5px"><i class="fas fa-check-circle"></i> Aturan ditemukan: 1 ${uv} = ${Fmt.dec(faktor,4)} ${rule.unitDasar}</span>`;
  } else if(!rule&&uv&&nama){
    badge.innerHTML=`<a href="conversion.html" style="font-size:10.5px;color:var(--warning);display:flex;align-items:center;gap:5px"><i class="fas fa-triangle-exclamation"></i> Aturan tidak ditemukan — isi faktor manual atau <u>kelola konversi</u></a>`;
  } else badge.innerHTML='';
  if(!harga||!faktor){document.getElementById('convResult').style.display='none';return;}
  const res=calcConversion(harga,faktor,waste,purchase);
  const ud=rule?rule.unitDasar:(document.getElementById('matSatuan').value||'unit');
  document.getElementById('matHarga').value=res.final;
  if(ud&&!document.getElementById('matSatuan').value) document.getElementById('matSatuan').value=ud;
  document.getElementById('convResult').style.display='block';
  document.getElementById('convFormula').textContent=`${Fmt.rupiah(harga)} ÷ ${Fmt.dec(faktor,4)}${waste>0?` ×(1+${waste}%)`:''}${purchase>0?` ×(1+${purchase}%)`:''}`;
  document.getElementById('convResultVal').textContent=`${Fmt.rupiah(res.final)} / ${ud}`;
  document.getElementById('convRuleHint').textContent=`✓ Harga AHSP diisi otomatis: ${Fmt.rupiah(res.final)} / ${ud}`;
}
 
// ── API / DEMO ─────────────────────────────────────────────────
const isDemo=()=>API_URL==='https://script.google.com/macros/s/AKfycbzauqH037ucWERfv8SL7xG7FnAhFZ0qFMZPSTn_5wcTrToTiIvnjfchGj2EBFoVPjZM/exec';
 
async function loadAll(){
  // Show checking status
  setConnStatus('checking');
 
  if(isDemo()){
    materials=demoMaterials(); upahList=demoUpah(); alatList=demoAlat();
    vendorDB=demoVendors(); conversionRules=demoConvRules();
    setConnStatus('demo');
    buildDataLists(); vndBuild('mat'); vndBuild('alat');
    renderMaterial(); renderUpah(); renderAlat();
    return;
  }
 
  try {
    const [rm,ru,ra,rv,rc]=await Promise.all([
      QSApi.get('getMaterials',{limit:2000}),
      QSApi.get('getUpah'),
      QSApi.get('getAlat'),
      QSApi.get('getVendors',{limit:1000}),
      QSApi.get('getConversions')
    ]);
    if(rm.success) materials=rm.data||[]; else throw new Error(rm.message);
    if(ru.success) upahList=ru.data||[];
    if(ra.success) alatList=ra.data||[];
    if(rv.success) vendorDB=rv.data||[];
    if(rc.success) conversionRules=rc.data||[];
    setConnStatus('connected');
  } catch(e) {
    console.error('loadAll error:', e.message);
    setConnStatus('error', e.message);
    toast('Koneksi GAS gagal: ' + e.message + ' — Menampilkan data demo.', 'error', 6000);
    materials=demoMaterials(); upahList=demoUpah(); alatList=demoAlat();
    vendorDB=demoVendors(); conversionRules=demoConvRules();
  }
 
  buildDataLists(); vndBuild('mat'); vndBuild('alat');
  renderMaterial(); renderUpah(); renderAlat();
}
 
async function loadAnalisa(){
  document.getElementById('analisaBody').innerHTML='<div class="loader"><div class="spin"></div> Memuat analisa harga…</div>';
  try {
    let data;
    if(isDemo()){ data=buildAnalisaFromMaterials(materials); }
    else { const r=await QSApi.get('getPriceAnalysis'); data=r.success?r.data:buildAnalisaFromMaterials(materials); }
    analisaData=data; filterAnalisa();
  } catch(e){ analisaData=buildAnalisaFromMaterials(materials); filterAnalisa(); }
}
 
function buildAnalisaFromMaterials(mats){
  const groups={};
  mats.forEach(m=>{
    const nm=String(m.nama||'').trim(); const h=parseFloat(m.harga)||0; if(!nm||!h)return;
    if(!groups[nm]) groups[nm]={nama:nm,kategori:m.kategori||'',satuan:m.satuan||'',vendors:[]};
    groups[nm].vendors.push({vendor:m.vendor||'(tanpa vendor)',harga:h,id:m.id});
  });
  return Object.values(groups).filter(g=>g.vendors.length>=1).map(g=>{
    const prices=g.vendors.map(v=>v.harga);
    const minH=Math.min(...prices),maxH=Math.max(...prices),avgH=prices.reduce((s,p)=>s+p,0)/prices.length;
    const ranked=[...g.vendors].sort((a,b)=>a.harga-b.harga).map((v,i)=>({
      ...v,rank:i+1,isBest:v.harga===minH,isWorst:v.harga===maxH,
      selisihNominal:v.harga-minH,selisihPersen:minH>0?Math.round(((v.harga-minH)/minH)*100):0
    }));
    return{...g,vendors:ranked,minHarga:minH,maxHarga:maxH,avgHarga:Math.round(avgH)};
  }).sort((a,b)=>a.nama.localeCompare(b.nama));
}
 
function buildDataLists(){
  const cats=[...new Set(materials.map(m=>m.kategori).filter(Boolean))].sort();
  const subs=[...new Set(materials.map(m=>m.subKategori).filter(Boolean))].sort();
  document.getElementById('catList').innerHTML=cats.map(c=>`<option value="${c}">`).join('');
  document.getElementById('subList').innerHTML=subs.map(s=>`<option value="${s}">`).join('');
  const katSel=document.getElementById('matFilterKat');
  katSel.innerHTML='<option value="">Semua Kategori</option>'+cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  const anKat=document.getElementById('analisaKatFilter');
  anKat.innerHTML='<option value="">Semua Kategori</option>'+cats.map(c=>`<option value="${c}">${c}</option>`).join('');
}
 
// ══════════════════════════════════════════════════════════════
// VENDOR SEARCHABLE DROPDOWN ENGINE
// ctx = 'mat' | 'alat'
// ══════════════════════════════════════════════════════════════
const VND_STATE = { mat:{ open:false, kbd:-1 }, alat:{ open:false, kbd:-1 } };
 
// Build/rebuild dropdown options from vendorDB
function vndBuild(ctx){
  const q = (document.getElementById(`${ctx}VendorSearch`)?.value || '').toLowerCase().trim();
  const activeOnly = vendorDB.filter(v => v.status !== 'Nonaktif');
  const filtered = q
    ? activeOnly.filter(v => v.namaVendor.toLowerCase().includes(q) || (v.kota||'').toLowerCase().includes(q) || (v.kategori||'').toLowerCase().includes(q))
    : activeOnly;
 
  const currentVal = document.getElementById(`${ctx}Vendor`)?.value || '';
  const drop = document.getElementById(`${ctx}VendorDrop`);
  if (!drop) return;
 
  if (!filtered.length) {
    drop.innerHTML = `<div class="vnd-empty"><i class="fas fa-store-slash"></i>${q ? 'Vendor tidak ditemukan' : 'Belum ada vendor'}</div>`;
    return;
  }
 
  drop.innerHTML = filtered.map((v, i) => `
    <div class="vnd-opt ${v.namaVendor===currentVal?'is-selected':''}" data-val="${v.namaVendor}" data-idx="${i}"
      onmousedown="vndSelect('${ctx}','${v.namaVendor.replace(/'/g,"\\'")}',event)">
      <div class="vnd-opt-ico"><i class="fas fa-store"></i></div>
      <div class="vnd-opt-body">
        <div class="vnd-opt-name">${v.namaVendor}</div>
        <div class="vnd-opt-meta">${v.kategori||'—'} &bull; ${v.kota||'—'}</div>
      </div>
      ${v.namaVendor===currentVal?'<i class="fas fa-check" style="color:var(--primary);font-size:10px"></i>':''}
    </div>`).join('');
}
 
function vndOpen(ctx){
  VND_STATE[ctx].open = true;
  VND_STATE[ctx].kbd  = -1;
  document.getElementById(`${ctx}VendorDrop`).classList.add('open');
  document.getElementById(`${ctx}VendorCaretIco`).style.transform = 'rotate(180deg)';
  vndBuild(ctx);
}
 
function vndClose(ctx){
  VND_STATE[ctx].open = false;
  VND_STATE[ctx].kbd  = -1;
  document.getElementById(`${ctx}VendorDrop`)?.classList.remove('open');
  const ico = document.getElementById(`${ctx}VendorCaretIco`);
  if(ico) ico.style.transform = '';
  // Restore search text to selected vendor name (if any)
  const val = document.getElementById(`${ctx}Vendor`)?.value || '';
  const el  = document.getElementById(`${ctx}VendorSearch`);
  if(el) el.value = val ? '' : '';
}
 
function vndToggle(ctx){
  if(VND_STATE[ctx].open) vndClose(ctx); else vndOpen(ctx);
}
 
function vndFilter(ctx){
  if(!VND_STATE[ctx].open) vndOpen(ctx);
  VND_STATE[ctx].kbd = -1;
  vndBuild(ctx);
}
 
function vndSelect(ctx, val, event){
  if(event) event.preventDefault(); // prevent blur before select
  document.getElementById(`${ctx}Vendor`).value = val;
  document.getElementById(`${ctx}VendorSearch`).value = '';
  // Show badge
  document.getElementById(`${ctx}VendorBadge`).style.display = 'inline-flex';
  document.getElementById(`${ctx}VendorBadgeTxt`).textContent = val;
  // Caret becomes clear button
  const caret = document.getElementById(`${ctx}VendorCaret`);
  caret.classList.add('has-val');
  caret.title = 'Hapus pilihan';
  document.getElementById(`${ctx}VendorCaretIco`).className = 'fas fa-times';
  vndClose(ctx);
  toast(`Vendor dipilih: ${val}`, 'info', 1500);
}
 
function vndClear(ctx){
  document.getElementById(`${ctx}Vendor`).value = '';
  document.getElementById(`${ctx}VendorSearch`).value = '';
  document.getElementById(`${ctx}VendorBadge`).style.display = 'none';
  const caret = document.getElementById(`${ctx}VendorCaret`);
  caret.classList.remove('has-val');
  caret.title = '';
  document.getElementById(`${ctx}VendorCaretIco`).className = 'fas fa-chevron-down';
  vndBuild(ctx);
}
 
// Keyboard navigation (arrow up/down, enter, escape)
function vndKey(e, ctx){
  const drop  = document.getElementById(`${ctx}VendorDrop`);
  const opts  = drop.querySelectorAll('.vnd-opt');
  const state = VND_STATE[ctx];
  if(!state.open && (e.key==='ArrowDown'||e.key==='Enter')){ vndOpen(ctx); return; }
  if(e.key==='Escape'){ vndClose(ctx); return; }
  if(e.key==='ArrowDown'){
    e.preventDefault();
    state.kbd = Math.min(state.kbd+1, opts.length-1);
    opts.forEach((o,i)=>o.classList.toggle('kbd-focus',i===state.kbd));
    opts[state.kbd]?.scrollIntoView({block:'nearest'});
  } else if(e.key==='ArrowUp'){
    e.preventDefault();
    state.kbd = Math.max(state.kbd-1, 0);
    opts.forEach((o,i)=>o.classList.toggle('kbd-focus',i===state.kbd));
    opts[state.kbd]?.scrollIntoView({block:'nearest'});
  } else if(e.key==='Enter'&&state.kbd>=0){
    e.preventDefault();
    const val = opts[state.kbd]?.dataset.val;
    if(val) vndSelect(ctx, val, null);
  }
}
 
// Set vendor value programmatically (used when editing)
function vndSetValue(ctx, val){
  document.getElementById(`${ctx}Vendor`).value = val || '';
  document.getElementById(`${ctx}VendorSearch`).value = '';
  if(val){
    document.getElementById(`${ctx}VendorBadge`).style.display='inline-flex';
    document.getElementById(`${ctx}VendorBadgeTxt`).textContent=val;
    const caret=document.getElementById(`${ctx}VendorCaret`);
    caret.classList.add('has-val'); caret.title='Hapus pilihan';
    document.getElementById(`${ctx}VendorCaretIco`).className='fas fa-times';
  } else {
    vndClear(ctx);
  }
}
 
// Close dropdown when clicking outside
document.addEventListener('click', e=>{
  ['mat','alat'].forEach(ctx=>{
    const wrap=document.getElementById(`${ctx}VendorWrap`);
    if(wrap && !wrap.contains(e.target)) vndClose(ctx);
  });
});
 
// ── MATERIAL RENDER ────────────────────────────────────────────
const debouncedMatFilter=debounce(()=>{matPage=1;renderMaterial();});
function filterMaterial(){matPage=1;renderMaterial();}
function sortMat(key){matSortAsc=matSortKey===key?!matSortAsc:true;matSortKey=key;renderMaterial();}
 
function renderMaterial(){
  const q=(document.getElementById('matSearch').value||'').toLowerCase();
  const kat=document.getElementById('matFilterKat').value;
  matFiltered=materials.filter(m=>{
    const match=[m.id,m.nama,m.kategori,m.subKategori,m.vendor].join('|').toLowerCase().includes(q);
    return match&&(!kat||m.kategori===kat);
  });
  if(matSortKey) matFiltered.sort((a,b)=>{
    const va=String(a[matSortKey]||'').toLowerCase(),vb=String(b[matSortKey]||'').toLowerCase();
    if(!isNaN(parseFloat(va))&&!isNaN(parseFloat(vb))) return matSortAsc?parseFloat(va)-parseFloat(vb):parseFloat(vb)-parseFloat(va);
    return matSortAsc?va.localeCompare(vb):vb.localeCompare(va);
  });
  document.getElementById('matCount').textContent=matFiltered.length+' item';
  renderMatPage(); renderMatPag();
}
 
function renderMatPage(){
  const slice=matFiltered.slice((matPage-1)*matPerPage,matPage*matPerPage);
  const canEdit=QSAuth.can('material'),canDel=QSAuth.can('delete');
  document.getElementById('matBody').innerHTML=!slice.length
    ?`<tr><td colspan="7"><div class="empty-state"><i class="fas fa-inbox"></i><p>Tidak ada data</p></div></td></tr>`
    :slice.map(m=>`<tr>
      <td class="mono">${m.id}</td>
      <td><span class="badge badge-orange">${m.kategori||'—'}</span></td>
      <td><span class="fw-bold" style="color:var(--text)">${m.nama}</span>${m.subKategori?`<br><small class="text-muted">${m.subKategori}</small>`:''}</td>
      <td class="text-dim">${m.vendor||'—'}</td>
      <td class="currency">${Fmt.rupiah(m.harga)}<br><small class="mono text-muted">/ ${m.satuan||'—'}</small></td>
      <td class="mono text-muted">${m.satuan||'—'}</td>
      <td><div class="act-btns">
        ${canEdit?`<button class="act-btn act-edit" onclick="editMaterial('${m.id}')" title="Edit"><i class="fas fa-pen"></i></button>`:''}
        ${canDel?`<button class="act-btn act-del" onclick="deleteMaterial('${m.id}','${m.nama.replace(/'/g,"\\'")}') " title="Hapus"><i class="fas fa-trash"></i></button>`:''}
      </div></td>
    </tr>`).join('');
}
 
function renderMatPag(){
  const pages=Math.ceil(matFiltered.length/matPerPage);
  if(pages<=1){document.getElementById('matPag').innerHTML='';return;}
  let h=`<button class="pg-btn" onclick="goMatPage(${matPage-1})" ${matPage===1?'disabled':''}><i class="fas fa-chevron-left"></i></button>`;
  for(let i=Math.max(1,matPage-2);i<=Math.min(pages,matPage+2);i++) h+=`<button class="pg-btn ${i===matPage?'active':''}" onclick="goMatPage(${i})">${i}</button>`;
  h+=`<button class="pg-btn" onclick="goMatPage(${matPage+1})" ${matPage===pages?'disabled':''}><i class="fas fa-chevron-right"></i></button>`;
  h+=`<span class="pg-info">${matPage}/${pages}</span>`;
  document.getElementById('matPag').innerHTML=h;
}
function goMatPage(p){matPage=p;renderMatPage();renderMatPag();}
 
async function saveMaterial(){
  const id=document.getElementById('matEditId').value;
  const data={id,kategori:document.getElementById('matKategori').value.trim(),subKategori:document.getElementById('matSub').value.trim(),nama:document.getElementById('matNama').value.trim(),spesifikasi:document.getElementById('matSpek').value.trim(),harga:parseFloat(document.getElementById('matHarga').value)||0,satuan:document.getElementById('matSatuan').value.trim(),vendor:document.getElementById('matVendor').value.trim()};
  if(!data.nama||!data.harga||!data.satuan){toast('Nama, harga, dan satuan wajib diisi!','error');return;}
  if(isDemo()){
    if(id){const i=materials.findIndex(m=>m.id===id);if(i!==-1)materials[i]={...materials[i],...data};}
    else{data.id='MAT-'+String(materials.length+1).padStart(4,'0');materials.unshift(data);}
    cancelEditMaterial();buildDataLists();renderMaterial();toast(id?'Material diperbarui!':'Material ditambahkan!');return;
  }
  const btn=document.getElementById('matSaveBtn');btn.disabled=true;
  try{const r=await QSApi.post({action:id?'updateMaterial':'addMaterial',data});if(r.success){toast(r.message);cancelEditMaterial();await loadAll();}else toast(r.message,'error');}
  catch(e){toast('Koneksi error!','error');}
  btn.disabled=false;
}
 
function editMaterial(id){
  const m=materials.find(x=>x.id===id);if(!m)return;
  document.getElementById('matEditId').value=m.id;
  document.getElementById('matKategori').value=m.kategori||'';
  document.getElementById('matSub').value=m.subKategori||'';
  document.getElementById('matNama').value=m.nama;
  document.getElementById('matSpek').value=m.spesifikasi||'';
  document.getElementById('matHarga').value=m.harga;
  document.getElementById('matSatuan').value=m.satuan||'';
  vndSetValue('mat', m.vendor||'');
  document.getElementById('matFormTitle').textContent='Edit Material';
  document.getElementById('matSaveLbl').textContent='UPDATE MATERIAL';
  document.getElementById('matCancelBtn').style.display='block';
  openTab('material');
  document.getElementById('matFormCard').scrollIntoView({behavior:'smooth'});
}
 
function cancelEditMaterial(){
  ['matEditId','matKategori','matSub','matNama','matSpek','matHarga','matSatuan'].forEach(id=>document.getElementById(id).value='');
  vndClear('mat');
  // Reset conversion section
  document.getElementById('convToggle').checked=false;
  document.getElementById('convSection').style.display='none';
  document.getElementById('convResult').style.display='none';
  ['convUnitVendor','convHargaVendor','convFaktor','convWaste','convPurchase'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('convRuleBadge').innerHTML='';
  document.getElementById('matFormTitle').textContent='Input Material';
  document.getElementById('matSaveLbl').textContent='SIMPAN MATERIAL';
  document.getElementById('matCancelBtn').style.display='none';
}
 
function deleteMaterial(id,nama){
  showConfirm('Hapus Material',`Hapus "${nama}"? Data tidak dapat dikembalikan.`,async()=>{
    if(isDemo()){materials=materials.filter(m=>m.id!==id);renderMaterial();toast('Material dihapus','info');return;}
    try{const r=await QSApi.post({action:'deleteMaterial',id});if(r.success){toast(r.message);await loadAll();}else toast(r.message,'error');}
    catch(e){toast('Error','error');}
  });
}
 
// ── UPAH ─────────────────────────────────────────────────────
const debouncedUpahFilter=debounce(renderUpah);
function renderUpah(){
  const q=(document.getElementById('upahSearch').value||'').toLowerCase();
  const fl=upahList.filter(u=>!q||u.nama.toLowerCase().includes(q));
  document.getElementById('upahCount').textContent=fl.length+' item';
  const canEdit=QSAuth.can('upah'),canDel=QSAuth.can('delete');
  document.getElementById('upahBody').innerHTML=!fl.length?`<tr><td colspan="5"><div class="empty-state"><i class="fas fa-inbox"></i><p>Tidak ada data</p></div></td></tr>`:fl.map(u=>`<tr><td class="mono">${u.id}</td><td class="fw-bold" style="color:var(--text)">${u.nama}</td><td class="mono">${u.satuan||'—'}</td><td class="currency">${Fmt.rupiah(u.harga)}</td><td><div class="act-btns">${canEdit?`<button class="act-btn act-edit" onclick="editUpah('${u.id}')"><i class="fas fa-pen"></i></button>`:''}${canDel?`<button class="act-btn act-del" onclick="deleteUpah('${u.id}','${u.nama}')"><i class="fas fa-trash"></i></button>`:''}</div></td></tr>`).join('');
}
 
async function saveUpah(){
  const id=document.getElementById('upahEditId').value;
  const data={id,nama:document.getElementById('upahNama').value.trim(),satuan:document.getElementById('upahSatuan').value.trim(),harga:parseFloat(document.getElementById('upahHarga').value)||0};
  if(!data.nama||!data.harga){toast('Nama dan harga wajib diisi!','error');return;}
  if(isDemo()){if(id){const i=upahList.findIndex(u=>u.id===id);if(i!==-1)upahList[i]={...upahList[i],...data};}else{data.id='UPH-'+String(upahList.length+1).padStart(4,'0');upahList.unshift(data);}cancelEditUpah();renderUpah();toast(id?'Upah diperbarui!':'Upah ditambahkan!');return;}
  try{const r=await QSApi.post({action:id?'updateUpah':'addUpah',data});if(r.success){toast(r.message);cancelEditUpah();await loadAll();}else toast(r.message,'error');}catch(e){toast('Error','error');}
}
function editUpah(id){const u=upahList.find(x=>x.id===id);if(!u)return;document.getElementById('upahEditId').value=u.id;document.getElementById('upahNama').value=u.nama;document.getElementById('upahSatuan').value=u.satuan||'';document.getElementById('upahHarga').value=u.harga;document.getElementById('upahCancelBtn').style.display='block';openTab('upah');}
function cancelEditUpah(){['upahEditId','upahNama','upahSatuan','upahHarga'].forEach(id=>document.getElementById(id).value='');document.getElementById('upahCancelBtn').style.display='none';}
function deleteUpah(id,nama){showConfirm('Hapus Upah',`Hapus "${nama}"?`,async()=>{if(isDemo()){upahList=upahList.filter(u=>u.id!==id);renderUpah();toast('Dihapus','info');return;}try{const r=await QSApi.post({action:'deleteUpah',id});if(r.success){toast(r.message);await loadAll();}else toast(r.message,'error');}catch(e){toast('Error','error');}});}
 
// ── ALAT ──────────────────────────────────────────────────────
const debouncedAlatFilter=debounce(renderAlat);
function renderAlat(){
  const q=(document.getElementById('alatSearch').value||'').toLowerCase();
  const fl=alatList.filter(a=>!q||a.nama.toLowerCase().includes(q)||(a.vendor||'').toLowerCase().includes(q));
  document.getElementById('alatCount').textContent=fl.length+' item';
  const canEdit=QSAuth.can('alat'),canDel=QSAuth.can('delete');
  document.getElementById('alatBody').innerHTML=!fl.length?`<tr><td colspan="6"><div class="empty-state"><i class="fas fa-inbox"></i><p>Tidak ada data</p></div></td></tr>`:fl.map(a=>`<tr><td class="mono">${a.id}</td><td class="fw-bold" style="color:var(--text)">${a.nama}</td><td class="mono">${a.satuan||'—'}</td><td class="currency">${Fmt.rupiah(a.harga)}</td><td class="text-dim">${a.vendor||'—'}</td><td><div class="act-btns">${canEdit?`<button class="act-btn act-edit" onclick="editAlat('${a.id}')"><i class="fas fa-pen"></i></button>`:''}${canDel?`<button class="act-btn act-del" onclick="deleteAlat('${a.id}','${a.nama}')"><i class="fas fa-trash"></i></button>`:''}</div></td></tr>`).join('');
}
 
async function saveAlat(){
  const id=document.getElementById('alatEditId').value;
  const data={id,nama:document.getElementById('alatNama').value.trim(),satuan:document.getElementById('alatSatuan').value.trim(),harga:parseFloat(document.getElementById('alatHarga').value)||0,vendor:document.getElementById('alatVendor').value.trim()};
  if(!data.nama||!data.harga){toast('Nama dan harga wajib diisi!','error');return;}
  if(isDemo()){if(id){const i=alatList.findIndex(a=>a.id===id);if(i!==-1)alatList[i]={...alatList[i],...data};}else{data.id='ALT-'+String(alatList.length+1).padStart(4,'0');alatList.unshift(data);}cancelEditAlat();renderAlat();toast(id?'Alat diperbarui!':'Alat ditambahkan!');return;}
  try{const r=await QSApi.post({action:id?'updateAlat':'addAlat',data});if(r.success){toast(r.message);cancelEditAlat();await loadAll();}else toast(r.message,'error');}catch(e){toast('Error','error');}
}
function editAlat(id){
  const a=alatList.find(x=>x.id===id);if(!a)return;
  document.getElementById('alatEditId').value=a.id;
  document.getElementById('alatNama').value=a.nama;
  document.getElementById('alatSatuan').value=a.satuan||'';
  document.getElementById('alatHarga').value=a.harga;
  vndSetValue('alat', a.vendor||'');
  document.getElementById('alatCancelBtn').style.display='block';
  openTab('alat');
}
function cancelEditAlat(){
  ['alatEditId','alatNama','alatSatuan','alatHarga'].forEach(id=>document.getElementById(id).value='');
  vndClear('alat');
  document.getElementById('alatCancelBtn').style.display='none';
}
function deleteAlat(id,nama){showConfirm('Hapus Alat',`Hapus "${nama}"?`,async()=>{if(isDemo()){alatList=alatList.filter(a=>a.id!==id);renderAlat();toast('Dihapus','info');return;}try{const r=await QSApi.post({action:'deleteAlat',id});if(r.success){toast(r.message);await loadAll();}else toast(r.message,'error');}catch(e){toast('Error','error');}});}
 
// ── ANALISA HARGA ─────────────────────────────────────────────
const debouncedAnalisaFilter=debounce(filterAnalisa);
function filterAnalisa(){
  const q=(document.getElementById('analisaSearch').value||'').toLowerCase();
  const kat=document.getElementById('analisaKatFilter').value;
  const filtered=analisaData.filter(g=>(!q||g.nama.toLowerCase().includes(q))&&(!kat||g.kategori===kat));
  document.getElementById('analisaCount').textContent=filtered.length+' material';
  renderAnalisa(filtered);
}
 
function renderAnalisa(data){
  const el=document.getElementById('analisaBody');
  if(!data.length){el.innerHTML='<div class="empty-state"><i class="fas fa-chart-column"></i><p>Tidak ada data analisa harga</p></div>';document.getElementById('analisaSummary').style.display='none';return;}
  // global summary
  const allMin=data.map(g=>g.minHarga),allMax=data.map(g=>g.maxHarga);
  document.getElementById('analisaSummary').style.display='grid';
  document.getElementById('ssMin').textContent=Fmt.rupiah(Math.min(...allMin));
  document.getElementById('ssMax').textContent=Fmt.rupiah(Math.max(...allMax));
  document.getElementById('ssAvg').textContent=Fmt.rupiah(Math.round(data.reduce((s,g)=>s+g.avgHarga,0)/data.length));
 
  el.innerHTML=data.map(g=>`
    <div class="price-group">
      <div class="price-group-head">
        <div>
          <div class="pg-name">${g.nama}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px"><span class="badge badge-orange">${g.kategori||'—'}</span> &nbsp; ${g.satuan||'—'}</div>
        </div>
        <div class="pg-stats">
          <span>Min: <span>${Fmt.rupiah(g.minHarga)}</span></span>
          <span>Avg: <span>${Fmt.rupiah(g.avgHarga)}</span></span>
          <span>Max: <span>${Fmt.rupiah(g.maxHarga)}</span></span>
        </div>
      </div>
      <table class="tbl">
        <thead><tr><th>Rank</th><th>Vendor</th><th>Harga</th><th>Selisih</th><th>%</th><th></th></tr></thead>
        <tbody>${g.vendors.map(v=>`
          <tr class="${v.isBest?'best-vendor-row':''}">
            <td class="mono">#${v.rank}</td>
            <td>${v.isBest?'<i class="fas fa-crown best-ico"></i> ':''}<span ${v.isBest?'class="fw-bold" style="color:var(--text)"':''}>${v.vendor}</span></td>
            <td class="currency">${Fmt.rupiah(v.harga)}</td>
            <td class="mono ${v.selisihNominal===0?'text-muted':'text-dim'}">${v.selisihNominal===0?'—':'+'+Fmt.rupiah(v.selisihNominal)}</td>
            <td><span class="selisih-pct ${v.selisihPersen===0?'selisih-0':'selisih-pos'}">+${v.selisihPersen}%</span></td>
            <td>${v.isBest?'<span class="badge badge-green">BEST PRICE</span>':v.isWorst&&g.vendors.length>2?'<span class="badge badge-red">TERTINGGI</span>':''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');
}
 
// ── PDF EXPORT ─────────────────────────────────────────────────
async function printAnalisaPDF(){
  document.getElementById('printDate').textContent=new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  const kat=document.getElementById('analisaKatFilter').value;
  const q=(document.getElementById('analisaSearch').value||'').toLowerCase();
  const filtered=analisaData.filter(g=>(!q||g.nama.toLowerCase().includes(q))&&(!kat||g.kategori===kat));
  if(!filtered.length){toast('Tidak ada data untuk diekspor','error');return;}
  toast('Membuat PDF…','info');
  try{
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    const pgW=doc.internal.pageSize.getWidth();
    let y=15;
    // Header
    doc.setFontSize(16);doc.setFont('helvetica','bold');doc.setTextColor(40,40,40);
    doc.text('LAPORAN ANALISA HARGA MATERIAL',pgW/2,y,{align:'center'});y+=8;
    doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(100,100,100);
    doc.text('Dicetak: '+new Date().toLocaleDateString('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}),pgW/2,y,{align:'center'});y+=10;
    // Table header colors
    const cols=[20,80,40,40,40,40];
    const totalW=cols.reduce((s,c)=>s+c,0);
    const startX=(pgW-totalW)/2;
    filtered.forEach(g=>{
      if(y>175){doc.addPage();y=15;}
      // Group header
      doc.setFillColor(30,30,50);doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');
      doc.roundedRect(startX,y,totalW,7,.5,.5,'F');
      doc.text(g.nama,startX+3,y+4.5);
      doc.text('Min: Rp '+g.minHarga.toLocaleString('id-ID')+'  |  Avg: Rp '+g.avgHarga.toLocaleString('id-ID'),startX+totalW-3,y+4.5,{align:'right'});y+=9;
      // Col headers
      const hLabels=['Rank','Vendor','Harga','Selisih Rp','Selisih %','Keterangan'];
      doc.setFillColor(60,70,90);doc.rect(startX,y,totalW,6,'F');
      doc.setTextColor(200,210,220);doc.setFontSize(7.5);doc.setFont('helvetica','bold');
      let cx=startX;
      hLabels.forEach((lbl,i)=>{doc.text(lbl,cx+2,y+4);cx+=cols[i];});y+=7;
      // Rows
      doc.setFont('helvetica','normal');
      g.vendors.forEach(v=>{
        if(y>185){doc.addPage();y=15;}
        const rowH=6.5;
        if(v.isBest){doc.setFillColor(232,245,233);doc.rect(startX,y,totalW,rowH,'F');}
        else if(y%2===0){doc.setFillColor(245,247,250);doc.rect(startX,y,totalW,rowH,'F');}
        doc.setTextColor(50,60,70);doc.setFontSize(8);
        cx=startX;
        const cells=['#'+v.rank,v.vendor,'Rp '+v.harga.toLocaleString('id-ID'),v.selisihNominal?'+Rp '+v.selisihNominal.toLocaleString('id-ID'):'—','+'+v.selisihPersen+'%',v.isBest?'✓ BEST PRICE':v.isWorst?'TERTINGGI':''];
        cells.forEach((cell,i)=>{
          if(v.isBest&&i===5)doc.setTextColor(27,94,32);
          doc.text(String(cell),cx+2,y+rowH-1.5);doc.setTextColor(50,60,70);cx+=cols[i];
        });
        y+=rowH;
      });
      y+=5;
    });
    // Footer
    const pgs=doc.internal.getNumberOfPages();
    for(let i=1;i<=pgs;i++){
      doc.setPage(i);doc.setFontSize(7);doc.setTextColor(150,150,150);
      doc.text('QS Manager Construction System | Halaman '+i+' dari '+pgs,pgW/2,doc.internal.pageSize.getHeight()-5,{align:'center'});
    }
    doc.save('Analisa_Harga_Material_'+new Date().toISOString().slice(0,10)+'.pdf');
    toast('PDF berhasil diexport!');
  } catch(e){ console.error(e); toast('Gagal membuat PDF: '+e.message,'error'); }
}
 
// ── CSV EXPORTS ────────────────────────────────────────────────
function exportMatCSV(){exportCSV(['ID','Kategori','Sub Kategori','Nama Material','Spesifikasi','Satuan','Harga','Vendor'],materials.map(m=>[m.id,m.kategori,m.subKategori,m.nama,m.spesifikasi,m.satuan,m.harga,m.vendor]),'database_material.csv');toast('CSV material diekspor!');}
function exportUpahCSV(){exportCSV(['ID','Nama Upah','Satuan','Harga'],upahList.map(u=>[u.id,u.nama,u.satuan,u.harga]),'database_upah.csv');toast('CSV upah diekspor!');}
function exportAlatCSV(){exportCSV(['ID','Nama Alat','Satuan','Harga Sewa','Vendor'],alatList.map(a=>[a.id,a.nama,a.satuan,a.harga,a.vendor]),'database_alat.csv');toast('CSV alat diekspor!');}
 
// ── INIT ──────────────────────────────────────────────────────
const _user=QSAuth.requireAuth();
if(_user){
  initSidebar('material');
  const role=_user.role;
  buildTabs(role);
  // Hide form for read-only roles
  if(role==='purchasing'){
    document.getElementById('matFormCard').style.display='none';
    document.querySelector('.panel-grid')?.style.setProperty('grid-template-columns','1fr');
  }
  function initHashRouting(){
    function apply(){const h=location.hash.replace('#','');switchTab(VALID_TABS.includes(h)?h:'material',false);}
    apply();window.addEventListener('hashchange',apply);
  }
  initHashRouting();
  loadAll().then(()=>{ if(currentTab==='analisa') loadAnalisa(); });
  // Load analisa when tab is switched to it
  const origOpen=openTab;
  window.openTab=function(tab){origOpen(tab);if(tab==='analisa'&&!analisaData.length) loadAnalisa();};
}
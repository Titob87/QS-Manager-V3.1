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
let vendors=[], vendorFiltered=[], vPage=1, vPerPage=20, vSortKey='', vSortAsc=true;
const isDemo=()=>API_URL==='YOUR_GAS_WEBAPP_URL';
 
// ── DEMO DATA ─────────────────────────────────────────────────
function demoVendors(){return[
  {id:'VND-0001',namaVendor:'PT Holcim Indonesia',pic:'Budi Santoso',noTelp:'021-5551234',email:'sales@holcim.co.id',alamat:'Jl. Gatot Subroto No.38',kota:'Jakarta',kategori:'Semen & Beton',status:'Aktif'},
  {id:'VND-0002',namaVendor:'PT Krakatau Steel',pic:'Dewi Rahayu',noTelp:'0254-302000',email:'marketing@krakatausteel.com',alamat:'Jl. Industri No.1',kota:'Cilegon',kategori:'Besi & Baja',status:'Aktif'},
  {id:'VND-0003',namaVendor:'PT Roman Tiles',pic:'Ahmad Fauzi',noTelp:'021-4607788',email:'info@romantiles.co.id',alamat:'Jl. Raya Bekasi KM 28',kota:'Bekasi',kategori:'Keramik & Granit',status:'Aktif'},
  {id:'VND-0004',namaVendor:'CV Mitra Cat',pic:'Sari Wulandari',noTelp:'022-7203456',email:'cvmitracat@gmail.com',alamat:'Jl. Soekarno Hatta No.45',kota:'Bandung',kategori:'Finishing',status:'Aktif'},
  {id:'VND-0005',namaVendor:'PT Wavin Indonesia',pic:'Rudi Hermawan',noTelp:'021-8904567',email:'info@wavin.co.id',alamat:'Jl. Raya Industri Blok A5',kota:'Tangerang',kategori:'Plumbing',status:'Aktif'},
  {id:'VND-0006',namaVendor:'CV Pasir Jaya',pic:'Hendra Wijaya',noTelp:'0271-654321',email:'pasirjaya@gmail.com',alamat:'Jl. Solo-Yogya KM 12',kota:'Solo',kategori:'Material Bangunan',status:'Aktif'},
  {id:'VND-0007',namaVendor:'PT Ispatindo',pic:'Yuliana Sari',noTelp:'031-8940000',email:'marketing@ispatindo.co.id',alamat:'Jl. Rungkut Industri No.1',kota:'Surabaya',kategori:'Besi & Baja',status:'Aktif'},
  {id:'VND-0008',namaVendor:'UD Kayu Mas',pic:'Joko Susilo',noTelp:'024-3567890',email:'udkayumas@yahoo.com',alamat:'Jl. Raya Kayu No.77',kota:'Semarang',kategori:'Kayu & Plywood',status:'Nonaktif'},
];}
 
// ── LOAD ──────────────────────────────────────────────────────
async function loadVendors(){
  if(isDemo()){ vendors=demoVendors(); }
  else {
    try{const r=await QSApi.get('getVendors',{limit:1000});if(r.success)vendors=r.data||[];}
    catch(e){ vendors=demoVendors(); }
  }
  updateStats(); filterVendors();
}
 
function updateStats(){
  const aktif=vendors.filter(v=>v.status==='Aktif').length;
  document.getElementById('vsTotal').textContent=vendors.length;
  document.getElementById('vsAktif').textContent=aktif;
  document.getElementById('vsNonaktif').textContent=vendors.length-aktif;
}
 
// ── FILTER / SORT ─────────────────────────────────────────────
const debouncedFilter=debounce(()=>{vPage=1;filterVendors();});
function sortVendor(key){vSortAsc=vSortKey===key?!vSortAsc:true;vSortKey=key;filterVendors();}
function filterVendors(){
  const q=(document.getElementById('vendorSearch').value||'').toLowerCase();
  const kat=document.getElementById('vendorKatFilter').value;
  const status=document.getElementById('vendorStatusFilter').value;
  vendorFiltered=vendors.filter(v=>{
    const match=[v.id,v.namaVendor,v.pic,v.kota,v.email,v.noTelp].join('|').toLowerCase().includes(q);
    return match&&(!kat||v.kategori===kat)&&(!status||v.status===status);
  });
  if(vSortKey) vendorFiltered.sort((a,b)=>{
    const va=String(a[vSortKey]||'').toLowerCase(),vb=String(b[vSortKey]||'').toLowerCase();
    return vSortAsc?va.localeCompare(vb):vb.localeCompare(va);
  });
  document.getElementById('vendorCount').textContent=vendorFiltered.length+' vendor';
  renderVendorPage(); renderVendorPag();
}
 
// ── RENDER ─────────────────────────────────────────────────────
function renderVendorPage(){
  const slice=vendorFiltered.slice((vPage-1)*vPerPage,vPage*vPerPage);
  const canEdit=QSAuth.can('vendor'),canDel=QSAuth.can('delete');
  document.getElementById('vendorBody').innerHTML=!slice.length
    ?`<tr><td colspan="8"><div class="empty-state"><i class="fas fa-store-slash"></i><p>Tidak ada data vendor</p></div></td></tr>`
    :slice.map(v=>`<tr>
      <td class="mono">${v.id}</td>
      <td><span class="fw-bold" style="color:var(--text)">${v.namaVendor}</span></td>
      <td class="text-dim">${v.pic||'—'}</td>
      <td class="mono" style="font-size:11px">${v.noTelp||'—'}</td>
      <td class="text-dim">${v.kota||'—'}</td>
      <td><span class="badge badge-cyan">${v.kategori||'—'}</span></td>
      <td><span class="badge ${v.status==='Aktif'?'badge-green':'badge-gray'}">${v.status||'—'}</span></td>
      <td><div class="act-btns">
        <button class="act-btn act-view" onclick="viewVendor('${v.id}')" title="Detail"><i class="fas fa-eye"></i></button>
        ${canEdit?`<button class="act-btn act-edit" onclick="editVendor('${v.id}')" title="Edit"><i class="fas fa-pen"></i></button>`:''}
        ${canDel?`<button class="act-btn act-del" onclick="deleteVendor('${v.id}','${v.namaVendor.replace(/'/g,"\\'")}')"><i class="fas fa-trash"></i></button>`:''}
      </div></td>
    </tr>`).join('');
}
 
function renderVendorPag(){
  const pages=Math.ceil(vendorFiltered.length/vPerPage);
  if(pages<=1){document.getElementById('vendorPag').innerHTML='';return;}
  let h=`<button class="pg-btn" onclick="goVPage(${vPage-1})" ${vPage===1?'disabled':''}><i class="fas fa-chevron-left"></i></button>`;
  for(let i=Math.max(1,vPage-2);i<=Math.min(pages,vPage+2);i++) h+=`<button class="pg-btn ${i===vPage?'active':''}" onclick="goVPage(${i})">${i}</button>`;
  h+=`<button class="pg-btn" onclick="goVPage(${vPage+1})" ${vPage===pages?'disabled':''}><i class="fas fa-chevron-right"></i></button>`;
  h+=`<span class="pg-info">${vPage}/${pages}</span>`;
  document.getElementById('vendorPag').innerHTML=h;
}
function goVPage(p){vPage=p;renderVendorPage();renderVendorPag();}
 
// ── DETAIL VIEW ────────────────────────────────────────────────
function viewVendor(id){
  const v=vendors.find(x=>x.id===id);if(!v)return;
  const det=document.getElementById('vendorDetail');
  det.style.display='block';
  document.getElementById('vendorDetailContent').innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div>
        <div style="font-family:var(--fdisp);font-size:18px;font-weight:700">${v.namaVendor}</div>
        <div style="display:flex;gap:8px;margin-top:4px">
          <span class="badge badge-cyan">${v.kategori||'—'}</span>
          <span class="badge ${v.status==='Aktif'?'badge-green':'badge-gray'}">${v.status}</span>
        </div>
      </div>
      <span class="mono text-muted">${v.id}</span>
    </div>
    <div class="detail-card">
      ${[
        ['PIC / Contact',v.pic||'—'],
        ['No. Telepon',v.noTelp||'—'],
        ['Email',v.email?`<a href="mailto:${v.email}" style="color:var(--cyan)">${v.email}</a>`:'—'],
        ['Alamat',v.alamat||'—'],
        ['Kota',v.kota||'—'],
        ['Kategori',v.kategori||'—'],
        ['Status',v.status||'—'],
        ['Timestamp',v.timestamp||'—'],
      ].map(([l,val])=>`<div class="detail-row"><span class="detail-label">${l}</span><span class="detail-value">${val}</span></div>`).join('')}
    </div>
    ${QSAuth.can('vendor')?`<button class="btn btn-cyan btn-sm" onclick="editVendor('${v.id}')" style="margin-top:10px"><i class="fas fa-pen"></i> Edit</button>`:''}`;
  det.scrollIntoView({behavior:'smooth'});
}
 
// ── CRUD ──────────────────────────────────────────────────────
async function saveVendor(){
  const id=document.getElementById('vendorEditId').value;
  const data={
    id,
    namaVendor:document.getElementById('vNama').value.trim(),
    pic:document.getElementById('vPIC').value.trim(),
    noTelp:document.getElementById('vTelp').value.trim(),
    email:document.getElementById('vEmail').value.trim(),
    alamat:document.getElementById('vAlamat').value.trim(),
    kota:document.getElementById('vKota').value.trim(),
    kategori:document.getElementById('vKategori').value,
    status:document.getElementById('vStatus').value
  };
  if(!data.namaVendor){toast('Nama vendor wajib diisi!','error');return;}
  if(isDemo()){
    if(id){const i=vendors.findIndex(v=>v.id===id);if(i!==-1)vendors[i]={...vendors[i],...data};}
    else{data.id='VND-'+String(vendors.length+1).padStart(4,'0');vendors.unshift(data);}
    cancelEditVendor();updateStats();filterVendors();toast(id?'Vendor diperbarui!':'Vendor ditambahkan!');return;
  }
  const btn=document.getElementById('vendorSaveBtn');btn.disabled=true;
  try{
    const r=await QSApi.post({action:id?'updateVendor':'addVendor',data});
    if(r.success){toast(r.message);cancelEditVendor();await loadVendors();}
    else toast(r.message,'error');
  }catch(e){toast('Koneksi error!','error');}
  btn.disabled=false;
}
 
function editVendor(id){
  const v=vendors.find(x=>x.id===id);if(!v)return;
  document.getElementById('vendorEditId').value=v.id;
  document.getElementById('vNama').value=v.namaVendor||'';
  document.getElementById('vPIC').value=v.pic||'';
  document.getElementById('vTelp').value=v.noTelp||'';
  document.getElementById('vEmail').value=v.email||'';
  document.getElementById('vAlamat').value=v.alamat||'';
  document.getElementById('vKota').value=v.kota||'';
  document.getElementById('vKategori').value=v.kategori||'';
  document.getElementById('vStatus').value=v.status||'Aktif';
  document.getElementById('vendorFormTitle').textContent='Edit Vendor';
  document.getElementById('vendorSaveLbl').textContent='UPDATE VENDOR';
  document.getElementById('vendorCancelBtn').style.display='block';
  document.getElementById('vendorFormCard').scrollIntoView({behavior:'smooth'});
}
 
function cancelEditVendor(){
  ['vendorEditId','vNama','vPIC','vTelp','vEmail','vAlamat','vKota'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('vKategori').value='';document.getElementById('vStatus').value='Aktif';
  document.getElementById('vendorFormTitle').textContent='Input Vendor';
  document.getElementById('vendorSaveLbl').textContent='SIMPAN VENDOR';
  document.getElementById('vendorCancelBtn').style.display='none';
  document.getElementById('vendorDetail').style.display='none';
}
 
function deleteVendor(id,nama){
  showConfirm('Hapus Vendor',`Hapus vendor "${nama}"? Tindakan ini tidak dapat dibatalkan.`,async()=>{
    if(isDemo()){vendors=vendors.filter(v=>v.id!==id);updateStats();filterVendors();document.getElementById('vendorDetail').style.display='none';toast('Vendor dihapus','info');return;}
    try{const r=await QSApi.post({action:'deleteVendor',id});if(r.success){toast(r.message);await loadVendors();}else toast(r.message,'error');}
    catch(e){toast('Error','error');}
  });
}
 
function exportVendorCSV(){
  exportCSV(['ID','Nama Vendor','PIC','No Telp','Email','Alamat','Kota','Kategori','Status'],
    vendors.map(v=>[v.id,v.namaVendor,v.pic,v.noTelp,v.email,v.alamat,v.kota,v.kategori,v.status]),
    'database_vendor.csv');
  toast('CSV vendor diekspor!');
}
 
// ── INIT ──────────────────────────────────────────────────────
const _user=QSAuth.requirePerm('vendor');
if(_user){
  initSidebar('vendor');
  const canEdit=QSAuth.can('vendor'),canDel=QSAuth.can('delete');
  if(!canEdit){document.getElementById('vendorFormCard').style.display='none';document.querySelector('.panel-grid').style.gridTemplateColumns='1fr';}
  loadVendors();
}
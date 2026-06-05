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
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = filename; a.click();
}
 
// ── SKELETON LOADING ────────────────────────────────────────────
function skeletonRows(cols, count = 5) {
  const cell = `<td><div style="height:12px;background:var(--card3);border-radius:4px;animation:pulse 1.5s ease infinite"></div></td>`;
  return Array(count).fill(`<tr>${cell.repeat(cols)}</tr>`).join('');
}
 
// ── STATE ────────────────────────────────────────────────────
let convRules=[], convFiltered=[], convPage=1, convPerPage=20;
let importRows=[];
const isDemo=()=>API_URL==='YOUR_GAS_WEBAPP_URL';
 
// ── DEMO DATA ────────────────────────────────────────────────
function demoConversions(){return[
  {id:'CONV-0001',namaMaterial:'Kabel NYM',kategori:'Elektrikal',unitVendor:'Roll',faktor:100,unitDasar:'m',wastePct:5,purchasePct:2,aktif:true,catatan:'1 Roll = 100 m'},
  {id:'CONV-0002',namaMaterial:'Wiremesh M6',kategori:'Besi & Baja',unitVendor:'Lembar',faktor:5.4,unitDasar:'m²',wastePct:5,purchasePct:2,aktif:true,catatan:'1 Lembar 2.1×5.4 = 5.4 m²'},
  {id:'CONV-0003',namaMaterial:'Cat',kategori:'Finishing',unitVendor:'Pail',faktor:20,unitDasar:'liter',wastePct:3,purchasePct:0,aktif:true,catatan:'1 Pail = 20 liter'},
  {id:'CONV-0004',namaMaterial:'Pipa PVC',kategori:'Plumbing',unitVendor:'Batang',faktor:4,unitDasar:'m',wastePct:5,purchasePct:0,aktif:true,catatan:'1 Batang = 4 m'},
  {id:'CONV-0005',namaMaterial:'Keramik',kategori:'Keramik',unitVendor:'Dus',faktor:1.44,unitDasar:'m²',wastePct:5,purchasePct:0,aktif:true,catatan:'1 Dus 60x60 = 1.44 m²'},
  {id:'CONV-0006',namaMaterial:'Granit',kategori:'Keramik',unitVendor:'Dus',faktor:1.08,unitDasar:'m²',wastePct:5,purchasePct:0,aktif:true,catatan:'1 Dus 60x60 = 1.08 m²'},
  {id:'CONV-0007',namaMaterial:'Besi Beton',kategori:'Besi & Baja',unitVendor:'Ton',faktor:1000,unitDasar:'kg',wastePct:2,purchasePct:0,aktif:true,catatan:'1 Ton = 1000 kg'},
  {id:'CONV-0008',namaMaterial:'Semen Portland',kategori:'Beton',unitVendor:'Ton',faktor:20,unitDasar:'sak',wastePct:1,purchasePct:0,aktif:true,catatan:'1 Ton = 20 sak @ 50kg'},
];}
 
// ── MAIN TABS ─────────────────────────────────────────────────
const MAIN_TABS=['rules','calc','import','ref'];
function switchMainTab(tab){
  MAIN_TABS.forEach(t=>{
    document.getElementById(`mtab-${t}`).className='tab'+(t===tab?' active':'');
    document.getElementById(`panel-${t}`).className='panel'+(t===tab?' active':'');
  });
  history.replaceState(null,'',location.pathname+(tab==='rules'?'':'#'+tab));
}
 
// ── LOAD ─────────────────────────────────────────────────────
async function loadConversions(){
  if(isDemo()) convRules=demoConversions();
  else {
    try{const r=await QSApi.get('getConversions');if(r.success)convRules=r.data||[];}
    catch(e){convRules=demoConversions();}
  }
  filterConv();
}
 
// ── FILTER / RENDER ───────────────────────────────────────────
const debouncedFilter=debounce(()=>{convPage=1;filterConv();});
function filterConv(){
  const q=(document.getElementById('convSearch').value||'').toLowerCase();
  const kat=document.getElementById('convKatFilter').value;
  const aktif=document.getElementById('convAktifFilter').value;
  convFiltered=convRules.filter(c=>{
    const match=[c.id,c.namaMaterial,c.unitVendor,c.unitDasar,c.kategori].join('|').toLowerCase().includes(q);
    const katOk=!kat||c.kategori===kat;
    const aktifOk=!aktif||(aktif==='true'?c.aktif:!c.aktif);
    return match&&katOk&&aktifOk;
  });
  document.getElementById('convCount').textContent=convFiltered.length+' aturan';
  renderConvPage(); renderConvPag();
}
 
function renderConvPage(){
  const slice=convFiltered.slice((convPage-1)*convPerPage,convPage*convPerPage);
  const canEdit=QSAuth.can('conversion'),canDel=QSAuth.can('delete');
  document.getElementById('convBody').innerHTML=!slice.length
    ?`<tr><td colspan="8"><div class="empty-state"><i class="fas fa-inbox"></i><p>Tidak ada aturan konversi</p></div></td></tr>`
    :slice.map(c=>`<tr>
      <td class="mono" style="font-size:10px">${c.id}</td>
      <td>
        <span class="fw-bold" style="color:var(--text)">${c.namaMaterial}</span>
        ${c.kategori?`<br><span class="badge badge-cyan" style="margin-top:3px">${c.kategori}</span>`:''}
        ${c.catatan?`<br><small class="text-muted" style="font-size:10px">${c.catatan}</small>`:''}
      </td>
      <td>
        <span class="unit-badge">${c.unitVendor}</span>
        <span class="conv-arrow">→</span>
        <span class="unit-badge" style="background:rgba(34,211,238,.1);border-color:rgba(34,211,238,.2);color:var(--cyan)">${c.unitDasar}</span>
      </td>
      <td class="mono">× ${Fmt.dec(c.faktor,4)}</td>
      <td class="mono">${c.wastePct?c.wastePct+'%':'—'}</td>
      <td class="mono">${c.purchasePct?c.purchasePct+'%':'—'}</td>
      <td><span class="badge ${c.aktif?'badge-green':'badge-gray'}">${c.aktif?'Aktif':'Nonaktif'}</span></td>
      <td><div class="act-btns">
        ${canEdit?`<button class="act-btn act-edit" onclick="editConv('${c.id}')" title="Edit"><i class="fas fa-pen"></i></button>`:''}
        ${canDel?`<button class="act-btn act-del" onclick="deleteConv('${c.id}','${c.namaMaterial.replace(/'/g,"\\'")}')"><i class="fas fa-trash"></i></button>`:''}
      </div></td>
    </tr>`).join('');
}
 
function renderConvPag(){
  const pages=Math.ceil(convFiltered.length/convPerPage);
  if(pages<=1){document.getElementById('convPag').innerHTML='';return;}
  let h=`<button class="pg-btn" onclick="goPage(${convPage-1})" ${convPage===1?'disabled':''}><i class="fas fa-chevron-left"></i></button>`;
  for(let i=Math.max(1,convPage-2);i<=Math.min(pages,convPage+2);i++) h+=`<button class="pg-btn ${i===convPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
  h+=`<button class="pg-btn" onclick="goPage(${convPage+1})" ${convPage===pages?'disabled':''}><i class="fas fa-chevron-right"></i></button>`;
  h+=`<span class="pg-info">${convPage}/${pages}</span>`;
  document.getElementById('convPag').innerHTML=h;
}
function goPage(p){convPage=p;renderConvPage();renderConvPag();}
 
// ── FORM HELPERS ──────────────────────────────────────────────
function toggleWaste(){document.getElementById('wasteFields').style.display=document.getElementById('cWasteEnable').checked?'block':'none';updateConvPreview();}
function togglePurchase(){document.getElementById('purchaseFields').style.display=document.getElementById('cPurchaseEnable').checked?'block':'none';updateConvPreview();}
 
function updateConvPreview(){
  const faktor=parseFloat(document.getElementById('cFaktor').value)||0;
  const uv=document.getElementById('cUnitVendor').value;
  const ud=document.getElementById('cUnitDasar').value;
  const prev=document.getElementById('factorPreview');
  const prevTxt=document.getElementById('factorPreviewText');
  if(faktor>0&&uv&&ud){
    prev.style.display='flex';
    prevTxt.textContent=`1 ${uv} = ${Fmt.dec(faktor,4)} ${ud}`;
  } else prev.style.display='none';
}
 
// ── CRUD ──────────────────────────────────────────────────────
async function saveConversion(){
  const id=document.getElementById('convEditId').value;
  const data={
    id,
    namaMaterial:document.getElementById('cNama').value.trim(),
    kategori:document.getElementById('cKategori').value.trim(),
    unitVendor:document.getElementById('cUnitVendor').value,
    faktor:parseFloat(document.getElementById('cFaktor').value)||0,
    unitDasar:document.getElementById('cUnitDasar').value,
    wastePct:document.getElementById('cWasteEnable').checked?parseFloat(document.getElementById('cWaste').value)||0:0,
    purchasePct:document.getElementById('cPurchaseEnable').checked?parseFloat(document.getElementById('cPurchase').value)||0:0,
    aktif:document.getElementById('cAktif').checked,
    catatan:document.getElementById('cCatatan').value.trim()
  };
  if(!data.namaMaterial){toast('Nama material wajib diisi!','error');return;}
  if(!data.unitVendor){toast('Unit vendor wajib diisi!','error');return;}
  if(!data.unitDasar){toast('Unit dasar AHSP wajib diisi!','error');return;}
  if(data.faktor<=0){toast('Faktor konversi harus lebih besar dari 0!','error');return;}
 
  if(isDemo()){
    if(id){const i=convRules.findIndex(c=>c.id===id);if(i!==-1)convRules[i]={...convRules[i],...data};}
    else{data.id='CONV-'+String(convRules.length+1).padStart(4,'0');convRules.unshift(data);}
    cancelEditConv();filterConv();toast(id?'Aturan diperbarui!':'Aturan ditambahkan!');return;
  }
  const btn=document.getElementById('convSaveBtn');btn.disabled=true;
  try{
    const r=await QSApi.post({action:id?'updateConversion':'addConversion',data});
    if(r.success){toast(r.message);cancelEditConv();await loadConversions();}else toast(r.message,'error');
  }catch(e){toast('Koneksi error!','error');}
  btn.disabled=false;
}
 
function editConv(id){
  const c=convRules.find(x=>x.id===id);if(!c)return;
  document.getElementById('convEditId').value=c.id;
  document.getElementById('cNama').value=c.namaMaterial;
  document.getElementById('cKategori').value=c.kategori||'';
  document.getElementById('cUnitVendor').value=c.unitVendor;
  document.getElementById('cFaktor').value=c.faktor;
  document.getElementById('cUnitDasar').value=c.unitDasar;
  document.getElementById('cAktif').checked=c.aktif;
  document.getElementById('cCatatan').value=c.catatan||'';
  // Waste
  if(c.wastePct>0){document.getElementById('cWasteEnable').checked=true;document.getElementById('wasteFields').style.display='block';document.getElementById('cWaste').value=c.wastePct;}
  else{document.getElementById('cWasteEnable').checked=false;document.getElementById('wasteFields').style.display='none';}
  // Purchase
  if(c.purchasePct>0){document.getElementById('cPurchaseEnable').checked=true;document.getElementById('purchaseFields').style.display='block';document.getElementById('cPurchase').value=c.purchasePct;}
  else{document.getElementById('cPurchaseEnable').checked=false;document.getElementById('purchaseFields').style.display='none';}
  document.getElementById('convFormTitle').textContent='Edit Aturan';
  document.getElementById('convSaveLbl').textContent='UPDATE ATURAN';
  document.getElementById('convCancelBtn').style.display='block';
  updateConvPreview();
  document.getElementById('convFormCard').scrollIntoView({behavior:'smooth'});
}
 
function cancelEditConv(){
  ['convEditId','cNama','cKategori','cFaktor','cCatatan'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('cUnitVendor').value='';
  document.getElementById('cUnitDasar').value='';
  document.getElementById('cAktif').checked=true;
  document.getElementById('cWasteEnable').checked=false; document.getElementById('wasteFields').style.display='none';
  document.getElementById('cPurchaseEnable').checked=false; document.getElementById('purchaseFields').style.display='none';
  document.getElementById('convFormTitle').textContent='Tambah Aturan';
  document.getElementById('convSaveLbl').textContent='SIMPAN ATURAN';
  document.getElementById('convCancelBtn').style.display='none';
  document.getElementById('factorPreview').style.display='none';
}
 
function deleteConv(id,nama){
  showConfirm('Hapus Aturan Konversi',`Hapus aturan untuk "${nama}"?`,async()=>{
    if(isDemo()){convRules=convRules.filter(c=>c.id!==id);filterConv();toast('Aturan dihapus','info');return;}
    try{const r=await QSApi.post({action:'deleteConversion',id});if(r.success){toast(r.message);await loadConversions();}else toast(r.message,'error');}
    catch(e){toast('Error','error');}
  });
}
 
// ── KALKULATOR ───────────────────────────────────────────────
function calcEngine(harga,faktor,waste,purchase){
  const h=parseFloat(harga)||0,f=parseFloat(faktor)||1,w=parseFloat(waste)||0,p=parseFloat(purchase)||0;
  const base=h/f, withWaste=base*(1+w/100), final=withWaste*(1+p/100);
  return{base:Math.round(base), wasteAmt:Math.round(base*w/100), purchaseAmt:Math.round(withWaste*p/100), final:Math.round(final), w, p};
}
 
function calcLookupRule(){
  const nama=(document.getElementById('calcNama').value||'').toLowerCase().trim();
  const uv=(document.getElementById('calcUnitVendor').value||'').toLowerCase();
  if(!nama||!uv){document.getElementById('calcRuleBadge').innerHTML='';return;}
  const rule=convRules.find(c=>
    c.aktif && uv===c.unitVendor.toLowerCase() &&
    (c.namaMaterial.toLowerCase()===nama || nama.includes(c.namaMaterial.toLowerCase()))
  );
  const badge=document.getElementById('calcRuleBadge');
  if(rule){
    badge.innerHTML=`<div class="rule-found-badge found"><i class="fas fa-check-circle"></i> Aturan ditemukan: <strong>1 ${rule.unitVendor} = ${Fmt.dec(rule.faktor,4)} ${rule.unitDasar}</strong></div>`;
    document.getElementById('calcFaktor').value=rule.faktor;
    document.getElementById('calcWaste').value=rule.wastePct||'';
    document.getElementById('calcPurchase').value=rule.purchasePct||'';
    document.getElementById('calcFactorHint').textContent=rule.catatan||'Faktor dari database konversi';
    runCalc();
    showMultiVendor(nama,rule.unitDasar);
  } else {
    badge.innerHTML=`<div class="rule-found-badge notfound"><i class="fas fa-triangle-exclamation"></i> Aturan tidak ditemukan — isi faktor secara manual</div>`;
    document.getElementById('calcFactorHint').textContent='Isi faktor manual';
  }
}
 
function runCalc(){
  const nama=(document.getElementById('calcNama').value||'').trim();
  const uv=document.getElementById('calcUnitVendor').value||'unit';
  const harga=parseFloat(document.getElementById('calcHarga').value)||0;
  const faktor=parseFloat(document.getElementById('calcFaktor').value)||1;
  const waste=parseFloat(document.getElementById('calcWaste').value)||0;
  const purchase=parseFloat(document.getElementById('calcPurchase').value)||0;
 
  const rule=convRules.find(c=>c.aktif&&(document.getElementById('calcUnitVendor').value||'').toLowerCase()===c.unitVendor.toLowerCase()&&(nama.toLowerCase().includes(c.namaMaterial.toLowerCase())||c.namaMaterial.toLowerCase()===nama.toLowerCase()));
  const ud=rule?rule.unitDasar:'unit dasar';
 
  if(!harga||!faktor){
    document.getElementById('calcResult').style.display='none';
    document.getElementById('calcPlaceholder').style.display='block';
    return;
  }
  const r=calcEngine(harga,faktor,waste,purchase);
  document.getElementById('calcPlaceholder').style.display='none';
  document.getElementById('calcResult').style.display='block';
  document.getElementById('calcFormula').innerHTML=
    `Harga AHSP = (<strong style="color:var(--text)">${Fmt.rupiah(harga)}</strong> ÷ <strong style="color:var(--text)">${Fmt.dec(faktor,4)}</strong>)${waste>0?` × (1 + ${waste}%)`:''}${purchase>0?` × (1 + ${purchase}%)`:''}`;
  document.getElementById('calcBreakdown').innerHTML=`
    <div class="result-row"><span class="result-label">Harga Vendor (per ${uv})</span><span class="result-val">${Fmt.rupiah(harga)}</span></div>
    <div class="result-row"><span class="result-label">÷ Faktor (${Fmt.dec(faktor,4)} ${ud}/${uv})</span><span class="result-val text-dim">= ${Fmt.rupiah(r.base)} / ${ud}</span></div>
    ${waste>0?`<div class="result-row"><span class="result-label">+ Waste Factor (${waste}%)</span><span class="result-val" style="color:var(--warning)">+ ${Fmt.rupiah(r.wasteAmt)}</span></div>`:''}
    ${purchase>0?`<div class="result-row"><span class="result-label">+ Purchase Factor (${purchase}%)</span><span class="result-val" style="color:var(--warning)">+ ${Fmt.rupiah(r.purchaseAmt)}</span></div>`:''}
    <div class="result-row final">
      <span>Harga AHSP <span class="unit-badge" style="font-size:11px;margin-left:6px">/ ${ud}</span></span>
      <span style="color:var(--primary);font-size:22px">${Fmt.rupiah(r.final)}</span>
    </div>`;
}
 
function showMultiVendor(namaMaterial, unitDasar){
  // This would query materials with the same name from different vendors
  // In demo mode, show a simulated comparison
  const vendors=[
    {vendor:'Toko A',hargaVendor:1500000,hargaAHSP:15750},
    {vendor:'Toko B',hargaVendor:1450000,hargaAHSP:15225},
    {vendor:'Toko C',hargaVendor:1600000,hargaAHSP:16800},
  ];
  const minH=Math.min(...vendors.map(v=>v.hargaAHSP));
  document.getElementById('multiVendorSection').style.display='block';
  document.getElementById('multiVendorBody').innerHTML=vendors.sort((a,b)=>a.hargaAHSP-b.hargaAHSP).map((v,i)=>`
    <tr ${v.hargaAHSP===minH?'class="best-price-row"':''}>
      <td class="mono">#${i+1}</td>
      <td>${v.hargaAHSP===minH?'<i class="fas fa-crown" style="color:var(--success);margin-right:5px"></i>':''}${v.vendor}</td>
      <td class="currency">${Fmt.rupiah(v.hargaVendor)}</td>
      <td class="currency" style="${v.hargaAHSP===minH?'color:var(--success)':''}">${Fmt.rupiah(v.hargaAHSP)}</td>
      <td class="mono">${v.hargaAHSP===minH?'<span class="badge badge-green">TERBAIK</span>':'+'+Fmt.rupiah(v.hargaAHSP-minH)}</td>
      <td><button class="btn btn-cyan btn-sm" onclick="useVendorPrice(${v.hargaVendor})" title="Pakai harga ini">Pakai</button></td>
    </tr>`).join('');
}
 
function useVendorPrice(harga){
  document.getElementById('calcHarga').value=harga;
  runCalc();
  toast('Harga vendor dipilih: '+Fmt.rupiah(harga),'info');
}
 
// ── IMPORT ────────────────────────────────────────────────────
function handleFileDrop(e){e.preventDefault();document.getElementById('dropZone').classList.remove('drag');processFile(e.dataTransfer.files[0]);}
function handleFileSelect(e){processFile(e.target.files[0]);}
 
function processFile(file){
  if(!file)return;
  const ext=file.name.split('.').pop().toLowerCase();
  const reader=new FileReader();
  reader.onload=e=>{
    let rows=[];
    if(ext==='csv'){
      rows=parseCSV(e.target.result);
    } else {
      const wb=XLSX.read(e.target.result,{type:'binary'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      rows=XLSX.utils.sheet_to_json(ws);
    }
    buildImportPreview(rows);
  };
  if(ext==='csv') reader.readAsText(file);
  else reader.readAsBinaryString(file);
}
 
function parseCSV(text){
  const lines=text.split('\n').filter(l=>l.trim());
  const headers=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
  return lines.slice(1).map(line=>{
    const vals=line.split(',').map(v=>v.trim().replace(/^"|"$/g,''));
    const obj={};headers.forEach((h,i)=>obj[h]=vals[i]||'');
    return obj;
  });
}
 
function buildImportPreview(rows){
  // Map columns (case-insensitive)
  const map=r=>{
    const get=(k1,k2,k3)=>{const keys=Object.keys(r);const k=keys.find(k=>k.toLowerCase()===k1||k.toLowerCase()===k2||k.toLowerCase()===k3);return r[k]||'';};
    return{
      namaMaterial:get('nama material','nama','material'),
      unitVendor:  get('unit vendor','vendor unit','satuan vendor'),
      faktor:      parseFloat(get('faktor','isi','konversi'))||0,
      unitDasar:   get('unit dasar','base unit','satuan dasar'),
      kategori:    get('kategori','category','kategori'),
      wastePct:    parseFloat(get('waste%','waste','faktor waste'))||0,
      purchasePct: parseFloat(get('purchase%','purchase','faktor purchase'))||0,
      catatan:     get('catatan','keterangan','notes'),
    };
  };
 
  importRows=rows.map(map).filter(r=>r.namaMaterial&&r.unitVendor&&r.faktor>0&&r.unitDasar);
  const invalid=rows.length-importRows.length;
 
  document.getElementById('previewCount').textContent=`${importRows.length} valid, ${invalid} dilewati`;
  document.getElementById('previewTitle').textContent=`Preview Import (${rows.length} baris)`;
  document.getElementById('previewBody').innerHTML=importRows.map((r,i)=>`
    <tr>
      <td class="mono">${i+1}</td>
      <td>${r.namaMaterial}</td>
      <td><span class="unit-badge">${r.unitVendor}</span></td>
      <td class="mono">${Fmt.dec(r.faktor,4)}</td>
      <td><span class="unit-badge" style="background:rgba(34,211,238,.1);border-color:rgba(34,211,238,.2);color:var(--cyan)">${r.unitDasar}</span></td>
      <td><span class="badge badge-cyan">${r.kategori||'—'}</span></td>
      <td class="mono">${r.wastePct||'—'}</td>
      <td><span class="badge badge-green">Valid</span></td>
    </tr>`).join('');
  document.getElementById('importPreview').style.display='block';
  toast(`${importRows.length} baris siap diimport`,'info');
}
 
async function executeImport(){
  if(!importRows.length){toast('Tidak ada data untuk diimport','error');return;}
  const btn=document.getElementById('importBtn');btn.disabled=true;
  if(isDemo()){
    importRows.forEach(r=>{r.id='CONV-'+String(convRules.length+1).padStart(4,'0');r.aktif=true;convRules.push(r);});
    filterConv();toast(`${importRows.length} aturan berhasil diimport (Demo)!`);
    document.getElementById('importPreview').style.display='none';
    btn.disabled=false; return;
  }
  try{
    const r=await QSApi.post({action:'importConversions',rows:importRows});
    if(r.success){toast(r.message);await loadConversions();document.getElementById('importPreview').style.display='none';}
    else toast(r.message,'error');
  }catch(e){toast('Koneksi error!','error');}
  btn.disabled=false;
}
 
// ── EXPORT ────────────────────────────────────────────────────
function exportConvCSV(){
  exportCSV(
    ['ID','Nama Material','Kategori','Unit Vendor','Faktor Konversi','Unit Dasar','Waste%','Purchase%','Aktif','Catatan'],
    convRules.map(c=>[c.id,c.namaMaterial,c.kategori,c.unitVendor,c.faktor,c.unitDasar,c.wastePct,c.purchasePct,c.aktif,c.catatan]),
    'konversi_material.csv'
  );
  toast('Export CSV berhasil!');
}
 
function downloadTemplate(){
  const wb=XLSX.utils.book_new();
  const data=[
    ['Nama Material','Unit Vendor','Faktor','Unit Dasar','Kategori','Waste%','Purchase%','Catatan'],
    ['Kabel NYM 2x1.5','Roll',100,'m','Elektrikal',5,2,'1 Roll = 100m'],
    ['Keramik 60x60','Dus',1.44,'m²','Keramik',5,0,'1 Dus = 1.44 m²'],
    ['Cat Dulux','Pail',20,'liter','Finishing',3,0,'1 Pail = 20 liter'],
    ['Pipa PVC 4"','Batang',4,'m','Plumbing',5,0,'1 Batang = 4m'],
    ['Wiremesh M6','Lembar',5.4,'m²','Besi & Baja',5,2,'1 Lembar 2.1x5.4'],
  ];
  const ws=XLSX.utils.aoa_to_sheet(data);
  ws['!cols']=[{wch:22},{wch:12},{wch:8},{wch:10},{wch:14},{wch:7},{wch:10},{wch:28}];
  XLSX.utils.book_append_sheet(wb,ws,'Template Konversi');
  XLSX.writeFile(wb,'template_konversi_material.xlsx');
  toast('Template Excel didownload!');
}
 
function downloadTemplateTSV(){
  const tsv='Nama Material\tUnit Vendor\tFaktor\tUnit Dasar\tKategori\tWaste%\tPurchase%\tCatatan\nKabel NYM 2x1.5\tRoll\t100\tm\tElektrikal\t5\t2\t1 Roll = 100m\nKeramik 60x60\tDus\t1.44\tm²\tKeramik\t5\t0\t1 Dus = 1.44 m²';
  const a=document.createElement('a');a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(tsv);a.download='template_konversi.csv';a.click();
  toast('Template CSV didownload!');
}
 
// ── INIT ──────────────────────────────────────────────────────
const _user=QSAuth.requirePerm('conversion');
if(_user){
  initSidebar('conversion');
  const hash=location.hash.replace('#','');
  if(MAIN_TABS.includes(hash)) switchMainTab(hash);
  loadConversions();
}

/* ============================================================
   QS Manager — Shared Module v3.0
   Embed this <script> block in every page.
   ============================================================ */
 
// ── CONFIG ───────────────────────────────────────────────────
const API_URL = 'https://script.google.com/macros/s/AKfycbzzYNxLgt1syGzrm5ZC0JYRmCwA6veoPWwIaBHrNV2D2A3T3FC6KY1Uoj3WzO2ZDFRHjw/exec';
 
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
 
// ── STATE ─────────────────────────────────────────────────────
let materials=[], upahList=[], alatList=[], ahspList=[], ahspFiltered=[];
let ahspItems=[], itemIdx=0;
let selectedAHSP=new Set();
const isDemo=()=>API_URL==='YOUR_GAS_WEBAPP_URL';
 
// ── DEMO DATA ──────────────────────────────────────────────────
function demoMaterials(){return[
  {id:'MAT-0001',nama:'Beton K-350',harga:1250000,satuan:'m³'},
  {id:'MAT-0002',nama:'Beton K-400',harga:1350000,satuan:'m³'},
  {id:'MAT-0003',nama:'Besi Beton D16',harga:18500,satuan:'kg'},
  {id:'MAT-0004',nama:'Besi Beton D12',harga:17500,satuan:'kg'},
  {id:'MAT-0005',nama:'Besi Beton D10',harga:17000,satuan:'kg'},
  {id:'MAT-0006',nama:'Semen Portland 50kg',harga:78000,satuan:'sak'},
  {id:'MAT-0007',nama:'Pasir Beton',harga:325000,satuan:'m³'},
  {id:'MAT-0008',nama:'Agregat Kasar 2/3',harga:285000,satuan:'m³'},
  {id:'MAT-0009',nama:'Plywood 18mm',harga:320000,satuan:'lbr'},
  {id:'MAT-0010',nama:'Kayu Kaso 5/7',harga:85000,satuan:'btg'},
  {id:'MAT-0011',nama:'Kawat Bendrat',harga:25000,satuan:'kg'},
  {id:'MAT-0012',nama:'Minyak Bekisting',harga:18000,satuan:'ltr'},
];}
function demoUpah(){return[
  {id:'UPH-0001',nama:'Mandor',harga:350000,satuan:'OH'},
  {id:'UPH-0002',nama:'Kepala Tukang',harga:300000,satuan:'OH'},
  {id:'UPH-0003',nama:'Tukang Batu',harga:250000,satuan:'OH'},
  {id:'UPH-0004',nama:'Tukang Besi',harga:260000,satuan:'OH'},
  {id:'UPH-0005',nama:'Pembantu Tukang',harga:180000,satuan:'OH'},
  {id:'UPH-0006',nama:'Tukang Kayu',harga:255000,satuan:'OH'},
];}
function demoAlat(){return[
  {id:'ALT-0001',nama:'Concrete Mixer 0.3m³',harga:45000,satuan:'jam'},
  {id:'ALT-0002',nama:'Concrete Vibrator',harga:35000,satuan:'jam'},
  {id:'ALT-0003',nama:'Bar Cutter & Bender',harga:150000,satuan:'hari'},
  {id:'ALT-0004',nama:'Pompa Air',harga:25000,satuan:'jam'},
];}
function demoAHSP(){return[
  {id:'AHSP-0001',namaPekerjaan:'Pekerjaan Pondasi Beton Bertulang K-350',
   overhead:10,contractorFee:5,pph:2,
   totalAHSP:3547500,grandTotal:4201965,
   items:[
     {jenis:'material',item:'Beton K-350',koefisien:1,hargaSatuan:1250000,jumlah:1250000},
     {jenis:'material',item:'Besi Beton D16',koefisien:120,hargaSatuan:18500,jumlah:2220000},
     {jenis:'material',item:'Kawat Bendrat',koefisien:1.5,hargaSatuan:25000,jumlah:37500},
     {jenis:'upah',item:'Tukang Besi',koefisien:1.5,hargaSatuan:260000,jumlah:390000},
     {jenis:'upah',item:'Mandor',koefisien:0.15,hargaSatuan:350000,jumlah:52500},
     {jenis:'alat',item:'Concrete Vibrator',koefisien:3,hargaSatuan:35000,jumlah:105000},
   ]},
  {id:'AHSP-0002',namaPekerjaan:'Pasangan Bata Ringan AAC t=10cm',
   overhead:8,contractorFee:5,pph:2,
   totalAHSP:378500,grandTotal:440811,
   items:[
     {jenis:'material',item:'Bata Ringan AAC',koefisien:83,hargaSatuan:2500,jumlah:207500},
     {jenis:'material',item:'Mortar Perekat',koefisien:11.5,hargaSatuan:6500,jumlah:74750},
     {jenis:'upah',item:'Tukang Batu',koefisien:0.35,hargaSatuan:250000,jumlah:87500},
     {jenis:'upah',item:'Pembantu Tukang',koefisien:0.05,hargaSatuan:180000,jumlah:9000},
   ]},
];}
 
// ── LOAD ───────────────────────────────────────────────────────
async function loadAll(){
  if(isDemo()){ materials=demoMaterials(); upahList=demoUpah(); alatList=demoAlat(); ahspList=demoAHSP(); }
  else {
    try {
      const [rm,ru,ra,rah]=await Promise.all([
        QSApi.get('getMaterials',{limit:2000}),QSApi.get('getUpah'),
        QSApi.get('getAlat'),QSApi.get('getAHSP')
      ]);
      if(rm.success)materials=rm.data||[];
      if(ru.success)upahList=ru.data||[];
      if(ra.success)alatList=ra.data||[];
      if(rah.success)ahspList=rah.data||[];
    } catch(e){ materials=demoMaterials();upahList=demoUpah();alatList=demoAlat();ahspList=demoAHSP(); }
  }
  renderAHSPList();
}
 
// ── BUILDER: ADD ITEM ROW ──────────────────────────────────────
function addItem(jenis){
  itemIdx++;
  const idx=itemIdx;
  const list=document.getElementById('ahspItemList');
  if(list.querySelector('.item-placeholder')) list.innerHTML='';
 
  const src=jenis==='material'?materials:jenis==='upah'?upahList:alatList;
  const opts=src.map(x=>`<option value="${x.id}" data-harga="${x.harga}" data-satuan="${x.satuan||''}" data-nama="${x.nama.replace(/"/g,'&quot;')}">${x.nama} — ${Fmt.rupiah(x.harga)}/${x.satuan||'unit'}</option>`).join('');
  const bCls={material:'jenis-mat',upah:'jenis-upah',alat:'jenis-alat'}[jenis];
  const bLbl={material:'Material',upah:'Upah',alat:'Alat'}[jenis];
 
  const row=document.createElement('div');
  row.className='item-row'; row.id=`ir-${idx}`; row.dataset.jenis=jenis;
  row.innerHTML=`
    <div class="item-row-head">
      <span class="badge ${bCls}">${bLbl}</span>
      <button class="ai-del" onclick="removeItem(${idx})"><i class="fas fa-times"></i></button>
    </div>
    <div class="frow-2" style="gap:10px">
      <div class="fgroup" style="margin:0">
        <label class="flabel" style="margin-bottom:4px">Item</label>
        <select class="fsel" id="is-${idx}" onchange="onItemSelect(${idx})" style="font-size:12px">
          <option value="">— Pilih —</option>${opts}
        </select>
      </div>
      <div class="fgroup" style="margin:0">
        <label class="flabel" style="margin-bottom:4px">Koefisien</label>
        <input type="number" step="any" min="0" class="finput" id="ik-${idx}" placeholder="0.000" oninput="calcItem(${idx})" style="font-size:12px">
      </div>
    </div>
    <div class="item-calc" id="ic-${idx}">
      <span id="ic-k-${idx}">0</span>
      <span class="eq">×</span>
      <span id="ic-h-${idx}">Rp 0</span>
      <span class="eq">=</span>
      <span class="result" id="ic-r-${idx}">Rp 0</span>
    </div>`;
  list.appendChild(row);
  ahspItems.push({idx,jenis,itemId:'',itemNama:'',koefisien:0,hargaSatuan:0,satuan:'',jumlah:0});
}
 
function removeItem(idx){
  document.getElementById(`ir-${idx}`)?.remove();
  ahspItems=ahspItems.filter(x=>x.idx!==idx);
  recalcBreakdown();
  if(!document.querySelector('.item-row')) resetItemList();
}
 
function resetItemList(){
  document.getElementById('ahspItemList').innerHTML=`<div class="item-placeholder"><i class="fas fa-plus-circle"></i>Klik tombol di bawah untuk menambahkan komponen</div>`;
}
 
function onItemSelect(idx){
  const sel=document.getElementById(`is-${idx}`);
  const opt=sel.selectedOptions[0];
  const harga=parseFloat(opt?.dataset.harga||0);
  const nama=opt?.dataset.nama||'';
  const satuan=opt?.dataset.satuan||'';
  document.getElementById(`ic-h-${idx}`).textContent=Fmt.rupiah(harga);
  const it=ahspItems.find(x=>x.idx===idx);
  if(it){it.itemId=sel.value;it.itemNama=nama;it.hargaSatuan=harga;it.satuan=satuan;}
  calcItem(idx);
}
 
function calcItem(idx){
  const raw=document.getElementById(`ik-${idx}`)?.value||'0';
  // Use parseFloat to preserve full decimal precision
  const koe=parseFloat(raw)||0;
  const it=ahspItems.find(x=>x.idx===idx);
  if(!it)return;
  it.koefisien=koe;
  it.jumlah=koe*it.hargaSatuan;
  document.getElementById(`ic-k-${idx}`).textContent=Fmt.dec(koe,6);
  document.getElementById(`ic-r-${idx}`).textContent=Fmt.rupiah(it.jumlah);
  recalcBreakdown();
}
 
// ── BREAKDOWN CALCULATION ──────────────────────────────────────
function recalcBreakdown(){
  const subtotal=ahspItems.reduce((s,x)=>s+x.jumlah,0);
  const ovPct  =parseFloat(document.getElementById('pctOverhead').value)||0;
  const feePct =parseFloat(document.getElementById('pctFee').value)||0;
  const pphPct =parseFloat(document.getElementById('pctPPH').value)||0;
  const ovAmt  =subtotal*(ovPct/100);
  const feeAmt =(subtotal+ovAmt)*(feePct/100);
  const base   =subtotal+ovAmt+feeAmt;
  const pphAmt =base*(pphPct/100);
  const grand  =base+pphAmt;
  document.getElementById('bdSubtotal').textContent=Fmt.rupiah(subtotal);
  document.getElementById('bdOverhead').textContent='+ '+Fmt.rupiah(ovAmt);
  document.getElementById('bdFee').textContent='+ '+Fmt.rupiah(feeAmt);
  document.getElementById('bdPPH').textContent='+ '+Fmt.rupiah(pphAmt);
  document.getElementById('bdGrand').textContent=Fmt.rupiah(grand);
  return{subtotal,ovAmt,feeAmt,pphAmt,grand};
}
 
// ── SAVE AHSP ──────────────────────────────────────────────────
async function saveAHSP(){
  const editId=document.getElementById('ahspEditId').value;
  const nama=document.getElementById('ahspNama').value.trim();
  if(!nama){toast('Nama pekerjaan wajib diisi!','error');return;}
  const valid=ahspItems.filter(x=>x.itemId&&x.koefisien>0);
  if(!valid.length){toast('Minimal 1 komponen dengan item dan koefisien!','error');return;}
  const bd=recalcBreakdown();
  const payload={
    id:editId||undefined,
    namaPekerjaan:nama,
    overhead:parseFloat(document.getElementById('pctOverhead').value)||0,
    contractorFee:parseFloat(document.getElementById('pctFee').value)||0,
    pph:parseFloat(document.getElementById('pctPPH').value)||0,
    items:valid.map(x=>({jenis:x.jenis,item:x.itemNama,koefisien:x.koefisien,hargaSatuan:x.hargaSatuan,satuan:x.satuan}))
  };
  if(isDemo()){
    if(editId){
      const i=ahspList.findIndex(a=>a.id===editId);
      if(i!==-1)ahspList[i]={...ahspList[i],namaPekerjaan:nama,overhead:payload.overhead,contractorFee:payload.contractorFee,pph:payload.pph,totalAHSP:bd.subtotal,grandTotal:bd.grand,items:payload.items.map(x=>({...x,jumlah:x.koefisien*x.hargaSatuan}))};
      toast('AHSP diperbarui! (Demo)');
    } else {
      const id='AHSP-'+String(ahspList.length+1).padStart(4,'0');
      ahspList.unshift({id,...payload,totalAHSP:bd.subtotal,grandTotal:bd.grand,items:payload.items.map(x=>({...x,jumlah:x.koefisien*x.hargaSatuan}))});
      toast('AHSP disimpan! (Demo)');
    }
    cancelEditAHSP();renderAHSPList();return;
  }
  const btn=document.getElementById('ahspSaveBtn');btn.disabled=true;
  try{
    const action=editId?'updateAHSP':'addAHSP';
    if(editId)payload.id=editId;
    const r=await QSApi.post({action,data:payload});
    if(r.success){toast(r.message);cancelEditAHSP();await loadAll();}
    else toast(r.message||'Gagal menyimpan!','error');
  }catch(e){toast('Koneksi error!','error');}
  btn.disabled=false;
}
 
// ── EDIT AHSP ──────────────────────────────────────────────────
function editAHSP(id){
  const a=ahspList.find(x=>x.id===id);if(!a)return;
  // Reset form
  cancelEditAHSP(false);
  document.getElementById('ahspEditId').value=a.id;
  document.getElementById('ahspNama').value=a.namaPekerjaan;
  document.getElementById('pctOverhead').value=a.overhead||0;
  document.getElementById('pctFee').value=a.contractorFee||0;
  document.getElementById('pctPPH').value=a.pph||0;
  // Re-add items
  a.items.forEach(it=>{
    addItem(it.jenis);
    const idx=itemIdx;
    // Set select value after render
    setTimeout(()=>{
      const sel=document.getElementById(`is-${idx}`);
      // find option by nama
      const opt=[...sel.options].find(o=>o.dataset.nama===it.item||o.text.startsWith(it.item));
      if(opt){sel.value=opt.value;onItemSelect(idx);}
      const kinput=document.getElementById(`ik-${idx}`);
      if(kinput){kinput.value=it.koefisien;calcItem(idx);}
    },0);
  });
  document.getElementById('builderTitle').textContent='Edit AHSP';
  document.getElementById('ahspSaveLbl').textContent='UPDATE AHSP';
  document.getElementById('ahspCancelBtn').style.display='block';
  document.getElementById('builderCard').scrollIntoView({behavior:'smooth'});
}
 
function cancelEditAHSP(resetForm=true){
  if(resetForm){
    document.getElementById('ahspEditId').value='';
    document.getElementById('ahspNama').value='';
    document.getElementById('pctOverhead').value='0';
    document.getElementById('pctFee').value='0';
    document.getElementById('pctPPH').value='0';
    ahspItems=[];itemIdx=0;resetItemList();recalcBreakdown();
  }
  document.getElementById('builderTitle').textContent='Input AHSP Baru';
  document.getElementById('ahspSaveLbl').textContent='SIMPAN AHSP';
  document.getElementById('ahspCancelBtn').style.display='none';
}
 
// ── AHSP LIST ──────────────────────────────────────────────────
function filterAHSP(){renderAHSPList();}
function renderAHSPList(){
  const q=(document.getElementById('ahspSearch').value||'').toLowerCase();
  ahspFiltered=ahspList.filter(a=>!q||a.namaPekerjaan.toLowerCase().includes(q)||a.id.toLowerCase().includes(q));
  document.getElementById('ahspCount').textContent=ahspFiltered.length;
  const el=document.getElementById('ahspListBody');
  if(!ahspFiltered.length){el.innerHTML='<div class="empty-state"><i class="fas fa-inbox"></i><p>Belum ada AHSP</p></div>';return;}
  const canEdit=QSAuth.can('ahsp'),canDel=QSAuth.can('delete');
  el.innerHTML=ahspFiltered.map(a=>{
    const mC=a.items.filter(x=>x.jenis==='material').length;
    const uC=a.items.filter(x=>x.jenis==='upah').length;
    const aC=a.items.filter(x=>x.jenis==='alat').length;
    return `<div class="ahsp-item ${selectedAHSP.has(a.id)?'selected':''}" id="ai-${a.id}">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <input type="checkbox" ${selectedAHSP.has(a.id)?'checked':''} onclick="toggleSelect('${a.id}',event)" title="Pilih untuk export">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
            <span class="ai-id">${a.id}</span>
            <div style="display:flex;gap:4px">
              <button class="ai-del" onclick="event.stopPropagation();showDetail('${a.id}')" title="Detail" style="background:rgba(249,115,22,.1);color:var(--primary)"><i class="fas fa-eye"></i></button>
              ${canEdit?`<button class="ai-del" onclick="event.stopPropagation();editAHSP('${a.id}')" title="Edit" style="background:rgba(34,211,238,.1);color:var(--cyan)"><i class="fas fa-pen"></i></button>`:''}
              ${canDel?`<button class="ai-del" onclick="event.stopPropagation();deleteAHSP('${a.id}','${a.namaPekerjaan.replace(/'/g,"\\'")}')"><i class="fas fa-trash"></i></button>`:''}
            </div>
          </div>
          <div class="ai-name">${a.namaPekerjaan}</div>
          <div class="ai-total">Subtotal: ${Fmt.rupiah(a.totalAHSP)}</div>
          <div class="ai-grand">Grand Total: ${Fmt.rupiah(a.grandTotal)}</div>
          <div class="ai-meta">
            ${mC?`<span class="badge badge-orange">${mC} material</span>`:''}
            ${uC?`<span class="badge badge-cyan">${uC} upah</span>`:''}
            ${aC?`<span class="badge badge-purple">${aC} alat</span>`:''}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}
 
function toggleSelect(id,event){
  event.stopPropagation();
  if(selectedAHSP.has(id)) selectedAHSP.delete(id);
  else selectedAHSP.add(id);
  renderAHSPList();
  updateExportButtons();
}
function selectAllAHSP(){ahspFiltered.forEach(a=>selectedAHSP.add(a.id));renderAHSPList();updateExportButtons();}
function deselectAllAHSP(){selectedAHSP.clear();renderAHSPList();updateExportButtons();}
function updateExportButtons(){
  const n=selectedAHSP.size;
  document.getElementById('btnExportXL').textContent=n?`Export Excel (${n})`:'Export Excel';
  document.getElementById('btnCopyTSV').textContent=n?`Copy TSV (${n})`:'Copy TSV';
}
 
// ── DETAIL MODAL ───────────────────────────────────────────────
function showDetail(id){
  const a=ahspList.find(x=>x.id===id);if(!a)return;
  const rows=a.items.map((it,i)=>`<tr>
    <td>${i+1}</td>
    <td><span class="badge ${it.jenis==='material'?'badge-orange':it.jenis==='upah'?'badge-cyan':'badge-purple'}">${it.jenis}</span></td>
    <td style="color:var(--text)">${it.item}</td>
    <td class="mono">${Fmt.dec(it.koefisien,6)}</td>
    <td class="currency">${Fmt.rupiah(it.hargaSatuan)}</td>
    <td class="currency">${Fmt.rupiah(it.jumlah)}</td>
  </tr>`).join('');
  document.getElementById('detailModalContent').innerHTML=`
    <div style="margin-bottom:14px">
      <div style="font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase">ID AHSP</div>
      <div class="mono" style="font-size:13px;margin-top:3px">${a.id}</div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase">Nama Pekerjaan</div>
      <div style="font-size:15px;font-weight:600;margin-top:3px;color:var(--text)">${a.namaPekerjaan}</div>
    </div>
    <div class="tbl-wrap" style="border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;margin-bottom:14px">
      <table class="tbl" style="min-width:0">
        <thead><tr><th>#</th><th>Jenis</th><th>Item</th><th>Koefisien</th><th>Harga Sat.</th><th>Jumlah</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="breakdown-box">
      <div class="breakdown-row"><span class="breakdown-label">Subtotal AHSP</span><span class="breakdown-val">${Fmt.rupiah(a.totalAHSP)}</span></div>
      <div class="breakdown-row"><span class="breakdown-label">Overhead (${a.overhead||0}%)</span><span class="breakdown-val">+ ${Fmt.rupiah(a.totalAHSP*(a.overhead||0)/100)}</span></div>
      <div class="breakdown-row"><span class="breakdown-label">Contractor Fee (${a.contractorFee||0}%)</span><span class="breakdown-val">+ ${Fmt.rupiah((a.totalAHSP+a.totalAHSP*(a.overhead||0)/100)*(a.contractorFee||0)/100)}</span></div>
      <div class="breakdown-row"><span class="breakdown-label">Pajak PPH (${a.pph||0}%)</span><span class="breakdown-val">+ ${Fmt.rupiah(a.grandTotal-a.totalAHSP*(1+(a.overhead||0)/100)*(1+(a.contractorFee||0)/100))}</span></div>
      <div class="breakdown-row total"><span style="color:var(--text)">GRAND TOTAL</span><span style="color:var(--primary);font-size:18px">${Fmt.rupiah(a.grandTotal)}</span></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
      ${QSAuth.can('ahsp')?`<button class="btn btn-cyan btn-sm" onclick="closeDetailModal();editAHSP('${a.id}')"><i class="fas fa-pen"></i> Edit AHSP</button>`:''}
      <button class="btn btn-secondary btn-sm" onclick="exportSingleExcel('${a.id}')"><i class="fas fa-file-excel"></i> Export Excel</button>
      <button class="btn btn-secondary btn-sm" onclick="copySingleTSV('${a.id}')"><i class="fas fa-copy"></i> Copy TSV</button>
    </div>`;
  document.getElementById('detailModal').classList.add('open');
}
function closeDetailModal(){document.getElementById('detailModal').classList.remove('open');}
document.getElementById('detailModal').addEventListener('click',e=>{if(e.target===document.getElementById('detailModal'))closeDetailModal();});
 
// ── DELETE ──────────────────────────────────────────────────────
function deleteAHSP(id,nama){
  showConfirm('Hapus AHSP',`Hapus AHSP "${nama}"? Semua komponen akan dihapus.`,async()=>{
    if(isDemo()){ahspList=ahspList.filter(a=>a.id!==id);selectedAHSP.delete(id);renderAHSPList();toast('AHSP dihapus (Demo)','info');return;}
    try{const r=await QSApi.post({action:'deleteAHSP',id});if(r.success){toast(r.message);await loadAll();}else toast(r.message,'error');}
    catch(e){toast('Error','error');}
  });
}
 
// ── EXPORT FUNCTIONS (Format Permen PUPR No.8/2023) ──────────────
 
/**
 * Build worksheet data array + merges + styles for ONE AHSP item
 * Format sesuai tabel AHSP SNI/PUPR:
 * Cols: No | Uraian | Kode | Satuan | Koefisien | Harga Satuan (Rp) | Jumlah Harga (Rp)
 */
function buildAHSPWorksheet(a) {
  // ── helpers ─────────────────────────────────────────────────────
  const rp = n => Number(n || 0);           // raw number for Excel
  const pct = n => parseFloat(n || 0);
 
  // ── group items by category ──────────────────────────────────────
  const tenagaKerja = a.items.filter(x => x.jenis === 'upah');
  const bahan       = a.items.filter(x => x.jenis === 'material');
  const peralatan   = a.items.filter(x => x.jenis === 'alat');
 
  // ── compute subtotals ───────────────────────────────────────────
  const sumTK  = tenagaKerja.reduce((s, x) => s + (parseFloat(x.koefisien) || 0) * (parseFloat(x.hargaSatuan) || 0), 0);
  const sumBhn = bahan.reduce((s, x)       => s + (parseFloat(x.koefisien) || 0) * (parseFloat(x.hargaSatuan) || 0), 0);
  const sumAlat= peralatan.reduce((s, x)   => s + (parseFloat(x.koefisien) || 0) * (parseFloat(x.hargaSatuan) || 0), 0);
  const subtotal = sumTK + sumBhn + sumAlat;
 
  const ovPct  = pct(a.overhead);
  const feePct = pct(a.contractorFee);
  const pphPct = pct(a.pph);
  const bukPct = ovPct + feePct + pphPct;   // total BUK %
  const ovAmt  = subtotal * (ovPct  / 100);
  const feeAmt = (subtotal + ovAmt) * (feePct / 100);
  const base   = subtotal + ovAmt + feeAmt;
  const pphAmt = base * (pphPct / 100);
  const grandTotal = base + pphAmt;
 
  // ── column index helpers (0-based) ──────────────────────────────
  // A=0:No  B=1:Uraian  C=2:Kode  D=3:Satuan  E=4:Koefisien  F=5:HargaSatuan  G=6:JumlahHarga
  const NCOLS = 7;
 
  // ── accumulate AOA rows + merge list ───────────────────────────
  const aoa    = [];  // array of arrays
  const merges = [];  // {s:{r,c}, e:{r,c}}
  const widths = [6, 38, 10, 9, 12, 18, 18]; // col widths chars
 
  let r = 0; // current row index (0-based)
 
  // ── ROW 0: TITLE (merged A-G) ──────────────────────────────────
  aoa.push([a.namaPekerjaan, '', '', '', '', '', '']);
  merges.push({ s: { r, c: 0 }, e: { r, c: NCOLS - 1 } });
  r++;
 
  // ── ROW 1: KODE AHSP (merged) ──────────────────────────────────
  aoa.push([`Kode: ${a.id}`, '', '', '', '', '', '']);
  merges.push({ s: { r, c: 0 }, e: { r, c: NCOLS - 1 } });
  r++;
 
  // ── ROW 2: blank spacer ────────────────────────────────────────
  aoa.push(['', '', '', '', '', '', '']);
  r++;
 
  // ── ROW 3: COLUMN HEADERS ──────────────────────────────────────
  aoa.push(['No', 'Uraian', 'Kode', 'Satuan', 'Koefisien', 'Harga Satuan\n(Rp)', 'Jumlah\nHarga (Rp)']);
  r++;
 
  // ── Helper: append a section ────────────────────────────────────
  function addSection(letter, label, items, sumLabel, sumVal) {
    // Section header row  e.g.  A | Tenaga Kerja
    aoa.push([letter, label, '', '', '', '', '']);
    merges.push({ s: { r, c: 1 }, e: { r, c: NCOLS - 1 } });
    r++;
 
    // Item rows
    items.forEach(it => {
      const koe    = parseFloat(it.koefisien)   || 0;
      const harga  = parseFloat(it.hargaSatuan) || 0;
      const jumlah = koe * harga;
      // Kode: use itemId if available (e.g. UPH-0001 → L.01 style), else blank
      const kode = it.kode || '';
      aoa.push(['', it.item, kode, it.satuan || '', koe, rp(harga), rp(jumlah)]);
      r++;
    });
 
    // If section is empty, add one blank item row
    if (!items.length) {
      aoa.push(['', '', '', '', '', '', '']);
      r++;
    }
 
    // Subtotal row  (label spans B-F, value in G)
    aoa.push(['', sumLabel, '', '', '', '', rp(sumVal)]);
    merges.push({ s: { r, c: 1 }, e: { r, c: 5 } });
    r++;
  }
 
  addSection('A', 'Tenaga Kerja', tenagaKerja, 'Jumlah Harga Tenaga Kerja', sumTK);
  addSection('B', 'Bahan',        bahan,        'Jumlah Harga Bahan',        sumBhn);
  addSection('C', 'Peralatan',    peralatan,    'Jumlah Harga Alat',         sumAlat);
 
  // ── ROW D: Total A+B+C ─────────────────────────────────────────
  aoa.push(['D', 'Jumlah Harga Tenaga Kerja, Bahan dan Peralatan (A+B+C)', '', '', '', '', rp(subtotal)]);
  merges.push({ s: { r, c: 1 }, e: { r, c: 5 } });
  r++;
 
  // ── ROW E: BUK ────────────────────────────────────────────────
  const bukLabel = `Biaya Umum dan Keuntungan (${ovPct + feePct}%) + PPH (${pphPct}%) × D`;
  const bukValStr = `${bukPct.toFixed(2)}% × D`;
  aoa.push(['E', bukLabel, '', '', '', bukValStr, rp(grandTotal - subtotal)]);
  merges.push({ s: { r, c: 1 }, e: { r, c: 4 } });
  r++;
 
  // ── ROW F: Harga Satuan Pekerjaan ──────────────────────────────
  aoa.push(['F', 'Harga Satuan Pekerjaan (D+E)', '', '', '', '', rp(grandTotal)]);
  merges.push({ s: { r, c: 1 }, e: { r, c: 5 } });
  r++;
 
  // ── BUILD WORKSHEET ────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;
  ws['!cols']   = widths.map(w => ({ wch: w }));
 
  // ── APPLY CELL STYLES using xlsx-style compatible approach ──────
  // SheetJS community doesn't support styles natively — we encode via
  // the sheet's !rows for row heights and use cell .z (format) for numbers
  ws['!rows'] = [];
  // Row 0 (title): taller
  ws['!rows'][0] = { hpx: 36 };
  ws['!rows'][3] = { hpx: 32 }; // column headers
 
  // Set number format for all currency cells (col F & G, data rows)
  aoa.forEach((row, ri) => {
    row.forEach((val, ci) => {
      if (typeof val === 'number') {
        const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
        if (!ws[addr]) ws[addr] = { t: 'n', v: val };
        ws[addr].z = '#,##0'; // thousands separator, no decimal
      }
    });
  });
 
  return ws;
}
 
// ── Export selected AHSP to .xlsx ──────────────────────────────────
function exportSelectedExcel(){
  const ids=[...selectedAHSP];
  if(!ids.length){toast('Pilih minimal 1 AHSP dulu!','warning');return;}
  exportAHSPToExcel(ahspList.filter(a=>ids.includes(a.id)));
}
function exportSingleExcel(id){exportAHSPToExcel([ahspList.find(a=>a.id===id)].filter(Boolean));}
 
function exportAHSPToExcel(items){
  if(!items.length)return;
  const wb = XLSX.utils.book_new();
  items.forEach(a => {
    const ws = buildAHSPWorksheet(a);
    // Sheet name max 31 chars, no special chars
    const sheetName = (a.namaPekerjaan || a.id).replace(/[^a-zA-Z0-9 \-]/g,'').trim().slice(0, 31) || a.id.slice(0,31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  const fname = 'AHSP_' + new Date().toISOString().slice(0,10) + '.xlsx';
  XLSX.writeFile(wb, fname);
  toast(`Excel "${fname}" berhasil diekspor!`);
}
 
// ── Copy TSV (PUPR format, paste-ready for Google Sheets / Excel) ──
function buildAHSPTSV(a) {
  const pct = n => parseFloat(n || 0);
  const tenagaKerja = a.items.filter(x => x.jenis === 'upah');
  const bahan       = a.items.filter(x => x.jenis === 'material');
  const peralatan   = a.items.filter(x => x.jenis === 'alat');
 
  const sumTK   = tenagaKerja.reduce((s,x) => s + (parseFloat(x.koefisien)||0)*(parseFloat(x.hargaSatuan)||0), 0);
  const sumBhn  = bahan.reduce((s,x)       => s + (parseFloat(x.koefisien)||0)*(parseFloat(x.hargaSatuan)||0), 0);
  const sumAlat = peralatan.reduce((s,x)   => s + (parseFloat(x.koefisien)||0)*(parseFloat(x.hargaSatuan)||0), 0);
  const subtotal = sumTK + sumBhn + sumAlat;
  const ovPct=pct(a.overhead), feePct=pct(a.contractorFee), pphPct=pct(a.pph);
  const ovAmt=(subtotal*(ovPct/100)), feeAmt=((subtotal+ovAmt)*(feePct/100));
  const base=subtotal+ovAmt+feeAmt, pphAmt=base*(pphPct/100), grand=base+pphAmt;
 
  const TAB = '\t';
  const row = (...cells) => cells.join(TAB);
  const lines = [];
 
  lines.push(a.namaPekerjaan);
  lines.push(`Kode: ${a.id}`);
  lines.push('');
  lines.push(row('No','Uraian','Kode','Satuan','Koefisien','Harga Satuan (Rp)','Jumlah Harga (Rp)'));
 
  const addSec = (letter, label, items, sumLabel, sumVal) => {
    lines.push(row(letter, label));
    items.forEach(it => {
      const koe=parseFloat(it.koefisien)||0, h=parseFloat(it.hargaSatuan)||0;
      lines.push(row('', it.item, it.kode||'', it.satuan||'', koe, h, koe*h));
    });
    if(!items.length) lines.push(row('','','','','','',''));
    lines.push(row('', sumLabel, '', '', '', '', sumVal));
  };
 
  addSec('A','Tenaga Kerja',  tenagaKerja, 'Jumlah Harga Tenaga Kerja', sumTK);
  addSec('B','Bahan',         bahan,        'Jumlah Harga Bahan',        sumBhn);
  addSec('C','Peralatan',     peralatan,    'Jumlah Harga Alat',         sumAlat);
 
  lines.push(row('D','Jumlah Harga Tenaga Kerja, Bahan dan Peralatan (A+B+C)','','','','',subtotal));
  lines.push(row('E',`Biaya Umum dan Keuntungan (${ovPct+feePct}%) + PPH (${pphPct}%) × D`,'','','',`${(ovPct+feePct+pphPct).toFixed(2)}% × D`,grand-subtotal));
  lines.push(row('F','Harga Satuan Pekerjaan (D+E)','','','','',grand));
 
  return lines.join('\n');
}
 
function copySelectedTSV(){
  const ids=[...selectedAHSP];
  if(!ids.length){toast('Pilih minimal 1 AHSP dulu!','warning');return;}
  const text = ahspList.filter(a=>ids.includes(a.id)).map(buildAHSPTSV).join('\n\n');
  navigator.clipboard.writeText(text)
    .then(()=>toast('TSV PUPR-format disalin! Paste ke Google Sheets / Excel — langsung rapi.'))
    .catch(()=>toast('Gagal menyalin — browser perlu HTTPS / izin clipboard','error'));
}
function copySingleTSV(id,items){
  const data = items || [ahspList.find(a=>a.id===id)].filter(Boolean);
  if(!data.length)return;
  const text = data.map(buildAHSPTSV).join('\n\n');
  navigator.clipboard.writeText(text)
    .then(()=>toast('TSV PUPR-format disalin! Paste ke Google Sheets / Excel — langsung rapi.'))
    .catch(()=>toast('Gagal menyalin — browser perlu HTTPS / izin clipboard','error'));
}
 
// ── INIT ──────────────────────────────────────────────────────
const _user=QSAuth.requirePerm('ahsp');
if(_user){
  initSidebar('ahsp');
  // Purchasing cannot access AHSP Builder
  if(_user.role==='purchasing'){location.href='dashboard.html';}
  loadAll();
}

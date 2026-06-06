# 🏗️ QS Manager — Construction System v3.0
### Production-ready · Role-based Access · Google Apps Script · Google Spreadsheet

---

## 📁 Struktur Lengkap

```
QS-Manager/
├── frontend/
│   ├── index.html       ← Login + session management
│   ├── dashboard.html   ← Dashboard + chart analitik
│   ├── material.html    ← Material / Upah / Alat / Analisa Harga
│   ├── vendor.html      ← Database Vendor CRUD
│   ├── ahsp.html        ← AHSP Builder + Export Excel/TSV
│   └── users.html       ← User Management (Admin only)
│
└── backend/
    ├── Code.gs          ← Main router doGet/doPost
    ├── Helper.gs        ← Utils: ID gen, sort, cache, dashboard stats, price analysis
    ├── Auth.gs          ← RBAC, session token, user CRUD
    ├── Material.gs      ← CRUD: Material, Upah, Alat
    ├── Vendor.gs        ← CRUD: Vendor
    └── AHSP.gs          ← CRUD: AHSP (dengan Overhead, Fee, PPH)
```

---

## 🚀 SETUP — 8 Langkah

### STEP 1 — Buat Google Spreadsheet

1. Buka [sheets.google.com](https://sheets.google.com) → **Blank**
2. Beri nama: `QS Manager Database v3`
3. Salin **Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

---

### STEP 2 — Buat Google Apps Script Project

1. Buka [script.google.com](https://script.google.com) → **New Project**
2. Beri nama: `QS Manager Backend v3`

---

### STEP 3 — Upload Semua File Backend

Di Apps Script Editor, buat file untuk setiap `.gs`:

| File GAS       | Konten dari                  |
|----------------|------------------------------|
| `Code.gs`      | `backend/Code.gs`            |
| `Helper.gs`    | `backend/Helper.gs`          |
| `Auth.gs`      | `backend/Auth.gs`            |
| `Material.gs`  | `backend/Material.gs`        |
| `Vendor.gs`    | `backend/Vendor.gs`          |
| `AHSP.gs`      | `backend/AHSP.gs`            |

---

### STEP 4 — Konfigurasi Spreadsheet ID

Di `Code.gs`, ganti:
```javascript
// SEBELUM:
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// SESUDAH:
const SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms';
```

---

### STEP 5 — Inisialisasi Database

1. Di Apps Script Editor, pilih fungsi **`setupSpreadsheet`**
2. Klik **▶ Run**
3. Izinkan OAuth → Sheet otomatis terbentuk dengan header

Sheet yang dibuat otomatis:
- `DATABASE_MATERIAL`
- `DATABASE_UPAH`
- `DATABASE_ALAT`
- `DATABASE_VENDOR`
- `AHSP`
- `USERS` (berisi 3 default user)

---

### STEP 6 — Deploy sebagai Web App

1. **Deploy** → **New Deployment** → Type: **Web App**
2. Config:
   - Execute as: **Me**
   - Who has access: **Anyone**
3. Klik **Deploy** → Salin Web App URL:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

---

### STEP 7 — Konfigurasi Frontend

Di **semua 6 file HTML**, ganti `API_URL`:

```javascript
// Cari di setiap file HTML:
const API_URL = 'YOUR_GAS_WEBAPP_URL';

// Ganti dengan URL dari Step 6:
const API_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
```

---

### STEP 8 — Deploy Frontend

**Option A — GitHub Pages (Recommended):**
```bash
git init
git add .
git commit -m "QS Manager v3"
git push origin main
# Enable Pages: Settings → Pages → Branch: main
```

**Option B — Netlify Drop:**
Drag-drop folder `frontend/` ke [netlify.com/drop](https://app.netlify.com/drop)

**Option C — Lokal (testing):**
```bash
cd frontend
python -m http.server 8080
# Buka: http://localhost:8080
```

---

## 🔑 Default Credentials

| Username | Password | Role | Akses |
|---|---|---|---|
| `admin` | `admin123` | Admin | Full access |
| `qs` | `qs123` | QS | Material, Upah, Alat, AHSP |
| `purchasing` | `purchasing123` | Purchasing | Material, Vendor, Analisa Harga |

---

## 🛡️ Role-based Access Control (RBAC)

| Fitur | Admin | QS | Purchasing |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Material (Read) | ✅ | ✅ | ✅ |
| Material (Edit/Add) | ✅ | ✅ | ❌ |
| Material (Delete) | ✅ | ❌ | ❌ |
| Upah | ✅ | ✅ | ❌ |
| Alat | ✅ | ✅ | ❌ |
| Vendor | ✅ | ❌ | ✅ (Read + Edit) |
| Analisa Harga | ✅ | ❌ | ✅ |
| AHSP Builder | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| Export CSV/Excel | ✅ | ✅ | ✅ |
| Export PDF | ✅ | ❌ | ✅ |

---

## 📊 Struktur Google Spreadsheet

| Sheet | Kolom Utama |
|---|---|
| `DATABASE_MATERIAL` | ID, Kategori, Sub Kategori, Nama, Spesifikasi, Satuan, Harga, Vendor, Timestamp |
| `DATABASE_UPAH` | ID, Nama Upah, Satuan, Harga, Timestamp |
| `DATABASE_ALAT` | ID, Nama Alat, Satuan, Harga, **Vendor**, Timestamp |
| `DATABASE_VENDOR` | ID, Nama Vendor, PIC, No Telp, Email, Alamat, Kota, Kategori, Status, Timestamp |
| `AHSP` | ID, Nama Pekerjaan, Jenis, Item, Koefisien, Harga Satuan, Jumlah, Total AHSP, Overhead%, ContractorFee%, PPH%, Grand Total, Timestamp |
| `USERS` | ID, Username, Password, Full Name, Role, Status, Created |

---

## 🔗 API Reference

### GET Actions
```
?action=login&username=X&password=Y   → Auth + token
?action=getMaterials&search=&page=1   → Paginated material list
?action=getUpah                       → Semua upah
?action=getAlat                       → Semua alat + vendor
?action=getVendors&kategori=&status=  → Vendor list
?action=getAHSP&search=               → AHSP grouped by ID
?action=getDashboard                  → Stats + chart data
?action=getCategories                 → Kategori unik
?action=getPriceAnalysis&kategori=    → Analisa harga per material
?action=getUsers                      → Daftar user (admin only)
```

### POST Actions
```json
{ "action": "addMaterial",    "data": { "nama":"...", "harga":1000, "satuan":"kg", "kategori":"Besi" } }
{ "action": "updateMaterial", "data": { "id":"MAT-0001", ... } }
{ "action": "deleteMaterial", "id": "MAT-0001" }
{ "action": "addVendor",      "data": { "namaVendor":"PT X", "pic":"...", "kota":"Jakarta", ... } }
{ "action": "addAHSP",        "data": { "namaPekerjaan":"...", "overhead":10, "contractorFee":5, "pph":2, "items":[...] } }
{ "action": "updateAHSP",     "data": { "id":"AHSP-0001", "items":[...], ... } }
{ "action": "addUser",        "data": { "username":"...", "password":"...", "role":"qs" } }
```

---

## ✨ Fitur v3.0

| Fitur | Status |
|---|---|
| Role-based Access Control (RBAC) | ✅ |
| Session timeout 8 jam | ✅ |
| Dynamic sidebar per role | ✅ |
| Analisa harga & ranking vendor | ✅ |
| PDF export (Analisa Harga) | ✅ jsPDF |
| Excel export AHSP | ✅ SheetJS/XLSX |
| Copy TSV (paste ke Spreadsheet) | ✅ Clipboard API |
| Decimal precision (0.00025) | ✅ step="any" + parseFloat |
| AHSP Overhead + ContractorFee + PPH | ✅ |
| Vendor field pada Alat | ✅ |
| User management (admin) | ✅ |
| Sticky table header | ✅ |
| Search debounce | ✅ |
| Pagination | ✅ |
| Empty state UI | ✅ |
| Export CSV semua tabel | ✅ |
| Demo mode (tanpa GAS) | ✅ |

---

## 🔧 Troubleshooting

| Masalah | Solusi |
|---|---|
| API tidak merespons | Deploy GAS dengan akses **Anyone** |
| Sheet tidak terbentuk | Jalankan `setupSpreadsheet()` di GAS |
| Login gagal (bukan demo) | Cek `API_URL` sudah diisi benar |
| Export PDF gagal | Browser harus support jsPDF CDN (perlu koneksi internet) |
| Copy TSV gagal | Browser harus support Clipboard API (HTTPS required) |
| Decimal kecil jadi 0 | Pastikan input pakai `step="any"` ✅ sudah diterapkan |
| Session tiba-tiba logout | Normal — timeout 8 jam, login kembali |

---

*QS Manager v3.0 — Production-ready Construction Management System*
*Stack: Google Apps Script + Spreadsheet + HTML/CSS/JS (Vanilla)*

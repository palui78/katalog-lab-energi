# CHANGELOG — SITRAS Universal
**Sistem Ketertelusuran Sampel dan Penelitian Laboratorium**

| | |
|---|---|
| Berkas final | `SITRAS_Universal_Semua_Sampel_Semua_Riset_FINAL.html` |
| Berkas asal | `sistem-lab-ketertelusuran_14.html` (schema v1) |
| Cadangan asal | `BACKUP_sistem-lab-ketertelusuran_14_ASLI_2026-08-01.html` |
| Apps Script | `SITRAS_Google_Apps_Script_Universal.gs` |
| Schema | v1 → **v2** (migrasi otomatis, tanpa kehilangan data) |
| Tanggal | 1 Agustus 2026 |
| Baris kode | 2.995 → 5.575 (satu berkas HTML, tanpa proses build) |
| Hasil pengujian | **144 skenario otomatis + 20 skenario migrasi = 164 lulus, 0 gagal** |

---

## 1. Ringkasan audit

Aplikasi lama sudah kuat dari sisi alur (kode → buku induk → QR → penyimpanan →
pengujian → arsip) dan identitas visualnya rapi. Masalah utamanya adalah
**seluruh domain dikunci pada satu riset**: pirolisis tengkawang
(*Shorea stenoptera*). Material, tipe sampel, kategori uji, parameter proses,
generator kode, narasi peta ketertelusuran, contoh data, sampai teks placeholder
semuanya konstanta di dalam kode sumber, sehingga laboratorium tidak dapat
memakai aplikasi untuk sampel atau bidang penelitian lain tanpa mengedit
JavaScript.

Selain itu tidak ada lapisan **proyek penelitian**, sehingga beberapa riset yang
berjalan bersamaan bercampur dalam satu buku induk, dan tidak ada **audit trail**
sebagaimana disyaratkan pengendalian rekaman ISO/IEC 17025 klausul 8.4.

Prinsip yang dipegang selama pengerjaan: **tidak ada fitur lama yang dihapus,
tidak ada data lama yang hilang, dan identitas visual dipertahankan.** Pirolisis
tetap ada — kini sebagai salah satu templat kategori proses, sejajar dengan
pembakaran, gasifikasi, preparasi, dan templat apa pun yang dibuat pengguna.

---

## 2. Masalah yang ditemukan

### 2.1 Hard-code domain (masalah utama)

| # | Temuan pada v1 | Lokasi lama | Penanganan |
|---|---|---|---|
| 1 | `MATERIALS` hanya `SST` dan `TKW` | konstanta baris 323 | → master data `materials`, 11 kategori umum + tambah sendiri |
| 2 | `TYPES` berorientasi biomassa & produk pirolisis | konstanta baris 327 | → master data `sampleTypes`, 16 tipe universal |
| 3 | `TEST_CATS` berorientasi biomassa/bio-oil | konstanta baris 350 | → master data `testCategories`, 24 kategori + parameter dinamis |
| 4 | `PYRO_TEST_CATS` + formulir hanya mengenal suhu/heating rate/holding time | baris 351, 1879–1889 | → templat parameter dinamis 9 tipe field, per kategori |
| 5 | Generator kode tetap `MATERIAL-TIPE-ASAL-TT-NNN` | `genCode()` baris 544 | → templat 12 token yang dapat dikonfigurasi |
| 6 | Sampel induk dibatasi tipe `RAW` dan `SS` | `viewReg()` baris 679 | → semua sampel boleh menjadi induk (dengan proteksi circular) |
| 7 | Dasbor menghitung massa hanya untuk `RAW`/`SS` | baris 606 | → statistik stok universal + ambang "hampir habis" |
| 8 | Peta ketertelusuran bernarasi biomassa→pirolisis→produk | `viewTrace()` baris 991 | → peta generik bercabang bebas + pemeriksaan integritas |
| 9 | Data contoh hanya tengkawang | `seed()` baris 2164 | → contoh multi-bidang (energi + lingkungan, 8 sampel, 6 uji) |
| 10 | Placeholder/label/footer/QR mengandung contoh khusus pirolisis | tersebar | → teks generik; contoh lama menjadi *hasil migrasi*, bukan nilai wajib |
| 11 | Parameter uji disimpan sebagai teks tetap (`params`) | `_saveTest()` baris 2038 | → `paramValues` terstruktur + ringkasan `params` (tetap ada untuk kompatibilitas) |
| 12 | Tidak ada pemisahan data per proyek penelitian | — | → modul Proyek Riset + pemilih proyek di header |
| 13 | `LHI`, `LTO POLIBAN`, `SST`, tahun `2026` sebagai nilai bawaan wajib | `cfgDefaults()` baris 469 | → semua menjadi konfigurasi kosong/bebas |

### 2.2 Cacat teknis yang ditemukan dan diperbaiki

| # | Temuan | Dampak | Perbaikan |
|---|---|---|---|
| 14 | **ID elemen ganda** antara tampilan Registrasi dan modal Edit Sampel (`f_material`, `f_type`, dst.) | `getElementById` mengambil field tampilan, bukan modal → **edit sampel gagal tersimpan** dengan pesan "Material wajib dipilih" padahal sudah terisi | field modal edit memakai prefix `es_`; ditambah uji regresi yang memindai seluruh ID ganda |
| 15 | Kode satuan dipaksa huruf besar oleh normalisasi kode | `mL` → `ML`, `kg` → `KG` sehingga **konversi satuan dan tampilan stok rusak** | kelompok `units` dikecualikan dari normalisasi huruf besar |
| 16 | Perubahan kode sampel saat edit diabaikan | field kode hanya dibaca bila mode "kode manual" aktif; pada modal edit mode itu tidak ada | pembacaan kode dipisahkan antara mode registrasi dan mode edit |
| 17 | `datetime-local` berpresisi menit | pergerakan yang dicatat "sekarang" bisa kalah urutan dari log registrasi yang berbeda beberapa detik → **lokasi terkini salah** | bila waktu yang diisi berada di menit berjalan, dipakai waktu sebenarnya (presisi detik) |
| 18 | `requestAnimationFrame` tidak pernah dipanggil di tab latar | dialog cetak dapat menggantung selamanya | `waitForPrintPaint()` dibalapkan dengan timeout 300 ms |
| 19 | Kelas CSS `.lbl` label cetak A4 bertabrakan dengan `.stat .lbl` | sub-label kartu dasbor ikut mendapat border kotak | kelas label A4 diganti `.lbl-a4` |
| 20 | Pencarian pengujian tidak mencakup nomor aset, data hasil, dan nilai parameter | pencarian global tidak menemukan alat/parameter | daftar field pencarian diperluas |
| 21 | `onclick="App.x('...')"` dengan data pengguna langsung di dalam string | risiko *injection* bila kode/alias mengandung kutip atau tanda kurung | seluruh interaksi memakai `data-act` + event delegation; **tidak ada satu pun `onclick` tersisa** |
| 22 | `save()` dipanggil tanpa `await` pada beberapa alur | urutan penulisan tidak terjamin | seluruh jalur simpan kini `async/await` |
| 23 | Data `localStorage` korup menghentikan aplikasi | aplikasi gagal dimuat | pembacaan dibungkus `try/catch` + fallback memori + peringatan console |
| 24 | Pustaka QR gagal dimuat (luring / CDN diblokir) | label kosong | fallback kotak teks identitas yang tetap terbaca manusia |

---

## 3. Perubahan struktur data

### 3.1 Bentuk basis data

```javascript
DB = {
  projects   : [],   // BARU — proyek penelitian
  samples    : [],   // diperluas (tetap kompatibel v1)
  tests      : [],   // diperluas + paramValues dinamis
  movements  : [],   // diperluas (chain of custody penuh)
  masterData : {     // BARU — seluruh daftar pilihan aplikasi
    materials: [], sampleTypes: [], testCategories: [], testMethods: [],
    units: [], storageConditions: [], locations: [], sampleStatuses: [],
    testStatuses: [], processTemplates: [], customFieldDefinitions: []
  },
  auditLogs  : [],   // BARU — audit trail
  cfg        : {}    // diperluas
};
```

Kunci penyimpanan: `sitras:projects`, `sitras:samples`, `sitras:tests`,
`sitras:movements`, `sitras:masterdata`, `sitras:auditlogs`, `sitras:cfg`,
`sitras:meta` (penanda versi schema), `sitras:backup:v1` (cadangan otomatis).

### 3.2 Field yang ditambahkan (field lama semuanya dipertahankan)

**Sampel** — `projectId`, `name`, `relation`, `batch`, `replicate`, `sampleDate`,
`samplingLoc`, `sampler`, `samplingMethod`, `containers`, `containerType`,
`expiryDate`, `attachments`, `customFields{}`, `archived`, `updatedAt`.

**Pengujian** — `projectId`, `testCode`, `batch`, `replicate`, `designCode`,
`group`, `paramValues{}`, `instrument`, `assetNo`, `massUnit`, `resultData`,
`nonconformity`, `archived`, `updatedAt`. Field `temp`/`rate`/`hold` lama tetap
dibaca dan otomatis dipindahkan ke `paramValues`.

**Pergerakan** — `projectId`, `receiver`, `purpose`, `condition`, `qty`, `unit`,
`actor`, `createdAt`.

**Konfigurasi** — `labCode`, `institution`, `address`, `logoUrl`, `timezone`,
`dateFormat`, `numberFormat`, `activeUser`, `defaultProject`, `codeTemplate`,
`seqPad`, `seqScope`, `lowStockPct`.

### 3.3 Bentuk master data

```javascript
{ id, code, name, desc, active, order, createdAt, updatedAt, ...ekstra }
```
Ekstra per kelompok: `params[]` + `isProcess` (kategori pengujian),
`family` + `factor` (satuan), `color` (status), `target`/`fieldType`/`required`/
`projectId`/`sampleType`/`options` (bidang tambahan), `vars` (templat DOE).

---

## 4. Mekanisme migrasi

Migrasi berjalan **otomatis saat aplikasi pertama kali dibuka** dan dikendalikan
oleh `sitras:meta.version`.

1. Jika `sitras:meta.version >= 2` → data dimuat apa adanya, **migrasi tidak
   diulang**.
2. Jika belum ada meta tetapi ada data v1:
   1. **Cadangan otomatis** seluruh struktur lama ditulis ke `sitras:backup:v1`
      *sebelum* apa pun ditulis ulang.
   2. Dibuat proyek **"Data Lama / Belum Dikelompokkan"** (kode `LAMA`).
   3. Seluruh sampel, pengujian, dan pergerakan tanpa `projectId` ditautkan ke
      proyek tersebut.
   4. Konstanta lama `MATERIALS`, `TYPES`, `TEST_CATS`, `STORAGE_COND` diubah
      menjadi master data. Nilai yang ditemukan pada data tetapi tidak ada di
      daftar bawaan **ikut didaftarkan otomatis**, sehingga tidak ada nilai yang
      "hilang" dari dropdown.
   5. Parameter pirolisis lama (`temp`, `rate`, `hold`) dipindahkan ke
      `paramValues.suhu/laju/tahan` tanpa menghapus field aslinya.
   6. `codeTemplate` diset ke pola lama `{MATERIAL}-{TYPE}-{ORIGIN}-{YY}-{SEQ}`
      dengan lingkup `material-type-year`, **agar nomor urut berlanjut** dan kode
      baru tetap seragam dengan kode yang sudah tercetak.
   7. Konfigurasi lama (nama lab, subjudul, URL QR, footer label, mode & salinan
      label) dipertahankan.
   8. Satu entri audit `migrate` dicatat, dan ringkasan migrasi ditampilkan dalam
      modal saat aplikasi terbuka.
3. Jika tidak ada data sama sekali → basis data kosong + master data bawaan.

**Yang dijamin tidak berubah:** ID sampel, hubungan induk, ID/isi pengujian,
log pergerakan, isi QR, massa/stok, hasil, nomor laporan, dan arsip.

Berkas backup JSON schema lama juga dikenali saat **Restore** dan dimigrasikan
dengan mekanisme yang sama. Payload sinkronisasi schema lama pun ditangani.

---

## 5. Fitur baru

### Modul 1 — Manajemen Proyek Riset
Tab **Proyek Riset** dengan 20 field (kode unik, judul, nama singkat, ketua,
anggota, institusi, laboratorium, pendanaan, nomor kontrak, tahun, tanggal
mulai/selesai, status, bidang, tujuan, deskripsi, kata kunci, catatan, jumlah
sampel/uji, tanggal dibuat/diperbarui). Tambah, lihat, edit, arsipkan, hapus
dengan konfirmasi. Proyek yang masih memiliki data tidak dihapus begitu saja —
tersedia **pemindahan seluruh data ke proyek lain**, atau konfirmasi khusus yang
melepaskan data tanpa menghapusnya. **Pemilih proyek aktif ada di header** dan
menyaring dasbor, buku induk, penyimpanan, pengujian, arsip, dan peta
ketertelusuran sekaligus.

### Modul 2 — Master Data dinamis
Tab **Master Data** dengan 11 kelompok yang bisa ditambah/edit/nonaktifkan/hapus
dari antarmuka. Item yang sedang dipakai **tidak dapat dihapus** (tombol Hapus
nonaktif) — gunakan *Nonaktifkan* agar data historis tetap terbaca. Nilai
nonaktif tetap muncul pada dropdown untuk rekaman lama yang memakainya.

### Modul 3 — Registrasi sampel universal
Formulir 5 tahap (Identitas, Asal & Sampling, Jumlah & Wadah, Penyimpanan,
Tambahan) dengan 30+ field. Dropdown induk **tidak lagi dibatasi tipe tertentu**;
validasi menolak induk = diri sendiri, rantai melingkar, dan induk lintas proyek
kecuali dicentang secara eksplisit.

### Modul 4 — Generator kode fleksibel
Templat 12 token `{PROJECT} {MATERIAL} {TYPE} {ORIGIN} {YYYY} {YY} {MM} {DD}
{BATCH} {RUN} {REPLICATE} {SEQ}`, panjang nomor urut 1–8 digit, 6 pilihan
lingkup penomoran, pratinjau langsung, dan opsi kode manual. Token kosong tidak
meninggalkan tanda pisah ganda. **Mengubah templat tidak pernah mengubah kode
yang sudah tersimpan.**

### Modul 5 — Pengujian & proses universal
Templat parameter dinamis per kategori dengan 9 tipe field (teks, angka, tanggal,
waktu, pilihan, centang, teks panjang, satuan, berkas/tautan). 24 kategori
bawaan lengkap dengan parameternya — termasuk **Kadar air (W0–W10)**, FTIR,
GC-MS, XRD, XRF, SEM-EDS, TGA/DSC, uji tarik/tekan/kekerasan, dan **Pirolisis,
Pembakaran, Gasifikasi, Preparasi** sebagai kategori bertanda *proses*.
Pengurangan stok memperhatikan satuan: bila satuan pemakaian tidak sepadan dan
belum ada faktor konversi, **pengurangan ditolak dengan pesan yang jelas**.

### Modul 6 — Replikasi, batch, dan DOE
Batch/run, replikasi (duplo/triplo), grup eksperimen, dan kode rancangan
(non-DOE, faktorial, RSM-CCD, FCCCD, Taguchi, Box-Behnken — dapat ditambah).
Semuanya opsional dan tidak terbatas pada suhu/heating rate/holding time.

### Modul 7 — Ketertelusuran generik
Peta bercabang bebas, breadcrumb asal-usul, daftar anak & saudara, sampel asal
paling awal, **deteksi orphan record dan rantai melingkar**, filter material/
tipe/status, dan tombol buka detail pada setiap simpul.

### Modul 8 — Chain of custody
10 jenis pergerakan (Masuk, Keluar, Pindah, Dipinjam, Dikembalikan, Dikirim ke
lab eksternal, Diterima kembali, Dimusnahkan, Diarsipkan, Koreksi lokasi) dengan
petugas penyerah & penerima, tujuan, kondisi, jumlah + satuan, dan identitas
pengguna/perangkat. **Lokasi terkini dihitung dari pergerakan valid terakhir.**

### Modul 9 — Dasbor & pencarian
14 metrik mengikuti proyek aktif, 4 distribusi (material, tipe, status, proyek),
aktivitas terbaru gabungan. Pencarian global mencakup kode, alias, nama, proyek,
material, tipe, batch, run, peneliti, lokasi, metode, nomor laporan, nomor aset,
hasil, catatan, dan nilai parameter. Filter gabungan dengan tombol reset.

### Modul 10 — QR & label
Payload QR v2: versi, jenis objek (S/T), kode proyek, ID, dan checksum. Mode web
(tautan) dan mode lokal (identitas ringkas). Label termal 40×40 mm dan lembar A4
dipertahankan, ditambah **label proses/pengujian** (kode uji, sampel, metode,
run/replikasi, QR). Footer label dapat dikonfigurasi.

### Modul 11 — Impor, ekspor, backup, sinkronisasi
Backup/restore JSON seluruh basis data dengan **pratinjau jumlah data** sebelum
dieksekusi, mode merge/replace, ekspor per proyek, ekspor master data, ekspor
audit log, template CSV kosong untuk 5 jenis data, validasi header CSV, laporan
baris gagal beserta nomor barisnya, anti-duplikasi berdasarkan ID, normalisasi
desimal titik & koma, penanganan UTF-8 BOM.

### Modul 12 — Audit trail
Setiap create/update/delete/archive/restore/import/sinkron/perubahan status/
stok/lokasi/hubungan induk dicatat dengan waktu, entitas, ID, aksi, ringkasan
sebelum→sesudah, pengguna, dan alasan. **Tidak dapat diedit** — koreksi menjadi
entri baru.

### Modul 13 — Edit & hapus aman
Edit tersedia untuk sampel, proyek, pengujian, pergerakan, dan master data.
Soft delete (arsip) diutamakan; penghapusan permanen memerlukan konfirmasi kedua
dan **tidak meninggalkan rekaman yatim** — sampel turunan ditautkan ulang ke
induk di atasnya.

### Modul 14 — Konfigurasi & branding
Nama/kode laboratorium, institusi, alamat, logo (URL aman atau data URL), zona
waktu, format tanggal & angka, pengguna aktif, proyek default, ambang stok
hampir habis, templat kode, footer label, mode label, auto print.

### Modul 15 — UI/UX
Identitas visual dipertahankan sepenuhnya. Tambahan: pemilih proyek di header,
breadcrumb, form bertahap, tooltip istilah teknis, indikator field wajib, pesan
validasi di dekat field, konfirmasi aksi berisiko, toast, empty state generik,
aksesibilitas keyboard, label form yang benar, fokus & jebakan fokus modal,
tutup dengan Escape, tampilan desktop dan mobile.

### Modul 16 — Keamanan & kualitas kode
Escaping menyeluruh, tidak ada `onclick` berisi data pengguna, validasi URL,
validasi impor, proteksi circular & duplikasi ID, penjadwalan sinkron anti balapan,
penanganan konflik GitHub 409, perhitungan stok yang benar pada tambah/edit/hapus,
ketahanan terhadap localStorage korup, fallback QR luring, dan kode dipisahkan
dengan komentar per domain (15 bagian).

---

## 6. Cara penggunaan

### Memulai
1. Buka `SITRAS_Universal_Semua_Sampel_Semua_Riset_FINAL.html` (klik dua kali,
   atau lewat localhost/Laragon/GitHub Pages).
2. Buka **Data & Sinkron → Identitas & Branding**, isi nama laboratorium,
   institusi, dan pengguna aktif. Simpan.
3. Buka tab **Proyek Riset → Tambah proyek**.
4. Buka tab **Registrasi**, daftarkan sampel pertama.

Untuk mencoba seluruh alur tanpa data sungguhan:
**Data & Sinkron → Muat contoh data multi-bidang** (2 proyek, 8 sampel dari
6 jenis material, 6 pengujian termasuk pirolisis, pH, kadar air, dan uji unsur).

### Membuat proyek
Tab **Proyek Riset → Tambah proyek**. Kode proyek wajib unik dan menjadi token
`{PROJECT}` pada kode sampel. Setelah dibuat, pilih proyek pada **pemilih di
header** agar seluruh tampilan tersaring. Pilih *Semua Proyek* untuk melihat
gabungan.

### Menambahkan material, tipe sampel, dan metode — tanpa mengubah kode sumber
1. Tab **Master Data**.
2. Pilih kelompok (Material, Tipe sampel, Kategori pengujian, Metode/standar,
   Satuan, Kondisi penyimpanan, Lokasi, Status sampel, Status pengujian,
   Templat proses/DOE, Bidang tambahan).
3. **Tambah item** → isi kode singkat unik + nama → Simpan.
4. Item langsung tersedia di seluruh dropdown aplikasi.

**Menambah kategori pengujian dengan parameter sendiri:** pilih kelompok
*Kategori pengujian* → Tambah item → centang *proses/eksperimen* bila kategori
ini adalah proses → klik **+ Tambah parameter** untuk setiap parameter (kunci,
label, tipe, satuan, dan daftar pilihan bila tipenya *Pilihan*). Formulir
pengujian akan menyesuaikan otomatis.

**Menambah satuan baru:** isi *keluarga satuan* (mis. `massa`, `volume`) dan
*faktor* terhadap satuan dasar keluarga tersebut, agar konversi stok lintas
satuan dapat dihitung.

### Mencatat pengujian atau proses
Tab **Pengujian → Catat pengujian**. Pilih sampel dan kategori; parameter muncul
otomatis sesuai templat. Isi jumlah terpakai beserta satuannya — stok sampel
berkurang otomatis, dengan konversi bila satuannya sekeluarga. Bila tidak
sepadan, aplikasi menolak dan menjelaskan alasannya.

### Mencetak label
- Satu sampel: buka detail sampel → **Cetak label**.
- Banyak sampel: **Cetak label QR** di dasbor/buku induk → pilih sampel →
  *Cetak termal 40×40* atau *Lembar A4*.
- Label proses/pengujian: buka pengujian → **Cetak label proses**.

Setelan printer termal: ukuran kertas **40×40 mm**, **Margins → None**,
**Headers and footers** dimatikan, **Scale 100 %** (jangan *Fit to page*).

### Backup dan restore
- **Backup:** Data & Sinkron → *Backup JSON lengkap*. Berkas memuat proyek,
  sampel, pengujian, pergerakan, master data, audit log, dan konfigurasi
  bersama. **Token GitHub/Apps Script tidak pernah ikut.**
  Tersedia juga *Ekspor proyek aktif*, *Ekspor master data*, dan *Ekspor audit log*.
- **Restore:** Data & Sinkron → *Restore dari berkas JSON* → pilih berkas →
  aplikasi menampilkan **pratinjau jumlah data** → pilih **Tambah/merge**
  (anti-duplikasi berdasarkan ID) atau **Ganti/replace**.
- Berkas backup dari SITRAS versi lama otomatis dikenali dan dimigrasikan.

Disarankan mengunduh backup JSON **sebelum** reset, restore, atau impor mode
replace.

### Impor CSV
Data & Sinkron → *Unduh template kosong* untuk jenis data yang diinginkan → isi
di Excel/Google Sheets → *Impor berkas CSV* dengan memilih jenis data dan mode.
Header divalidasi lebih dulu; baris yang gagal dilaporkan lengkap dengan nomor
barisnya. Angka menerima titik maupun koma desimal.

---

## 7. Daftar pengujian yang dilakukan

Pengujian dijalankan otomatis di **Chrome headless** terhadap berkas final yang
sesungguhnya (bukan salinan yang disederhanakan), dengan harness yang menggerakkan
formulir sebagaimana pengguna: mengisi field, memanggil aksi, lalu memeriksa
state basis data dan DOM hasilnya.

### 7.1 Suite utama — 144 skenario, seluruhnya lulus

| Skenario wajib | Uji | Hasil |
|---|---|---|
| 1. Membuka aplikasi tanpa data | T01–T01d | lulus |
| 2. Migrasi data schema lama | T02–T02l (12 uji) | lulus |
| 3. Membuat dua proyek penelitian | T03–T03c | lulus |
| 4. Material & tipe sampel baru dari antarmuka | T04–T04c | lulus |
| 5. Registrasi sampel tanah | T05–T05c | lulus |
| 6. Registrasi sampel air | T06 | lulus |
| 7. Registrasi biomassa tengkawang | T07 | lulus |
| 8. Produk bio-oil sebagai turunan | T08, T08b | lulus |
| 9. Subsampel & hubungan induk | T09 | lulus |
| 10. Mencegah circular parent | T10–T10d | lulus |
| 11. Membuat metode/kategori uji baru | T11–T11c | lulus |
| 12. Mencatat FTIR | T12, T12b | lulus |
| 13. Mencatat kadar air W0–W10 | T13, T13b | lulus |
| 14. Mencatat proses pirolisis | T14–T14d | lulus |
| 15. Uji mekanik non-pirolisis | T15 | lulus |
| 16. Mengurangi stok secara benar | T16 | lulus |
| 17. Menolak stok dengan satuan tidak kompatibel | T17–T17e | lulus |
| 18. Memindahkan lokasi sampel | T18–T18c | lulus |
| 19. Mengedit sampel | T19–T19c | lulus |
| 20. Edit pengujian tanpa mengurangi stok dua kali | T20, T20b | lulus |
| 21. Hapus pengujian & pengembalian stok | T21, T21b | lulus |
| 22. Filter berdasarkan proyek | T22, T22b | lulus |
| 23. Pencarian global & filter gabungan | T23–T23h | lulus |
| 24. Cetak QR termal 40 × 40 mm | T24–T24d | lulus |
| 25. Cetak label A4 & label proses | T25–T25e | lulus |
| 26. Ekspor CSV (6 jenis + template) | T26–T26g | lulus |
| 27. Impor CSV | T27–T27f | lulus |
| 28. Backup JSON | T28–T28e | lulus |
| 29. Restore JSON | T29–T29e | lulus |
| 30. Sinkronisasi payload schema baru | T30–T30e | lulus |
| 31. Membuka aplikasi saat offline | T31, T31b | lulus |
| 32. Tampilan mobile | T32 | lulus |
| 33. Perlindungan input HTML/script | T33–T33f | lulus |
| 34. Tidak ada error di browser console | T34 | lulus |

Uji tambahan di luar daftar wajib: arsip & pemulihan (T35), integritas
referensial saat hapus permanen (T36), audit trail (T37), proteksi master data
terpakai (T38), generator kode (T39), ketertelusuran (T40), dan rendering
seluruh 12 tampilan + 11 kelompok master data (T41).

### 7.2 Suite migrasi dua fase — 20 skenario, seluruhnya lulus

Dijalankan melalui `http://localhost` dengan profil peramban persisten: fase 1
menulis data SITRAS v1 asli ke `localStorage` (3 sampel termasuk produk bio-oil
tipe `BO`, 2 pengujian termasuk *Pyrolysis (RSM-CCD run)*, 1 log, konfigurasi
lama lengkap dengan URL QR `katalog-lab-energi`), fase 2 membuka aplikasi final
dan memverifikasi hasil migrasi.

Diverifikasi: penanda schema menjadi v2 · cadangan `sitras:backup:v1` terbentuk ·
3 sampel terbaca · ID tidak berubah · proyek default terpasang · pengujian &
nomor laporan utuh · `temp/rate/hold` pindah ke `paramValues` · log terbaca ·
hubungan induk utuh · material/tipe lama menjadi master data · konfigurasi lama
dipertahankan · templat kode lama dipakai · kode baru melanjutkan pola lama ·
QR lama tetap berupa tautan · audit mencatat migrasi · massa/stok utuh · mode &
salinan label lama dipertahankan · tipe `BO` tetap dikenali · migrasi tidak
diulang pada pemuatan berikutnya.

### 7.3 Verifikasi tambahan

- Berkas final dibuka langsung sebagai `file://` — **0 galat console**, tampilan
  ter-render, tidak ada ketergantungan jaringan yang wajib.
- Berkas dibuka lewat `http://localhost` — sama.
- Tangkapan layar diperiksa pada lebar 1400 px (desktop) dan 489 px (mobile):
  tidak ada *horizontal overflow* pada halaman; tabel lebar bergulir di dalam
  wadahnya sendiri.
- Pemindaian ID ganda pada seluruh dokumen (tampilan + modal terbuka): bersih.
- Pemindaian atribut `onclick` pada markup aplikasi: nihil.

---

## 8. Keterbatasan yang masih ada

1. **Aplikasi tetap tanpa autentikasi.** Field "Pengguna/PJ aktif" bersifat
   deklaratif, bukan login. Audit trail mencatat nama yang diisi, bukan identitas
   terverifikasi. Untuk kebutuhan akreditasi penuh, diperlukan lapisan server.
2. **Audit trail dibatasi 4.000 entri terakhir** agar `localStorage` tidak penuh.
   Entri lama terpotong — ekspor audit log secara berkala bila diperlukan.
3. **Sinkronisasi bersifat "last write wins".** Konflik GitHub 409 dideteksi dan
   dilaporkan, tetapi belum ada penggabungan otomatis per-record antar perangkat.
4. **Google Sheets menyimpan cermin data, bukan sumber kebenaran.** Setiap
   sinkron menulis ulang isi sheet.
5. **Konversi satuan hanya dalam satu keluarga** (massa↔massa, volume↔volume).
   Konversi massa↔volume memerlukan densitas dan sengaja tidak diotomatiskan.
6. **Custom field belum tersedia untuk pengujian dan proyek.** Definisi field
   sudah menyediakan pilihan target `test`/`project`, tetapi form yang membacanya
   baru diterapkan pada sampel.
7. **Lampiran berupa rujukan (nama berkas/tautan), bukan unggahan.** Berkas tidak
   disimpan di dalam aplikasi.
8. **Belum ada perhitungan otomatis dari parameter** (mis. kadar air dari
   W0–W10, atau yield dari massa). Nilai hasil masih diisi manual pada field
   *Hasil*. Ini disengaja agar tidak mengasumsikan rumus yang berbeda antar
   metode.
9. **Format tanggal & angka pada konfigurasi bersifat informatif.** Tampilan
   masih memakai lokal `id-ID`; field tersebut belum mengubah rendering.
10. **Pencetakan bergantung dialog printer peramban.** Ukuran kertas 40×40 mm
    tetap harus dipilih di driver printer.
11. **Zona waktu disimpan sebagai konfigurasi**, tetapi seluruh cap waktu
    disimpan dalam UTC ISO dan ditampilkan menurut zona waktu perangkat.
12. **Pemilih proyek pada modal pengujian** menyaring daftar sampel menurut
    proyek sampel yang dipilih; memindahkan pengujian antar proyek dilakukan
    dengan mengubah proyek sampelnya.

---

## 9. Berkas Google Apps Script

`SITRAS_Google_Apps_Script_Universal.gs` menggantikan `google-sheets-sync.gs`
tanpa merusak endpoint lama:

- Nama sheet lama dipertahankan; kolom lama tetap pada urutan yang sama, kolom
  baru ditambahkan di sebelah kanannya.
- Sheet baru: **Proyek**, **Master Data**, **Audit Log** (dibuat otomatis).
- `doPost` menerima payload schema v1 maupun v2 dan juga payload backup
  `sitras-db`.
- `doGet?action=export` mengembalikan schema `sitras-sheet-sync` versi 2 yang
  tetap memuat kunci `samples`/`tests`/`movements`/`sharedConfig`, sehingga
  aplikasi versi lama masih dapat membacanya.
- Kolom *Suhu / Laju / Waktu Tahan* pada sheet Pengujian tetap terisi otomatis
  dari `paramValues` kategori pirolisis.
- Token tidak pernah ditulis ke spreadsheet.

Cara deployment dan cara migrasi tanpa mengubah URL `/exec` dijelaskan di bagian
komentar teratas berkas tersebut.

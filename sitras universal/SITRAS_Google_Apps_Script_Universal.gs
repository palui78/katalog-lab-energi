/*
  ============================================================
  SITRAS UNIVERSAL - Google Sheets Sync Web App (schema v2)
  ============================================================

  Berkas ini adalah pengganti "google-sheets-sync.gs" (schema v1).

  KOMPATIBILITAS - endpoint lama TIDAK dirusak:
  - Nama sheet lama dipertahankan: "Buku Induk", "Pengujian",
    "Log Penyimpanan", "SITRAS Meta".
  - Urutan kolom lama dipertahankan; kolom baru DITAMBAHKAN di
    sebelah kanan sehingga rumus/kolom bantu lama tetap valid.
  - doPost menerima payload schema v1 (hanya samples/tests/movements)
    maupun v2 (projects/samples/tests/movements/masterData/auditLogs).
  - doGet?action=export mengembalikan schema "sitras-sheet-sync"
    version 2. SITRAS Universal membaca v1 maupun v2; aplikasi SITRAS
    versi lama tetap dapat membaca payload ini karena kunci
    samples/tests/movements/sharedConfig tetap ada.

  CARA PASANG (deployment baru - disarankan):
  1. Buka https://script.google.com lalu buat project baru.
  2. Hapus isi Code.gs, tempel seluruh isi berkas ini.
  3. Isi SPREADSHEET_ID di bawah dengan ID spreadsheet Anda
     (bagian URL di antara /d/ dan /edit). Kosongkan bila script ini
     "bound" langsung ke spreadsheet.
  4. Isi WRITE_TOKEN bila ingin membatasi siapa yang boleh mengirim data
     (nilai yang sama diisikan di SITRAS -> Data & Sinkron -> Token sinkron).
     JANGAN menaruh token di berkas yang dibagikan publik.
  5. Deploy -> New deployment -> Web app
       Execute as       : Me
       Who has access   : Anyone with the link
  6. Salin URL yang berakhiran /exec ke
     SITRAS -> Data & Sinkron -> Google Sheets Live Sync -> URL Web App.
  7. Klik "Tes koneksi", lalu "Kirim".

  CARA MIGRASI DARI SCRIPT LAMA (mempertahankan URL /exec yang sudah
  tersebar di QR/dokumen):
  1. Buka project Apps Script yang lama.
  2. Ganti seluruh isi berkas dengan isi berkas ini.
  3. Salin kembali nilai SPREADSHEET_ID dan WRITE_TOKEN yang lama.
  4. Deploy -> Manage deployments -> pilih deployment aktif -> Edit
     (ikon pensil) -> Version: New version -> Deploy.
     URL /exec TIDAK berubah, sehingga tautan lama tetap hidup.
  5. Sheet baru ("Proyek", "Master Data", "Audit Log") dibuat otomatis
     saat sinkron pertama. Data lama pada sheet lama tidak dihapus,
     hanya ditimpa oleh isi terbaru dari aplikasi seperti sebelumnya.

  CATATAN: skrip ini menulis ulang isi sheet setiap sinkron (mirror dari
  aplikasi). Jadikan aplikasi sebagai sumber kebenaran, dan gunakan
  Backup JSON di aplikasi sebagai cadangan utama.
  ============================================================
*/

/* Isi ID spreadsheet Anda di sini (bagian URL di antara /d/ dan /edit).
   Formatnya berupa deret ~44 karakter huruf/angka, contoh bentuknya:
   '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEf'
   JANGAN menaruh ID spreadsheet berisi data penelitian pada repository publik. */
const SPREADSHEET_ID = '';
/* Token opsional. Kosongkan bila tidak dipakai.                       */
const WRITE_TOKEN = '';

const SYNC_SCHEMA = 'sitras-sheet-sync';
const SYNC_VERSION = 2;

const SHEET_NAMES = {
  projects: 'Proyek',
  samples: 'Buku Induk',
  tests: 'Pengujian',
  movements: 'Log Penyimpanan',
  masterData: 'Master Data',
  auditLogs: 'Audit Log',
  meta: 'SITRAS Meta',
};

/* ---------- Definisi kolom ----------
   PENTING: kolom lama (schema v1) berada di urutan paling depan dan
   tidak boleh dipindah. Kolom baru selalu ditambahkan di bawahnya. */

const PROJECT_COLUMNS = [
  ['id', 'ID'],
  ['code', 'Kode Proyek'],
  ['title', 'Judul Penelitian'],
  ['shortName', 'Nama Singkat'],
  ['lead', 'Ketua Peneliti'],
  ['members', 'Anggota'],
  ['institution', 'Institusi / Unit'],
  ['lab', 'Laboratorium'],
  ['funding', 'Sumber Pendanaan'],
  ['contractNo', 'Nomor Kontrak'],
  ['year', 'Tahun'],
  ['dateStart', 'Tgl Mulai'],
  ['dateEnd', 'Tgl Selesai'],
  ['status', 'Status'],
  ['field', 'Bidang Penelitian'],
  ['objective', 'Tujuan'],
  ['description', 'Deskripsi'],
  ['keywords', 'Kata Kunci'],
  ['notes', 'Catatan'],
  ['archived', 'Diarsipkan'],
  ['sampleCount', 'Jumlah Sampel'],
  ['testCount', 'Jumlah Pengujian'],
  ['createdAt', 'Created At'],
  ['updatedAt', 'Updated At'],
];

const SAMPLE_COLUMNS = [
  /* --- kolom warisan v1 (urutan dipertahankan) --- */
  ['id', 'Kode'],
  ['alias', 'Alias'],
  ['material', 'Material'],
  ['type', 'Tipe'],
  ['origin', 'Asal'],
  ['regDate', 'Tgl Registrasi'],
  ['source', 'Sumber / Asal Lokasi'],
  ['parent', 'Induk'],
  ['run', 'Run'],
  ['massInitial', 'Massa Awal'],
  ['massCurrent', 'Massa Kini'],
  ['unit', 'Satuan'],
  ['moisture', 'Kadar Air %'],
  ['cond', 'Kondisi Sampel'],
  ['custodian', 'Custodian'],
  ['loc', 'Lokasi Simpan'],
  ['storecond', 'Kondisi Simpan'],
  ['status', 'Status'],
  ['notes', 'Catatan'],
  ['createdAt', 'Created At'],
  /* --- kolom baru v2 --- */
  ['projectId', 'ID Proyek'],
  ['projectCode', 'Kode Proyek'],
  ['name', 'Nama Sampel'],
  ['relation', 'Hubungan Induk'],
  ['batch', 'Batch / Lot'],
  ['replicate', 'Replikasi'],
  ['sampleDate', 'Tgl Pengambilan'],
  ['samplingLoc', 'Lokasi Pengambilan'],
  ['sampler', 'Pengambil Sampel'],
  ['samplingMethod', 'Metode Sampling'],
  ['containers', 'Jumlah Wadah'],
  ['containerType', 'Jenis Wadah'],
  ['expiryDate', 'Kedaluwarsa / Retensi'],
  ['attachments', 'Lampiran'],
  ['customFieldsJson', 'Custom Fields (JSON)'],
  ['archived', 'Diarsipkan'],
  ['updatedAt', 'Updated At'],
];

const TEST_COLUMNS = [
  /* --- kolom warisan v1 --- */
  ['id', 'ID'],
  ['sampleCode', 'Kode Sampel'],
  ['category', 'Kategori Uji'],
  ['params', 'Parameter'],
  ['method', 'Metode'],
  ['lab', 'Laboratorium'],
  ['analyst', 'Analis'],
  ['status', 'Status'],
  ['dateStart', 'Tgl Mulai'],
  ['dateEnd', 'Tgl Selesai'],
  ['massUsed', 'Massa Dipakai'],
  ['certNo', 'No Laporan / Sertifikat'],
  ['result', 'Ringkasan Hasil'],
  ['fileRef', 'Rujukan Berkas'],
  ['temp', 'Suhu'],
  ['rate', 'Laju'],
  ['hold', 'Waktu Tahan'],
  ['createdAt', 'Created At'],
  /* --- kolom baru v2 --- */
  ['projectId', 'ID Proyek'],
  ['projectCode', 'Kode Proyek'],
  ['testCode', 'Kode Pengujian'],
  ['batch', 'Batch / Run'],
  ['replicate', 'Replikasi'],
  ['designCode', 'Kode Rancangan (DOE)'],
  ['group', 'Grup Eksperimen'],
  ['paramValuesJson', 'Parameter (JSON)'],
  ['instrument', 'Instrumen'],
  ['assetNo', 'No Aset Alat'],
  ['massUnit', 'Satuan Pemakaian'],
  ['resultData', 'Data Hasil Terstruktur'],
  ['nonconformity', 'Catatan Ketidaksesuaian'],
  ['processCode', 'Kode Proses'],
  ['qrData', 'QR Data'],
  ['archived', 'Diarsipkan'],
  ['updatedAt', 'Updated At'],
];

const MOVEMENT_COLUMNS = [
  /* --- kolom warisan v1 --- */
  ['id', 'ID'],
  ['sampleCode', 'Kode Sampel'],
  ['action', 'Aksi'],
  ['fromLocation', 'Dari Lokasi'],
  ['toLocation', 'Ke Lokasi'],
  ['datetime', 'Tanggal Waktu'],
  ['person', 'Oleh'],
  ['note', 'Catatan'],
  /* --- kolom baru v2 --- */
  ['projectId', 'ID Proyek'],
  ['projectCode', 'Kode Proyek'],
  ['receiver', 'Petugas Penerima'],
  ['purpose', 'Tujuan'],
  ['condition', 'Kondisi Sampel'],
  ['qty', 'Jumlah Dipindah'],
  ['unit', 'Satuan'],
  ['actor', 'Pengguna / Perangkat'],
  ['createdAt', 'Created At'],
];

const MASTER_COLUMNS = [
  ['group', 'Kelompok'],
  ['id', 'ID'],
  ['code', 'Kode'],
  ['name', 'Nama'],
  ['desc', 'Deskripsi'],
  ['active', 'Aktif'],
  ['order', 'Urutan'],
  ['extraJson', 'Ekstra (JSON)'],
  ['createdAt', 'Created At'],
  ['updatedAt', 'Updated At'],
];

const AUDIT_COLUMNS = [
  ['id', 'ID'],
  ['at', 'Waktu'],
  ['entity', 'Entitas'],
  ['entityId', 'ID Entitas'],
  ['action', 'Aksi'],
  ['summary', 'Ringkasan Perubahan'],
  ['user', 'Pengguna'],
  ['reason', 'Alasan'],
];

const MASTER_GROUPS = [
  'materials', 'sampleTypes', 'testCategories', 'testMethods', 'units',
  'storageConditions', 'locations', 'sampleStatuses', 'testStatuses',
  'processTemplates', 'customFieldDefinitions',
];

/* ============================================================
   ENDPOINT
   ============================================================ */
function doGet(e) {
  try {
    var action = String((e && e.parameter && e.parameter.action) || '').toLowerCase();
    if (action === 'export') {
      validateReadRequest_(e);
      return jsonOutput_(exportDatabase_());
    }
    return jsonOutput_({
      ok: true,
      app: 'SITRAS Universal Google Sheets Sync',
      schema: SYNC_SCHEMA,
      version: SYNC_VERSION,
      spreadsheet: getSpreadsheet_().getName(),
      sheetNames: SHEET_NAMES,
    });
  } catch (err) {
    return jsonOutput_({ ok: false, message: errMessage_(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var payload = parsePayload_(e);
    validatePayload_(payload);
    writeDatabase_(payload);
    return jsonOutput_({
      ok: true,
      message: 'Data SITRAS berhasil disimpan ke Google Sheets',
      summary: summaryOf_(payload),
      schema: SYNC_SCHEMA,
      version: SYNC_VERSION,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return jsonOutput_({ ok: false, message: errMessage_(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

/* ============================================================
   VALIDASI
   ============================================================ */
function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('Body POST tidak ditemukan.');
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error('Body POST bukan JSON yang valid.');
  }
}

function validatePayload_(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload kosong atau tidak valid.');
  /* Menerima schema sinkron v1/v2 maupun payload backup "sitras-db". */
  var schema = String(payload.schema || '');
  if (schema !== SYNC_SCHEMA && schema !== 'sitras-db') {
    throw new Error('Schema sinkron tidak dikenali: ' + schema);
  }
  if (WRITE_TOKEN && String(payload.token || '') !== WRITE_TOKEN) {
    throw new Error('Token sinkron Google Sheets tidak cocok.');
  }
}

function validateReadRequest_(e) {
  if (WRITE_TOKEN && String((e && e.parameter && e.parameter.token) || '') !== WRITE_TOKEN) {
    throw new Error('Token sinkron Google Sheets tidak cocok.');
  }
}

/* ============================================================
   TULIS
   ============================================================ */
function writeDatabase_(payload) {
  var ss = getSpreadsheet_();
  var projects = asArray_(payload.projects);
  var projectMap = {};
  projects.forEach(function (p) { if (p && p.id) projectMap[p.id] = p.code || ''; });

  writeTableSheet_(ss, SHEET_NAMES.projects, PROJECT_COLUMNS, projects.map(flattenProject_));
  writeTableSheet_(ss, SHEET_NAMES.samples, SAMPLE_COLUMNS,
    asArray_(payload.samples).map(function (s) { return flattenSample_(s, projectMap); }));
  writeTableSheet_(ss, SHEET_NAMES.tests, TEST_COLUMNS,
    asArray_(payload.tests).map(function (t) { return flattenTest_(t, projectMap); }));
  writeTableSheet_(ss, SHEET_NAMES.movements, MOVEMENT_COLUMNS,
    asArray_(payload.movements).map(function (m) { return flattenMovement_(m, projectMap); }));
  writeTableSheet_(ss, SHEET_NAMES.masterData, MASTER_COLUMNS, flattenMasterData_(payload.masterData));
  writeTableSheet_(ss, SHEET_NAMES.auditLogs, AUDIT_COLUMNS, asArray_(payload.auditLogs));
  writeMetaSheet_(ss, payload);
}

function flattenProject_(p) {
  var out = {};
  PROJECT_COLUMNS.forEach(function (c) { out[c[0]] = p ? p[c[0]] : ''; });
  return out;
}
function flattenSample_(s, projectMap) {
  var out = {};
  SAMPLE_COLUMNS.forEach(function (c) { out[c[0]] = s ? s[c[0]] : ''; });
  out.projectCode = (s && projectMap[s.projectId]) || '';
  out.customFieldsJson = (s && s.customFields) ? JSON.stringify(s.customFields) : '';
  return out;
}
function flattenTest_(t, projectMap) {
  var out = {};
  TEST_COLUMNS.forEach(function (c) { out[c[0]] = t ? t[c[0]] : ''; });
  out.projectCode = (t && projectMap[t.projectId]) || '';
  out.paramValuesJson = (t && t.paramValues) ? JSON.stringify(t.paramValues) : '';
  /* Kompatibilitas v1: kolom Suhu/Laju/Waktu Tahan tetap diisi bila ada. */
  if (t && t.paramValues) {
    if (!out.temp && t.paramValues.suhu != null) out.temp = t.paramValues.suhu;
    if (!out.rate && t.paramValues.laju != null) out.rate = t.paramValues.laju;
    if (!out.hold && t.paramValues.tahan != null) out.hold = t.paramValues.tahan;
  }
  return out;
}
function flattenMovement_(m, projectMap) {
  var out = {};
  MOVEMENT_COLUMNS.forEach(function (c) { out[c[0]] = m ? m[c[0]] : ''; });
  out.projectCode = (m && projectMap[m.projectId]) || '';
  return out;
}
function flattenMasterData_(masterData) {
  if (!masterData || typeof masterData !== 'object') return [];
  var rows = [];
  MASTER_GROUPS.forEach(function (group) {
    asArray_(masterData[group]).forEach(function (item) {
      if (!item) return;
      var extra = {};
      Object.keys(item).forEach(function (k) {
        if (['id', 'code', 'name', 'desc', 'active', 'order', 'createdAt', 'updatedAt'].indexOf(k) < 0) {
          extra[k] = item[k];
        }
      });
      rows.push({
        group: group,
        id: item.id || '',
        code: item.code || '',
        name: item.name || '',
        desc: item.desc || '',
        active: item.active === false ? 'tidak' : 'ya',
        order: item.order || 0,
        extraJson: Object.keys(extra).length ? JSON.stringify(extra) : '',
        createdAt: item.createdAt || '',
        updatedAt: item.updatedAt || '',
      });
    });
  });
  return rows;
}

/* ============================================================
   BACA (export)
   ============================================================ */
function exportDatabase_() {
  var ss = getSpreadsheet_();
  var projects = readTableSheet_(ss, SHEET_NAMES.projects, PROJECT_COLUMNS);
  var samples = readTableSheet_(ss, SHEET_NAMES.samples, SAMPLE_COLUMNS).map(unflattenSample_);
  var tests = readTableSheet_(ss, SHEET_NAMES.tests, TEST_COLUMNS).map(unflattenTest_);
  var movements = readTableSheet_(ss, SHEET_NAMES.movements, MOVEMENT_COLUMNS);
  var masterData = readMasterData_(ss);
  var auditLogs = readTableSheet_(ss, SHEET_NAMES.auditLogs, AUDIT_COLUMNS);
  var sharedConfig = readMetaConfig_(ss);

  return {
    ok: true,
    schema: SYNC_SCHEMA,
    version: SYNC_VERSION,
    schemaVersion: SYNC_VERSION,
    app: 'SITRAS Universal',
    updatedAt: new Date().toISOString(),
    sharedConfig: sharedConfig,
    projects: projects,
    samples: samples,
    tests: tests,
    movements: movements,
    masterData: masterData,
    auditLogs: auditLogs,
    summary: count_(projects) + ' proyek | ' + count_(samples) + ' sampel | ' +
             count_(tests) + ' uji | ' + count_(movements) + ' log',
  };
}

function unflattenSample_(row) {
  row.customFields = parseJson_(row.customFieldsJson);
  delete row.customFieldsJson;
  delete row.projectCode;
  row.archived = String(row.archived).toLowerCase() === 'true' || row.archived === true;
  return row;
}
function unflattenTest_(row) {
  row.paramValues = parseJson_(row.paramValuesJson);
  delete row.paramValuesJson;
  delete row.projectCode;
  row.archived = String(row.archived).toLowerCase() === 'true' || row.archived === true;
  return row;
}
function readMasterData_(ss) {
  var rows = readTableSheet_(ss, SHEET_NAMES.masterData, MASTER_COLUMNS);
  if (!rows.length) return null;   // null -> aplikasi memakai master data lokal
  var out = {};
  MASTER_GROUPS.forEach(function (g) { out[g] = []; });
  rows.forEach(function (r) {
    var group = String(r.group || '').trim();
    if (MASTER_GROUPS.indexOf(group) < 0) return;
    var item = {
      id: r.id || '',
      code: r.code || '',
      name: r.name || '',
      desc: r.desc || '',
      active: String(r.active).toLowerCase() !== 'tidak',
      order: Number(r.order) || 0,
      createdAt: r.createdAt || '',
      updatedAt: r.updatedAt || '',
    };
    var extra = parseJson_(r.extraJson);
    Object.keys(extra).forEach(function (k) { item[k] = extra[k]; });
    out[group].push(item);
  });
  return out;
}

/* ============================================================
   UTILITAS SHEET
   ============================================================ */
function getSpreadsheet_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('SPREADSHEET_ID belum diisi dan project ini tidak bound ke spreadsheet.');
  return active;
}

function writeTableSheet_(ss, sheetName, columns, rows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  var header = columns.map(function (col) { return col[1]; });
  var dataRows = (rows || []).map(function (row) {
    return columns.map(function (col) { return normalizeCell_(row ? row[col[0]] : ''); });
  });
  var values = [header].concat(dataRows);

  if (sheet.getMaxColumns() < header.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), header.length - sheet.getMaxColumns());
  }
  if (sheet.getMaxRows() < values.length) {
    sheet.insertRowsAfter(sheet.getMaxRows(), values.length - sheet.getMaxRows());
  }
  sheet.clearContents();
  sheet.getRange(1, 1, values.length, header.length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
}

function readTableSheet_(ss, sheetName, columns) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var width = Math.min(columns.length, sheet.getLastColumn());
  if (width < 1) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, width).getValues();
  return values
    .filter(function (row) {
      return row.some(function (cell) { return String(cell == null ? '' : cell).trim() !== ''; });
    })
    .map(function (row) {
      var out = {};
      columns.forEach(function (col, idx) { out[col[0]] = idx < width ? denormalizeCell_(row[idx]) : ''; });
      return out;
    });
}

function readMetaConfig_(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.meta);
  if (!sheet || sheet.getLastRow() < 2) return {};
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var map = {};
  values.forEach(function (row) {
    var key = String(row[0] == null ? '' : row[0]).trim();
    if (key) map[key] = row[1];
  });
  var shared = {};
  if (map['Shared Config JSON']) {
    var parsed = parseJson_(map['Shared Config JSON']);
    Object.keys(parsed).forEach(function (k) { shared[k] = parsed[k]; });
  }
  /* Kompatibilitas meta v1 */
  if (map.Origin && !shared.origin) shared.origin = String(map.Origin);
  if (map['QR URL'] && !shared.qrUrl) shared.qrUrl = String(map['QR URL']);
  return shared;
}

function writeMetaSheet_(ss, payload) {
  var sheet = ss.getSheetByName(SHEET_NAMES.meta);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAMES.meta);

  var shared = (payload.sharedConfig && typeof payload.sharedConfig === 'object') ? payload.sharedConfig : {};
  /* Token TIDAK PERNAH ditulis ke spreadsheet. */
  var safeShared = {};
  Object.keys(shared).forEach(function (k) {
    if (/token/i.test(k)) return;
    safeShared[k] = shared[k];
  });

  var rows = [
    ['Field', 'Value'],
    ['App', payload.app || 'SITRAS Universal'],
    ['Schema', payload.schema || SYNC_SCHEMA],
    ['Version', payload.schemaVersion || payload.version || SYNC_VERSION],
    ['Reason', payload.reason || ''],
    ['Updated At', payload.updatedAt || new Date().toISOString()],
    ['Projects', count_(payload.projects)],
    ['Samples', count_(payload.samples)],
    ['Tests', count_(payload.tests)],
    ['Movements', count_(payload.movements)],
    ['Audit Logs', count_(payload.auditLogs)],
    /* dua baris berikut dipertahankan agar rumus lama tetap jalan */
    ['Origin', safeShared.origin || ''],
    ['QR URL', safeShared.qrUrl || ''],
    ['Shared Config JSON', JSON.stringify(safeShared)],
  ];

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
}

function normalizeCell_(value) {
  if (value === null || typeof value === 'undefined') return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return value;
}
function denormalizeCell_(value) {
  if (value === null || typeof value === 'undefined') return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return value.toISOString();
  return value;
}
function parseJson_(text) {
  if (!text) return {};
  try {
    var v = JSON.parse(String(text));
    return (v && typeof v === 'object') ? v : {};
  } catch (e) { return {}; }
}
function asArray_(v) { return Array.isArray(v) ? v : []; }
function count_(items) { return Array.isArray(items) ? items.length : 0; }
function summaryOf_(payload) {
  return count_(payload.projects) + ' proyek | ' + count_(payload.samples) + ' sampel | ' +
         count_(payload.tests) + ' uji | ' + count_(payload.movements) + ' log';
}
function errMessage_(err) { return err && err.message ? err.message : String(err); }
function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

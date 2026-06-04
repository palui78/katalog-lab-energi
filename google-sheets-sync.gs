/*
  SITRAS Google Sheets Sync Web App

  Cara pakai singkat:
  1. Buka Google Apps Script.
  2. Buat project baru, tempel file ini.
  3. Isi SPREADSHEET_ID jika project ini bukan script yang bound ke spreadsheet.
  4. Isi WRITE_TOKEN bila ingin membatasi siapa yang boleh mengirim data.
  5. Deploy -> New deployment -> Web app.
  6. Execute as: Me
  7. Who has access: Anyone with the link
  8. Salin URL /exec ke SITRAS -> Panduan & ISO -> Google Sheets Live Sync.
*/

const SPREADSHEET_ID = '';
const WRITE_TOKEN = '';

const SHEET_NAMES = {
  samples: 'Buku Induk',
  tests: 'Pengujian',
  movements: 'Log Penyimpanan',
  meta: 'SITRAS Meta',
};

const SAMPLE_COLUMNS = [
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
];

const TEST_COLUMNS = [
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
];

const MOVEMENT_COLUMNS = [
  ['id', 'ID'],
  ['sampleCode', 'Kode Sampel'],
  ['action', 'Aksi'],
  ['fromLocation', 'Dari Lokasi'],
  ['toLocation', 'Ke Lokasi'],
  ['datetime', 'Tanggal Waktu'],
  ['person', 'Oleh'],
  ['note', 'Catatan'],
];

function doGet() {
  return jsonOutput_({
    ok: true,
    app: 'SITRAS Google Sheets Sync',
    spreadsheet: getSpreadsheet_().getName(),
    sheetNames: SHEET_NAMES,
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const payload = parsePayload_(e);
    validatePayload_(payload);
    writeDatabase_(payload);
    return jsonOutput_({
      ok: true,
      message: 'Data SITRAS berhasil disimpan ke Google Sheets',
      summary:
        count_(payload.samples) + ' sampel | ' +
        count_(payload.tests) + ' uji | ' +
        count_(payload.movements) + ' log',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return jsonOutput_({
      ok: false,
      message: err && err.message ? err.message : String(err),
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (e2) {}
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Body POST tidak ditemukan.');
  }
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error('Body POST bukan JSON yang valid.');
  }
  return payload;
}

function validatePayload_(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload kosong atau tidak valid.');
  }
  if (payload.schema !== 'sitras-sheet-sync') {
    throw new Error('Schema sinkron tidak dikenali.');
  }
  if (WRITE_TOKEN && String(payload.token || '') !== WRITE_TOKEN) {
    throw new Error('Token sinkron Google Sheets tidak cocok.');
  }
}

function writeDatabase_(payload) {
  const ss = getSpreadsheet_();
  writeTableSheet_(ss, SHEET_NAMES.samples, SAMPLE_COLUMNS, payload.samples || []);
  writeTableSheet_(ss, SHEET_NAMES.tests, TEST_COLUMNS, payload.tests || []);
  writeTableSheet_(ss, SHEET_NAMES.movements, MOVEMENT_COLUMNS, payload.movements || []);
  writeMetaSheet_(ss, payload);
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('SPREADSHEET_ID belum diisi dan project ini tidak bound ke spreadsheet.');
  }
  return active;
}

function writeTableSheet_(ss, sheetName, columns, rows) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const header = columns.map(function (col) { return col[1]; });
  const dataRows = (rows || []).map(function (row) {
    return columns.map(function (col) {
      return normalizeCell_(row ? row[col[0]] : '');
    });
  });

  sheet.clearContents();
  const values = [header].concat(dataRows);
  sheet.getRange(1, 1, values.length, header.length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');

  if (sheet.getMaxRows() > values.length) {
    sheet.getRange(values.length + 1, 1, sheet.getMaxRows() - values.length, header.length).clearContent();
  }
}

function writeMetaSheet_(ss, payload) {
  let sheet = ss.getSheetByName(SHEET_NAMES.meta);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.meta);
  }

  const rows = [
    ['Field', 'Value'],
    ['App', payload.app || 'SITRAS'],
    ['Schema', payload.schema || ''],
    ['Version', payload.version || ''],
    ['Reason', payload.reason || ''],
    ['Updated At', payload.updatedAt || ''],
    ['Samples', count_(payload.samples)],
    ['Tests', count_(payload.tests)],
    ['Movements', count_(payload.movements)],
    ['Origin', payload.sharedConfig && payload.sharedConfig.origin ? payload.sharedConfig.origin : ''],
    ['QR URL', payload.sharedConfig && payload.sharedConfig.qrUrl ? payload.sharedConfig.qrUrl : ''],
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
  return value;
}

function count_(items) {
  return Array.isArray(items) ? items.length : 0;
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

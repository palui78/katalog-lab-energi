# Rencana Pemisahan Bertahap SITRAS

Dokumen ini adalah analisa arsitektur. Tujuannya bukan langsung memecah file sekarang, tetapi menyiapkan arah pengembangan yang aman tanpa merusak desain.

## Kondisi saat ini

File utama:
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html)

Struktur saat ini:
- CSS ada di satu blok besar
- HTML dirender dari string template
- Logika data, render, cetak, GitHub, Google Sheets, dan event digabung dalam satu file

Ini cepat untuk dipakai, tapi sulit untuk kontrol perubahan jika file makin besar.

## Bagian yang jangan dipisah dulu

Bagian ini sebaiknya tetap di tempatnya dulu sampai fungsi stabil:

- blok CSS utama
- layout header dan tabs
- template render utama
- struktur card, modal, dan tabel

Alasannya:
- desain Anda sudah terbentuk
- memindahkan ini terlalu cepat berisiko menggeser tampilan
- perubahan kecil akan lebih sulit dilacak kalau visual dan logika dipisah sekaligus

## Urutan pemisahan yang aman

### Tahap 1: config dan helper data

Pisahkan dulu bagian yang paling aman:

- `cfgDefaults`
- `loadDB`
- `save`
- konstanta sinkron
- helper umum seperti `gitTrim`, `sheetWriteUrl`, dan formatter

Alasan:
- tidak mengubah desain
- minim risiko pada tampilan
- memudahkan debugging sumber data

### Tahap 2: sinkronisasi eksternal

Pisahkan modul:

- GitHub
- Google Sheets
- impor CSV

Bagian yang terkait sekarang:
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1816)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1848)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1989)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:2087)

Alasan:
- ini modul fungsional, tidak berkaitan langsung dengan tampilan
- paling sering butuh perubahan teknis

### Tahap 3: cetak dan label

Pisahkan modul:

- `doPrint`
- `printPicker`
- preferensi label
- mode thermal

Bagian saat ini:
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1216)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1241)

Alasan:
- logikanya cukup mandiri
- sering berkembang sendiri dari modul lain

### Tahap 4: operasi bisnis per modul

Pisahkan bertahap:

- registrasi sampel
- pengujian
- penyimpanan/log
- arsip
- trace

Bagian saat ini:
- registrasi: [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1285)
- pengujian: [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1361)
- penyimpanan: [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1454)

### Tahap 5: render per tab

Kalau semua sudah stabil, baru render dipisah:

- `viewDash`
- `viewReg`
- `viewDB`
- `viewStore`
- `viewTest`
- `viewArch`
- `viewTrace`
- `viewGuide`

Bagian saat ini:
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:522)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:609)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:712)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:824)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:859)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:885)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:913)
- [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:938)

## Struktur target yang disarankan nanti

Jika nanti sudah siap dipisah, target yang aman:

- `sistem-lab-ketertelusuran.html`
- `assets/css/sitras.css`
- `assets/js/core/store.js`
- `assets/js/core/render.js`
- `assets/js/modules/sample.js`
- `assets/js/modules/test.js`
- `assets/js/modules/movement.js`
- `assets/js/modules/print.js`
- `assets/js/modules/github-sync.js`
- `assets/js/modules/sheets-sync.js`

## Kesimpulan

Untuk sekarang, pendekatan terbaik bukan refactor besar. Yang paling aman adalah:

1. edit di VSCode
2. ubah per modul kecil
3. pertahankan desain
4. pisahkan file hanya jika modulnya sudah stabil

Jadi analisa saya: pemisahan memang bagus, tapi harus bertahap. Prioritas pertama tetap kontrol perubahan, bukan bongkar struktur desain.

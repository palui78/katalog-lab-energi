# Panduan Kerja VSCode SITRAS

Dokumen ini dibuat supaya pengembangan tetap rapi, desain tidak berubah tanpa izin, dan setiap perubahan lebih mudah dikontrol.

## Cara buka proyek

1. Buka VSCode.
2. Pilih `File -> Open Folder`.
3. Buka folder:
   `C:\Users\LENOVO\Documents\berkas sempro\doc ssampel final`

## Workflow yang disarankan

1. Jalankan task `SITRAS: Backup file utama` sebelum perubahan yang agak besar.
2. Jalankan task `SITRAS: Jalankan server lokal 8765`.
3. Jalankan task `SITRAS: Buka halaman utama`.
4. Edit hanya bagian yang memang diperintah.
5. Refresh browser lokal setelah perubahan.
6. Cek hanya modul yang disentuh, jangan ubah desain global bila tidak diminta.

## Aturan kerja aman

- Jangan aktifkan `Format on Save`.
- Jangan rapikan seluruh file sekaligus.
- Jangan ubah blok CSS utama bila permintaan hanya soal fungsi.
- Jangan ganti nama class CSS tanpa kebutuhan yang jelas.
- Jangan pindahkan struktur header, nav, card, modal, atau table bila desain ingin dipertahankan.

## Bagian file yang penting

- Desain/CSS utama:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html) baris sekitar `10-262`
- Render utama:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:508)
- Data/config:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:417)
- Simpan/muat data:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:448)
- Buku induk/detail:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:712)
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:750)
- Cetak label:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1216)
- Registrasi sampel:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1285)
- Pengujian:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1361)
- Penyimpanan/log:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1454)
- GitHub sync:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1816)
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1848)
- Google Sheets sync:
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:1989)
  [sistem-lab-ketertelusuran.html](C:/Users/LENOVO/Documents/berkas%20sempro/doc%20ssampel%20final/sistem-lab-ketertelusuran.html:2087)

## Pola kerja perubahan kecil

Kalau permintaan Anda misalnya:

- `ubah reset data`
  Sentuh hanya fungsi `resetAll`, `loadDB`, atau `_updateFromSheets`.
- `ubah label sampel`
  Sentuh hanya `doPrint`, `printPicker`, dan opsi label.
- `ubah sinkron Google Sheets`
  Sentuh hanya `pushToGoogleSheets`, `_updateFromSheets`, `_saveSheets`, dan kartu panduan sync.
- `ubah pengujian`
  Sentuh hanya `viewTest`, `openTest`, dan penyimpanan data uji.

## Prinsip utama

Desain tetap dipertahankan. Perubahan harus fokus ke fungsi yang diminta, kecil, terukur, dan mudah dicek.

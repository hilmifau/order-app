# Project Rules & Guidelines (Agents Standard)

Pedoman dan alur kerja otomatis untuk proyek Order App (PO NARI PDA).

---

## 1. Push ke GitHub

Ketika user memberi perintah "push ke github" (atau sejenisnya), langsung jalankan tanpa bertanya lagi:

1. Cek perubahan dengan `git status` dan `git diff`.
2. Stage semua perubahan: `git add -A` (jangan ikutkan file yang berisi secret seperti `.env` bila belum ter-track).
3. Commit dengan pesan singkat berbahasa Indonesia yang menggambarkan perubahan (ikuti gaya commit sebelumnya di repo). Kalau user memberikan pesan, pakai pesan itu.
4. Push ke remote: `git push` (branch saat ini).
5. Laporkan hasil: branch, hash commit, dan ringkasan perubahan yang ikut ter-push.

---

## 2. Update OTA (EAS Update)

Ketika user memberi perintah "update OTA" (atau sejenisnya), langsung jalankan tanpa bertanya lagi:

1. **Cek `.env` dulu**: pastikan `EXPO_PUBLIC_USE_MOCK_DATA=false`. Kalau bernilai `true` atau belum ada, set/tambahkan menjadi `false` sebelum publish (nilai `EXPO_PUBLIC_*` ikut ter-bundle saat publish).
2. **Publish ke channel `production`**:

```bash
npx eas-cli update --channel production --message "<pesan dari user>" --non-interactive
```

- Kalau user memberikan pesan update, pakai pesan itu. Kalau tidak, buat pesan singkat berbahasa Indonesia yang menggambarkan perubahan terakhir.
- Setelah selesai, laporkan branch, runtime version, dan link EAS Dashboard dari output.

# Push ke GitHub

Ketika user memberi perintah "push ke github" (atau sejenisnya), langsung jalankan tanpa bertanya lagi:

1. Cek perubahan dengan `git status` dan `git diff`.
2. Stage semua perubahan: `git add -A` (jangan ikutkan file yang berisi secret seperti `.env` bila belum ter-track).
3. Commit dengan pesan singkat berbahasa Indonesia yang menggambarkan perubahan (ikuti gaya commit sebelumnya di repo). Kalau user memberikan pesan, pakai pesan itu.
4. Push ke remote: `git push` (branch saat ini).
5. Laporkan hasil: branch, hash commit, dan ringkasan perubahan yang ikut ter-push.

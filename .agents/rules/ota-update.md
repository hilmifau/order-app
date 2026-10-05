# Update OTA (EAS Update)

Ketika user memberi perintah "update OTA" (atau sejenisnya), langsung jalankan tanpa bertanya lagi:

1. **Cek `.env` dulu**: pastikan `EXPO_PUBLIC_USE_MOCK_DATA=false`. Kalau bernilai `true` atau belum ada, set/tambahkan menjadi `false` sebelum publish (nilai `EXPO_PUBLIC_*` ikut ter-bundle saat publish).
2. **Publish ke channel `production`**:

```bash
npx eas-cli update --channel production --message "<pesan dari user>" --non-interactive
```

- Kalau user memberikan pesan update, pakai pesan itu. Kalau tidak, buat pesan singkat berbahasa Indonesia yang menggambarkan perubahan terakhir.
- Setelah selesai, laporkan branch, runtime version, dan link EAS Dashboard dari output.

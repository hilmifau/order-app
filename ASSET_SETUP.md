# Asset Generation Guide

Panduan lengkap untuk setup logo dan splash screen aplikasi Order App.

## 📋 File yang Diperlukan

```
assets/images/
├── icon.png                          # App icon (1024x1024px)
├── splash-screen.png                 # Splash light mode (1200x1200px)
├── splash-screen-dark.png            # Splash dark mode (1200x1200px)
├── android-icon-foreground.png       # Android foreground (1080x1080px)
├── android-icon-background.png       # Android background (1080x1080px)
└── android-icon-monochrome.png       # Android monochrome (1080x1080px)
```

## 🎨 Quick Start

### Opsi 1: Gunakan Asset Generator HTML

1. Buka file `assets/ASSET_GENERATOR.html` di browser
2. Download template SVG untuk setiap asset
3. Edit di tool design (Canva, Figma, dll)
4. Export sebagai PNG dengan ukuran yang tepat

### Opsi 2: Design dari Nol

**Rekomendasi Tools:**
- **Canva** (Gratis, mudah) - https://canva.com
- **Figma** (Professional) - https://figma.com
- **Pixlr** (Online editor) - https://pixlr.com

**Template Design:**
- Color: `#FFD700` (Gold) dan `#FFA500` (Orange)
- Icon: Gunakan shopping cart emoji 🛒 atau custom design
- Font: Roboto, Inter, atau San Francisco

## 🖼️ Design Specifications

### App Icon (icon.png)
- **Size:** 1024 × 1024 px
- **Format:** PNG dengan background
- **Background:** Gradient gold (#FFD700 → #FFA500)
- **Content:** Logo/icon di tengah

### Splash Screen Light (splash-screen.png)
- **Size:** 1200 × 1200 px
- **Background:** White (#ffffff)
- **Content:** 
  - Logo di atas (200×200px)
  - Text "Order App" (80px font)
  - Subtitle (40px font)

### Splash Screen Dark (splash-screen-dark.png)
- **Size:** 1200 × 1200 px
- **Background:** Dark (#1a1a1a)
- **Content:** Same as light, adjust text colors

### Android Icons
- **Size:** 1080 × 1080 px
- **Foreground:** Logo dengan transparent background
- **Background:** Solid color
- **Monochrome:** Single color version

## 📦 Setup Steps

1. **Design assets** menggunakan tool pilihan Anda
2. **Export ke PNG** dengan spesifikasi di atas
3. **Copy files** ke `assets/images/`
4. **Update app.json** jika nama file berbeda:
   ```json
   {
     "icon": "./assets/images/icon.png",
     "plugins": [
       [
         "expo-splash-screen",
         {
           "image": "./assets/images/splash-screen.png"
         }
       ]
     ]
   }
   ```
5. **Test:** `npm start` atau `npm run web`

## 🚀 Generate Splash Screen

Setelah menambah/mengubah `splash-screen.png`:

```bash
npx expo-splash-screen-generate
```

Command ini akan otomatis generate splash screen untuk Android dan iOS.

## 🎯 Design Tips

### Logo Design
- Keep it simple and recognizable
- Works at small sizes (app shelf)
- Use brand colors consistently
- Avoid text in the logo

### Splash Screen Design
- Center alignment
- White space properly distributed
- Make it feel premium/professional
- Avoid too much text

### Color Palette
- Primary: `#FFD700` (Gold)
- Secondary: `#FFA500` (Orange)
- Accent: `#FF9800` (Deep Orange)
- Dark BG: `#1a1a1a`
- Light BG: `#ffffff`

## 📱 Testing

### Web Browser
```bash
npm run web
```
Check splash screen display di landing page.

### Android/iOS (EAS)
```bash
eas build --platform android
eas build --platform ios
```

## 🔄 Common Issues

**Q: Splash screen tidak muncul?**
A: Pastikan path file di `app.json` sesuai, jalankan `npx expo-splash-screen-generate`

**Q: Icon tidak tampil?**
A: Clear cache: `npx expo start --web --clear` atau rebuild

**Q: Size warning?**
A: Pastikan ukuran pixel sesuai spesifikasi (jangan kecil dari yang disarankan)

## 📚 Resources

- [Expo Splash Screen Docs](https://docs.expo.dev/guides/splash-screens/)
- [Android App Icon Guide](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [iOS App Icon Guide](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Canva - Free Graphic Design](https://canva.com)
- [Figma - Design Tool](https://figma.com)

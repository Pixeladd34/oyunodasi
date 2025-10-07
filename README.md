# AirConsole Klonu

Bu proje, TV tarayıcısı (Ekran) ve telefon (Kumanda) ile çok oyunculu etkileşim sunar. Sunucu Socket.IO ile gerçek zamanlı oda yönetimi sağlar.

## Kurulum

```bash
cd /Users/cenker/air_console
npm install
```

## Geliştirme

Aşağıdaki komut, hem sunucuyu hem web uygulamasını birlikte başlatır:

```bash
npm run dev
```

- Sunucu: `http://localhost:4000/health`
- Web (Next.js): `http://localhost:3000`

### Akış
1. TV tarayıcısında `http://localhost:3000/ekran` açılır; oda kodu oluşur.
2. Telefon tarayıcısında `http://localhost:3000/kumanda` açılır; oda kodu girilerek bağlanılır.
3. Kumanda üzerindeki yön ve A/B tuşları ekrandaki kutucuğu hareket ettirir.

## Üretim için notlar
- Sunucu ve web farklı portlarda çalışır. Üretimde ters vekil (Nginx) ile tek etki alanından servis edilebilir.
- `web/.env.local` içinde `NEXT_PUBLIC_SERVER_URL` ortam değişkeni Socket.IO sunucu adresine işaret etmelidir.

## Dağıtım (GitHub + Render + Vercel)

1) GitHub
- Bu dizinde bir git deposu oluşturup GitHub’a push edin.
- Monorepo yapısı: `server` (Socket.IO sunucusu), `web` (Next.js).

2) Render (Sunucu)
- Render’da New → Web Service → Reponuzu seçin.
- Root Directory: `server`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Plan: Free (uyku olabilir)
- Oluşan URL’yi not alın: ör. `https://air-console-server.onrender.com`

3) Vercel (Web)
- Vercel’de New Project → Reponuzu seçin.
- Root Directory: `web`
- Environment Variables: `NEXT_PUBLIC_SERVER_URL` → Render’daki sunucu URL’si
- Deploy → `https://<proje>.vercel.app`

4) Test
- TV (veya bilgisayar) tarayıcısında: `https://<proje>.vercel.app/ekran`
- Telefonda: `https://<proje>.vercel.app/kumanda` → ekran kodunu girin.

## Lisans
Bu proje eğitim amaçlıdır ve AirConsole ile bağlantılı değildir.

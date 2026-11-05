# Travelling App — Expo SDK 58 · TypeScript · pnpm

```bash
pnpm install
pnpm fix-deps     # expo install --fix: ghim đúng phiên bản các gói theo SDK 58
pnpm doctor
pnpm start
```
Cần Node >= 22.22. Expo Go bản store có thể chưa hỗ trợ SDK 58 → dùng development build (`pnpm exec expo run:ios|android`) hoặc `eas go`.

## Cấu trúc
```
index.ts, App.tsx           entry (registerRootComponent)
src/
  app/                      providers + navigation (RootNavigator, MainTabs, types)
  features/<tên>/           mỗi tính năng: screens/, components/, utils/, hooks/ + index.ts
    auth · home · search · listing · booking · bookings · favorites · inbox · profile
  components/               UI dùng chung (Btn, Header, Photo, ListingCard...)
  constants/theme.ts        màu, style, kích thước
  services/                 lớp truy cập dữ liệu (listingService) → thay bằng API thật
  store/                    AppContext, types, defaults
  data/ · types/ · utils/ · config/
```
Thêm tính năng mới: tạo `src/features/<tên>/`, thêm route vào `app/navigation/types.ts` và `RootNavigator.tsx`.

## Listing datasource and search

The app and Express API share the root `.env`. Copy `.env.example` to `.env`, set `EXPO_PUBLIC_API_URL` to this computer's LAN IP for Expo Go on a phone, and set `MONGODB_URI` and `JWT_SECRET` for the backend. The server and seed command load this root file; for backwards compatibility, server-only values can still be read from `server/.env` when not defined in the root file. Never add `EXPO_PUBLIC_` to secret values, because Expo embeds public variables in the client bundle.

```bash
cd server
pnpm install
pnpm seed:listings
pnpm dev
```

The seed operation upserts by listing ID, so it can be run again without duplicating listings. Expo Go on an iOS or Android phone must use the computer's Wi-Fi LAN IP, not `localhost`; update `EXPO_PUBLIC_API_URL` in the root `.env` if the IP changes. Start Expo Go mode with `pnpm start:go`, and keep the API server running on port 4000. For a simulator on the same computer, use the platform host (`10.0.2.2` for Android or `localhost` for iOS) if preferred. Configure the public API URL in the EAS build environment for cloud iOS builds. The URL is embedded at bundle time, so restart Expo after changing it. Local HTTP is enabled for development only; use HTTPS for production. Login uses this API, and newly registered users can sign in.

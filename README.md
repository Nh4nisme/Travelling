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

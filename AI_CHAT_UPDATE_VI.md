# 🔄 Cập nhật: Bubble Chat có thể kéo di chuyển

## ✅ Hoàn thành

Bubble chat giờ có **2 chế độ**:

### 🖱️ Chế độ 1: Kéo thả tự do (Draggable)
```tsx
<AIChatBubble position="draggable" />
```
- ✅ Kéo bubble đi bất kỳ đâu trên màn hình
- ✅ Tự động giữ trong màn hình, không bị mất
- ✅ Nhấn nhẹ để mở chat
- ✅ Có icon "di chuyển" ở góc
- ✅ Hiệu ứng khi đang kéo

### 📍 Chế độ 2: Cố định 2/3 màn hình trên-phải
```tsx
<AIChatBubble position="top-right" />
```
- ✅ Luôn ở vị trí 2/3 chiều cao màn hình, góc phải
- ✅ Không kéo được, vị trí cố định
- ✅ Nhấn để mở chat

## 🎯 Đang dùng

**Mặc định:** Chế độ kéo thả (draggable)

Trong file `src/app/navigation/RootNavigator.tsx`:
```tsx
{/* Đang dùng: Kéo thả tự do */}
<AIChatBubble position="draggable" />

{/* Nếu muốn cố định, uncomment dòng này: */}
{/* <AIChatBubble position="top-right" /> */}
```

## 🎨 Tùy chỉnh vị trí ban đầu

```tsx
// Bubble bắt đầu ở vị trí tùy chỉnh
<AIChatBubble 
  position="draggable"
  initialPosition={{ x: 100, y: 300 }} 
/>
```

## 🚀 Cách hoạt động

### Khi kéo bubble:
1. Nhấn giữ bubble → màu đổi đậm
2. Kéo đi bất kỳ đâu
3. Thả ra → tự động snap vào biên nếu quá gần cạnh
4. Chat window tự động mở gần bubble

### Thông minh:
- ❌ Không cho bubble bay ra ngoài màn hình
- ✅ Chat tự đặt bên phải bubble
- ✅ Nếu không đủ chỗ, đặt bên trái
- ✅ Luôn hiển thị đầy đủ

## 💡 Khi nào dùng mode nào?

**Dùng Draggable (kéo thả):**
- App giải trí, flexible
- User thích tùy chỉnh
- Trải nghiệm tương tác cao

**Dùng Fixed (cố định):**
- App công việc, chuyên nghiệp
- Cần vị trí nhất quán
- User dễ tìm (luôn ở 1 chỗ)

## 🎉 Xong!

TypeScript check: ✅ Pass

Chạy app và thử kéo bubble xem nhé! 🚀

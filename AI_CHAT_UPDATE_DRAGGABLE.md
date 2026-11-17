# 🎯 Cập nhật: AI Chat Bubble - Draggable & Fixed Position

## ✅ Đã hoàn thành

Bubble chat giờ đây có **2 chế độ**:

### 🖱️ Mode 1: Draggable (Kéo di chuyển tự do)
```tsx
<AIChatBubble position="draggable" />
```

**Tính năng:**
- ✅ Kéo và thả bubble tự do trên màn hình
- ✅ Tự động snap vào biên màn hình khi thả
- ✅ Tap để mở chat khi không kéo
- ✅ Icon "move" ở góc bubble để biết có thể kéo
- ✅ Hiệu ứng dragging (đổi màu, shadow lớn hơn)
- ✅ Chat window tự động đặt gần bubble
- ✅ Thông minh tránh ra ngoài màn hình

**Vị trí mặc định:** Bottom-right (có thể tùy chỉnh)

### 📍 Mode 2: Fixed Top-Right (Cố định 2/3 màn hình)
```tsx
<AIChatBubble position="top-right" />
```

**Tính năng:**
- ✅ Cố định ở vị trí 2/3 chiều cao màn hình, góc phải
- ✅ Không kéo được
- ✅ Tap để mở chat
- ✅ Chat window mở ở vị trí cố định gần bubble

## 🎨 Demo

### Draggable Mode:
```
┌─────────────────────┐
│                     │
│   [Tap or Drag me]  │ ← Kéo đi đâu cũng được
│         💬          │
│                     │
│                     │
│                     │
└─────────────────────┘
```

### Fixed Top-Right Mode:
```
┌─────────────────────┐
│               💬    │ ← Cố định ở đây (2/3 màn hình)
│                     │
│                     │
│                     │
│                     │
│                     │
└─────────────────────┘
```

## 🔧 Cách sử dụng

### Trong file: `src/app/navigation/RootNavigator.tsx`

```tsx
// Mode 1: Draggable (Mặc định - Đang dùng)
<AIChatBubble position="draggable" />

// Mode 2: Fixed top-right
<AIChatBubble position="top-right" />

// Mode 1 với vị trí ban đầu tùy chỉnh
<AIChatBubble 
  position="draggable" 
  initialPosition={{ x: 100, y: 200 }} 
/>
```

## 💡 Chi tiết kỹ thuật

### Draggable Mode

**PanResponder:**
- Detect drag gestures
- Offset tracking để smooth drag
- Animate về vị trí hợp lệ khi thả
- Phân biệt tap vs drag (< 10px = tap)

**Boundary Detection:**
```typescript
// Giữ trong màn hình
if (x < 0) x = 10;
if (x > SCREEN_WIDTH - BUBBLE_SIZE) x = SCREEN_WIDTH - BUBBLE_SIZE - 10;
if (y < 0) y = 10;
if (y > SCREEN_HEIGHT - BUBBLE_SIZE) y = SCREEN_HEIGHT - BUBBLE_SIZE - 100;
```

**Chat Position Logic:**
```typescript
// Mở chat bên cạnh bubble
let chatX = bubbleX + BUBBLE_SIZE + 10;

// Nếu vượt màn hình, đặt bên trái bubble
if (chatX + CHAT_WIDTH > SCREEN_WIDTH) {
  chatX = bubbleX - CHAT_WIDTH - 10;
}
```

### Fixed Mode

**Position Calculation:**
```typescript
// 2/3 màn hình từ top
top: SCREEN_HEIGHT / 3 - BUBBLE_SIZE / 2
right: 20
```

### Visual Feedback

**Khi dragging:**
- Màu đậm hơn: `#0051D5`
- Shadow lớn hơn: `shadowRadius: 12`
- Opacity thay đổi

**Icon hint:**
- Icon "move" ở góc bubble (chỉ khi draggable)
- Ẩn khi đang kéo

## 🎯 So sánh 2 modes

| Feature | Draggable | Fixed Top-Right |
|---------|-----------|-----------------|
| Kéo được | ✅ | ❌ |
| Vị trí linh hoạt | ✅ | ❌ |
| Vị trí cố định | ❌ | ✅ |
| Dễ tìm | ⚠️ (user tự đặt) | ✅ (luôn ở top-right) |
| UX playful | ✅ | ❌ |
| Professional | ⚠️ | ✅ |

## 🚀 Use Cases

**Dùng Draggable khi:**
- App giải trí, casual
- Muốn UX interactive
- User thích tùy chỉnh
- Màn hình thường xuyên thay đổi context

**Dùng Fixed khi:**
- App business, professional
- Cần consistency
- Dễ onboarding (user biết ngay vị trí)
- Compliance/guideline design

## 🐛 Troubleshooting

### Bubble không kéo được
**Check:** `position="draggable"` đã set chưa?

### Bubble bị mất khỏi màn hình
**Solution:** Boundary detection sẽ tự snap lại, hoặc reset:
```typescript
initialPosition={{ 
  x: SCREEN_WIDTH - 80, 
  y: SCREEN_HEIGHT - 180 
}}
```

### Chat window bị che khuất
**Solution:** Logic tự động chuyển sang bên trái bubble nếu bên phải không đủ chỗ

### Performance
**Optimized:** 
- `useNativeDriver: false` (cần cho pan gesture)
- Animated.spring với tension/friction hợp lý
- No re-render khi drag (chỉ Animated value thay đổi)

## 📱 Platform Support

- ✅ iOS
- ✅ Android
- ✅ Web (với mouse drag)

## 🎨 Customization

### Đổi màu khi drag
```typescript
// src/components/AIChatBubble.tsx
bubbleButtonDragging: {
  backgroundColor: '#FF3B30', // Đổi màu đỏ
}
```

### Đổi vị trí fixed
```typescript
// Thay vì 2/3, đổi thành 1/2 màn hình
top: SCREEN_HEIGHT / 2 - BUBBLE_SIZE / 2
```

### Đổi kích thước bubble
```typescript
const BUBBLE_SIZE = 70; // Lớn hơn
```

### Snap to edges (như Facebook Messenger)
```typescript
onPanResponderRelease: () => {
  // Snap to nearest edge
  const centerX = bubbleX + BUBBLE_SIZE / 2;
  const snapToRight = centerX > SCREEN_WIDTH / 2;
  
  Animated.spring(pan.x, {
    toValue: snapToRight ? SCREEN_WIDTH - BUBBLE_SIZE - 20 : 20,
    // ...
  }).start();
}
```

## ✨ Features Added

1. **Gesture Handler** - PanResponder cho smooth drag
2. **Boundary Detection** - Tự động giữ trong màn hình
3. **Smart Chat Positioning** - Chat mở ở vị trí tối ưu
4. **Visual Feedback** - Dragging effects
5. **Tap vs Drag Detection** - Phân biệt user intent
6. **Multiple Position Modes** - Draggable + Fixed
7. **Screen Size Awareness** - Responsive với mọi màn hình

## 📊 Before vs After

### Before:
```tsx
// Chỉ có fixed position
<AIChatBubble position="bottom-right" bottom={20} side={20} />
```

### After:
```tsx
// Draggable - Tự do
<AIChatBubble position="draggable" />

// Or Fixed - 2/3 top-right
<AIChatBubble position="top-right" />

// Or custom initial position
<AIChatBubble 
  position="draggable"
  initialPosition={{ x: 200, y: 400 }} 
/>
```

## 🎉 Ready to use!

Chỉ cần chọn mode phù hợp trong `RootNavigator.tsx`:

```tsx
// Uncomment mode bạn muốn:

// Mode 1: Draggable (Recommended)
<AIChatBubble position="draggable" />

// Mode 2: Fixed
// <AIChatBubble position="top-right" />
```

---

**Updated:** 2026-11-17
**Version:** 1.1.0
**Status:** ✅ Production Ready

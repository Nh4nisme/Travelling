# 🎯 AI Assistant - Model Configuration

## 📌 Model hiện tại: `gemini-3.5-flash-lite`

**Đã cập nhật:** 2026-11-17 06:17 UTC

### Lịch sử thay đổi:
1. ❌ `gemini-1.5-flash` → 404 Not Found
2. ❌ `gemini-1.5-flash-latest` → 404 Not Found
3. ❌ `gemini-2.5-flash` → Deprecated (không cho user mới)
4. ❌ `gemini-3.8-flash` → 503 High demand (tạm thời)
5. ✅ **`gemini-3.5-flash-lite`** → Đang dùng (Stable, available)

---

## 🚀 Models khả dụng (từ API của bạn)

### Production Ready:
| Model | Version | Status | Speed | Availability |
|-------|---------|--------|-------|--------------|
| **gemini-3.5-flash-lite** ⭐ | Stable | ✅ Active | ⚡⚡⚡ | High availability |
| gemini-3.5-flash | Stable | ✅ Active | ⚡⚡⚡ | Production |
| gemini-3.6-flash | Older | ✅ Active | ⚡⚡⚡ | Stable |
| gemini-3.7-flash | Newer | ✅ Active | ⚡⚡⚡ | Production |
| gemini-3.8-flash | Latest | ⚠️ High demand | ⚡⚡⚡ | Limited |

### Advanced (Pro):
| Model | Type | Speed | Intelligence | Cost |
|-------|------|-------|--------------|------|
| gemini-3.1-pro-preview | Pro | ⚡⚡ | 🧠🧠🧠🧠 | Higher |
| gemini-2.5-pro | Pro | ⚡⚡ | 🧠🧠🧠🧠 | Higher |

### Specialized:
- `gemini-3.8-flash-tts` - Text to Speech
- `gemini-3.8-live` - Live streaming
- `gemini-3.5-transcribe` - Audio transcription
- `gemini-robotics-er-2-preview` - Robotics

### Deprecated (Không dùng):
- ❌ `gemini-2.5-flash` - No longer available to new users
- ❌ `gemini-1.5-flash` - Not found
- ❌ `gemini-1.5-flash-latest` - Not found
- ⚠️ `gemini-3.8-flash` - High demand, use fallback

---

## 🔧 Cách đổi model

### File: `src/services/aiAssistantService.ts`

```typescript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-3.8-flash'  // ← Đổi model name ở đây
});
```

### Recommended Models:

#### 1. Fast & Stable (Đang dùng):
```typescript
model: 'gemini-3.5-flash-lite'  // ⭐ Recommended - Stable & Available
```

#### 2. Alternative Fast:
```typescript
model: 'gemini-3.5-flash'  // Stable, slightly heavier
```

#### 3. Latest (có thể bị overload):
```typescript
model: 'gemini-3.8-flash'  // Latest but may have high demand
```

---

## 💰 Pricing & Limits

### Free Tier (gemini-3.5-flash-lite):
- ✅ 60 requests/minute
- ✅ 1,500 requests/day  
- ✅ High availability (không bị overload)
- ✅ Faster response (lite version)
- ✅ 32K context window

### Pro Models (higher cost):
- ⚠️ Check pricing: https://ai.google.dev/pricing
- ⚠️ May require paid tier

---

## 🧪 Testing Different Models

### Quick Test Script:
```bash
# Test với gemini-3.5-flash-lite (current - stable)
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=YOUR_API_KEY"

# Test với gemini-3.5-flash (alternative)
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=YOUR_API_KEY"
```

### Trong App:
1. Đổi model name trong `aiAssistantService.ts`
2. Restart dev server: `pnpm start --clear`
3. Test trong Inbox → AI Assistant
4. So sánh speed & quality

---

## 📊 Model Comparison

### Speed Test (ước tính):
- gemini-3.5-flash-lite: ~0.5-1 seconds (fastest)
- gemini-3.5-flash: ~1-2 seconds
- gemini-3.6-flash: ~1-2 seconds
- gemini-3.7-flash: ~1-2 seconds
- gemini-3.8-flash: ~1-2 seconds (khi available)
- gemini-3.1-pro: ~3-5 seconds

### Quality Test:
- Complex reasoning: Pro > Flash
- Simple Q&A: Flash = Pro
- Context understanding: 3.8 > 3.7 > 3.5

---

## 🎯 Recommendations

### Use `gemini-3.5-flash-lite` when:
- ✅ Need reliable availability (không bị 503)
- ✅ Want fastest response
- ✅ Cost is a concern
- ✅ General chat/support
- ✅ High traffic expected

### Use `gemini-3.5-flash` when:
- ✅ Need slightly better quality than lite
- ✅ Availability is important
- ✅ Production critical

### Use `gemini-3.8-flash` when:
- ⚠️ Need absolute latest features
- ⚠️ Can handle 503 errors
- ⚠️ Off-peak hours

### Use `gemini-3.1-pro-preview` when:
- ✅ Need maximum intelligence
- ✅ Complex reasoning required
- ✅ Response quality > speed
- ✅ Budget allows

---

## 🔄 Migration Guide

### From gemini-3.8-flash:
```diff
- model: 'gemini-3.8-flash'
+ model: 'gemini-3.5-flash-lite'
```

**Why?**
- ✅ Avoid 503 errors (high demand)
- ✅ Better availability
- ✅ Faster response (lite)
- ✅ Still very capable

**Changes:**
- ✅ More reliable
- ✅ Faster (lite version)
- ⚠️ Slightly less features (not noticeable for chat)

**Action Required:**
1. Update model name
2. Restart dev server: `pnpm start --clear`
3. Test thoroughly
4. Enjoy stable service!

---

## 🆘 If Model Not Working

### 1. Check Model Exists:
```bash
curl https://generativelanguage.googleapis.com/v1beta/models \
  -H "x-goog-api-key: YOUR_API_KEY"
```

### 2. Try Fallback Models:
```typescript
// Try in order (best availability):
const MODELS = [
  'gemini-3.5-flash-lite',  // Best availability
  'gemini-3.5-flash',       // Good availability
  'gemini-3.6-flash',       // Stable
  'gemini-3.7-flash',       // Newer
  'gemini-3.8-flash',       // Latest (may be overloaded)
];
```

### 3. Check API Status:
- https://status.cloud.google.com/

### 4. Verify API Key:
- https://makersuite.google.com/app/apikey

---

## 📚 Resources

- [Gemini Models](https://ai.google.dev/models/gemini)
- [API Reference](https://ai.google.dev/api/rest)
- [Model Versions](https://ai.google.dev/models)
- [Pricing](https://ai.google.dev/pricing)
- [Best Practices](https://ai.google.dev/docs/best_practices)

---

**Last Updated:** 2026-11-17 06:17 UTC  
**Current Model:** gemini-3.5-flash-lite  
**Status:** ✅ Active & Stable  
**Reason:** High availability, no 503 errors

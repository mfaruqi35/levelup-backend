# 🚀 Setup Groq API (RECOMMENDED - 100% FREE!)

## Kenapa Groq?

✅ **Benar-benar GRATIS** - Tidak perlu kartu kredit
✅ **Super cepat** - Fastest inference in the world
✅ **Quota besar** - 14,400 requests per hari (600/jam)
✅ **Model bagus** - LLaMA 3.1 70B (setara GPT-4)
✅ **Bahasa Indonesia** - Support dengan baik

---

## 📝 Cara Mendapatkan Groq API Key

### Step 1: Daftar Akun

1. Buka: **https://console.groq.com/**
2. Klik **"Sign Up"** atau **"Get Started"**
3. Pilih salah satu:
   - Login dengan **Google**
   - Login dengan **GitHub**
   - Atau daftar dengan email

### Step 2: Verifikasi Email (jika perlu)

- Cek inbox email Anda
- Klik link verifikasi dari Groq

### Step 3: Generate API Key

1. Setelah login, masuk ke dashboard
2. Klik menu **"API Keys"** di sidebar kiri
3. Atau langsung buka: https://console.groq.com/keys
4. Klik tombol **"Create API Key"**
5. Beri nama (misalnya: "LevelUp Chatbot")
6. Klik **"Create"**
7. **COPY API KEY** yang muncul (hanya ditampilkan sekali!)

Format API key: `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Tambahkan ke Project

Edit file `.env` dan update:

```properties
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Test API Key

```bash
node test-gemini.js
```

**Expected Output:**
```
🔑 Testing Groq...
   ✅ SUCCESS with Groq!
   Response: Hello! How are you?
   💰 Tokens: 28

🎉 RECOMMENDED: Use Groq
```

### Step 6: Restart Server

```bash
npm run start-dev
```

### Step 7: Test Chatbot

Kirim query ke chatbot endpoint, misalnya: "hai" atau "tips jualan"

---

## 📊 Groq Free Tier Limits

| Feature | Limit |
|---------|-------|
| **Requests per day** | 14,400 (600/jam) |
| **Tokens per minute** | 30,000 |
| **Requests per minute** | 30 |
| **Model** | LLaMA 3.1 70B, Mixtral, dll |
| **Cost** | **$0 - GRATIS!** |

---

## 🎯 Model yang Tersedia (Gratis)

1. **llama-3.1-70b-versatile** ← RECOMMENDED
   - Paling pintar dan versatile
   - Bagus untuk conversational AI
   - Support Bahasa Indonesia

2. **llama-3.1-8b-instant**
   - Lebih cepat, lebih ringan
   - Bagus untuk response cepat

3. **mixtral-8x7b-32768**
   - Context window besar (32K tokens)
   - Bagus untuk analisis panjang

---

## 🔧 Troubleshooting

### Error: 401 Unauthorized
- API key salah atau tidak valid
- Generate API key baru
- Pastikan tidak ada spasi di awal/akhir

### Error: 429 Rate Limit
- Anda sudah mencapai limit (30 req/menit)
- Tunggu 1 menit dan coba lagi
- Atau implement rate limiting di aplikasi

### Error: Connection timeout
- Cek koneksi internet
- Groq server mungkin down (jarang terjadi)
- Coba lagi setelah beberapa saat

---

## 🆚 Perbandingan dengan Provider Lain

| Provider | Free Tier | Speed | Quality | Indo Support |
|----------|-----------|-------|---------|--------------|
| **Groq** | ✅ 14K/day | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | ✅ Bagus |
| DeepSeek | ❌ Need balance | ⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | ✅ Excellent |
| OpenRouter | ✅ Limited | ⚡⚡⚡ | ⭐⭐⭐⭐ | ✅ Oke |
| Gemini | ⚠️ Kompleks | ⚡⚡⚡ | ⭐⭐⭐⭐ | ✅ Oke |

---

## 💡 Tips Penggunaan

1. **Rate Limiting**: Implement debouncing di frontend untuk menghindari spam
2. **Caching**: Cache response yang sering ditanya
3. **Error Handling**: Sudah di-handle di code, tapi monitor logs
4. **Monitoring**: Cek usage di Groq dashboard secara berkala

---

## 📚 Resources

- **Dashboard**: https://console.groq.com/
- **Documentation**: https://console.groq.com/docs
- **API Keys**: https://console.groq.com/keys
- **Playground**: https://console.groq.com/playground
- **Status Page**: https://status.groq.com/

---

## 🎉 Selamat!

Jika berhasil setup Groq, chatbot Anda sekarang:
- ✅ Gratis selamanya
- ✅ Super cepat (< 2 detik response)
- ✅ Reliable dan stabil
- ✅ Kualitas jawaban excellent

**Happy coding! 🚀**

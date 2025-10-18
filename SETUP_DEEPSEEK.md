# 🔑 Cara Mendapatkan DeepSeek API Key

## Langkah-langkah:

### 1. Daftar di DeepSeek Platform
- Kunjungi: https://platform.deepseek.com/
- Klik "Sign Up" atau "Register"
- Gunakan email atau akun Google untuk mendaftar

### 2. Verifikasi Akun
- Cek email untuk verifikasi
- Klik link verifikasi yang diberikan

### 3. Generate API Key
- Login ke dashboard: https://platform.deepseek.com/api_keys
- Klik "Create API Key" atau "+ New API Key"
- Beri nama API key (misalnya: "LevelUp Chatbot")
- Copy API key yang dihasilkan

### 4. Setup di Project
Tambahkan API key ke file `.env`:

```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Test API Key
Jalankan test script:

```bash
node test-gemini.js
```

## ⚠️ Penting:
- **JANGAN commit API key ke Git** (sudah ada di `.gitignore`)
- API key bersifat rahasia, jangan bagikan ke orang lain
- DeepSeek memiliki free tier yang cukup generous

## 💰 Pricing (per Oktober 2025):
- **Free Tier**: 10,000 tokens gratis setiap hari
- **Pay as you go**: $0.14 per 1M input tokens, $0.28 per 1M output tokens
- Lebih murah dari GPT-4 dan Claude

## 📚 Dokumentasi:
- Docs: https://platform.deepseek.com/docs
- API Reference: https://platform.deepseek.com/api-docs

## 🆚 Alternatif Lain (jika DeepSeek tidak bisa):

### 1. OpenRouter (Recommended)
- URL: https://openrouter.ai/
- Support banyak model termasuk Claude, GPT, Qwen, dll
- Gratis untuk beberapa model

### 2. Together AI
- URL: https://api.together.xyz/
- Model open source gratis: Qwen, LLaMA, dll

### 3. Groq (Super Fast)
- URL: https://groq.com/
- Free tier: 14,400 requests/day
- Model: LLaMA 3, Mixtral, dll

## 🔄 Jika Mau Ganti ke Model Lain:
Edit file `src/utils/deepseek.js` dan ubah:
- `baseURL` sesuai provider
- `model` sesuai yang tersedia
- Format request sesuai dokumentasi provider

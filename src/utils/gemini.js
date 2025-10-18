import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY tidak ditemukan di environment variables');
}

// Initialize dengan API v1 (bukan v1beta)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateGeminiResponse = async (systemPrompt, userMessage, context = {}) => {
    try {
        // Gunakan gemini-pro yang stable dan supported
        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro"
        });

        // Combine system prompt with context
        const fullPrompt = `${systemPrompt}

═══════════════════════════════════════════
📊 DATA KONTEKS PLATFORM LEVELUP
═══════════════════════════════════════════

${JSON.stringify(context, null, 2)}

═══════════════════════════════════════════
💬 PERTANYAAN USER
═══════════════════════════════════════════

${userMessage}

═══════════════════════════════════════════
📝 INSTRUKSI RESPONSE
═══════════════════════════════════════════

1. Jawab dalam Bahasa Indonesia yang baik dan benar
2. Gunakan data konteks yang diberikan untuk memberikan jawaban yang akurat
3. Jika tidak ada data yang relevan, beritahu user dengan sopan
4. Format jawaban dengan rapi menggunakan paragraf dan bullet points jika perlu
5. Berikan maksimal 3-5 rekomendasi jika diminta
6. Jangan membuat-buat informasi yang tidak ada di konteks
7. Tetap profesional dan membantu dalam setiap response
8. Jika user bertanya di luar scope, arahkan kembali ke topik yang relevan`;

        console.log('🤖 Generating Gemini response...');
        console.log('📝 User message:', userMessage);
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini response generated');
        console.log('📄 Response preview:', text.substring(0, 100) + '...');

        return text;

    } catch (error) {
        console.error('❌ Gemini API error:', error);
        
        if (error.message?.includes('API key')) {
            throw new Error('API key Gemini tidak valid. Silakan periksa konfigurasi.');
        }
        
        if (error.message?.includes('quota')) {
            throw new Error('Kuota API Gemini habis. Silakan coba lagi nanti.');
        }
        
        throw new Error('Gagal mendapatkan respons dari AI: ' + error.message);
    }
};

export default genAI;
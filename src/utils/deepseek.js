import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Support multiple AI providers
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq'; // groq, deepseek, openrouter

const configs = {
    groq: {
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        name: 'Groq'
    },
    deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        name: 'DeepSeek'
    },
    openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        model: 'meta-llama/llama-3.1-70b-instruct:free',
        name: 'OpenRouter'
    }
};

const config = configs[AI_PROVIDER];

if (!config || !config.apiKey) {
    throw new Error(`${config?.name || AI_PROVIDER} API key tidak ditemukan di environment variables`);
}

// Initialize AI client
const aiClient = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL
});

export const generateDeepSeekResponse = async (systemPrompt, userMessage, context = {}) => {
    try {
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

        console.log(`🤖 Generating ${config.name} response...`);
        console.log('📝 User message:', userMessage);
        console.log('🎯 Using model:', config.model);
        
        const completion = await aiClient.chat.completions.create({
            model: config.model,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: fullPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0
        });

        const text = completion.choices[0].message.content;

        console.log(`✅ ${config.name} response generated`);
        console.log('📄 Response preview:', text.substring(0, 100) + '...');

        return text;

    } catch (error) {
        console.error(`❌ ${config.name} API error:`, error);
        
        if (error.message?.includes('API key') || error.status === 401) {
            throw new Error(`API key ${config.name} tidak valid. Silakan periksa konfigurasi.`);
        }
        
        if (error.message?.includes('quota') || error.message?.includes('balance') || error.status === 429 || error.status === 402) {
            throw new Error(`Kuota API ${config.name} habis. Silakan coba lagi nanti atau ganti provider.`);
        }
        
        throw new Error(`Gagal mendapatkan respons dari AI: ${error.message}`);
    }
};

export default aiClient;

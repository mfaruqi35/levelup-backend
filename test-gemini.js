import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Test all available providers
const providers = [
    {
        name: 'Groq',
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile'
    },
    {
        name: 'OpenRouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        model: 'meta-llama/llama-3.1-70b-instruct:free'
    },
    {
        name: 'DeepSeek',
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat'
    }
];

async function testProviders() {
    console.log('🧪 Testing AI Providers...\n');
    
    let successFound = false;
    
    for (const provider of providers) {
        if (!provider.apiKey || provider.apiKey === 'your_api_key_here') {
            console.log(`⏭️  Skipping ${provider.name} - No API key configured\n`);
            continue;
        }
        
        console.log(`� Testing ${provider.name}...`);
        console.log(`   API Key: ${provider.apiKey.substring(0, 15)}...`);
        console.log(`   Model: ${provider.model}`);
        
        const client = new OpenAI({
            apiKey: provider.apiKey,
            baseURL: provider.baseURL
        });
        
        try {
            const completion = await client.chat.completions.create({
                model: provider.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant."
                    },
                    {
                        role: "user",
                        content: "Say hello in 5 words"
                    }
                ],
                temperature: 0.7,
                max_tokens: 100
            });
            
            console.log(`   ✅ SUCCESS with ${provider.name}!`);
            console.log(`   Response: ${completion.choices[0].message.content}`);
            console.log(`   💰 Tokens: ${completion.usage.total_tokens}\n`);
            
            if (!successFound) {
                console.log(`\n🎉 RECOMMENDED: Use ${provider.name}`);
                console.log(`   Add to .env: AI_PROVIDER=${provider.name.toLowerCase()}\n`);
                successFound = true;
            }
            
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
            }
            console.log();
        }
    }
    
    if (!successFound) {
        console.log('\n⚠️  NO WORKING PROVIDER FOUND!');
        console.log('\n📚 Setup Instructions:');
        console.log('   1. Groq (Recommended - Free): https://console.groq.com/');
        console.log('   2. OpenRouter (Free models): https://openrouter.ai/');
        console.log('   3. DeepSeek (Need balance): https://platform.deepseek.com/');
    }
}

testProviders().catch(console.error);

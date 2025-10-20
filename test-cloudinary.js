import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Cloudinary Configuration\n');

// Parse CLOUDINARY_URL
if (process.env.CLOUDINARY_URL) {
    console.log('✅ CLOUDINARY_URL found');
    
    const urlParts = process.env.CLOUDINARY_URL;
    const matches = urlParts.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
    
    if (matches) {
        const api_key = matches[1];
        const api_secret = matches[2];
        const cloud_name = matches[3];
        
        console.log('📋 Configuration Details:');
        console.log('   Cloud Name:', cloud_name);
        console.log('   API Key:', api_key.substring(0, 6) + '...');
        console.log('   API Secret:', api_secret.substring(0, 6) + '...\n');
        
        cloudinary.config({
            cloud_name: cloud_name,
            api_key: api_key,
            api_secret: api_secret,
            secure: true
        });
        
        // Test connection
        console.log('🔌 Testing connection to Cloudinary...');
        cloudinary.api.ping()
            .then(result => {
                console.log('✅ Connection successful!');
                console.log('Response:', result);
            })
            .catch(error => {
                console.error('❌ Connection failed!');
                console.error('Error:', error.message);
                if (error.error) {
                    console.error('Error details:', error.error);
                }
            });
    } else {
        console.error('❌ Invalid CLOUDINARY_URL format');
        console.error('Expected: cloudinary://api_key:api_secret@cloud_name');
        console.error('Got:', process.env.CLOUDINARY_URL);
    }
} else {
    console.error('❌ CLOUDINARY_URL not found in .env file');
}

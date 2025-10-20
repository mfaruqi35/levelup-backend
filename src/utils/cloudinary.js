import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
    // Parse CLOUDINARY_URL: cloudinary://api_key:api_secret@cloud_name
    const urlParts = process.env.CLOUDINARY_URL;
    const matches = urlParts.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
    
    if (matches) {
        cloudinary.config({
            cloud_name: matches[3],
            api_key: matches[1],
            api_secret: matches[2],
            secure: true
        });
        console.log('✅ Cloudinary configured successfully');
        console.log('Cloud Name:', matches[3]);
    } else {
        console.error('❌ Invalid CLOUDINARY_URL format');
        console.error('Expected format: cloudinary://api_key:api_secret@cloud_name');
    }
} else {
    console.error('❌ CLOUDINARY_URL not found in environment variables');
}

export const uploadToCloudinary = async (filePath, folder = 'umkm') => {
    try {
        console.log('☁️ Starting Cloudinary upload...');
        console.log('📁 File path:', filePath);
        console.log('📂 Target folder:', folder);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        // Check file size
        const stats = fs.statSync(filePath);
        console.log('📊 File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
        
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto',
            transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });

        console.log('✅ Upload successful!');
        console.log('🔗 URL:', result.secure_url);

        // Delete local file after upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ Local file deleted');
        }

        return result;
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        console.error('Error details:', error.message);
        if (error.http_code) {
            console.error('HTTP Code:', error.http_code);
        }
        
        // Delete local file if upload fails
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ Local file cleaned up after error');
        }
        
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete image from Cloudinary');
    }
};

export const uploadMultipleToCloudinary = async (filePaths, folder = 'umkm') => {
    try {
        const uploadPromises = filePaths.map(filePath => 
            uploadToCloudinary(filePath, folder)
        );
        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error('Multiple upload error:', error);
        throw new Error('Failed to upload multiple images');
    }
};

export default cloudinary;
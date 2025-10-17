import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

if (process.env.CLOUDINARY_URL) {
    // Cloudinary will automatically parse CLOUDINARY_URL
    cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL
    });
} else {
    // Fallback to manual configuration
    const urlParts = process.env.CLOUDINARY_URL || '';
    const matches = urlParts.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
    
    if (matches) {
        cloudinary.config({
            cloud_name: matches[3],
            api_key: matches[1],
            api_secret: matches[2]
        });
    } else {
        console.error('Invalid CLOUDINARY_URL format');
    }
}

export const uploadToCloudinary = async (filePath, folder = 'umkm') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto',
            transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });

        // Delete local file after upload
        fs.unlinkSync(filePath);

        return result;
    } catch (error) {
        // Delete local file if upload fails
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image to Cloudinary');
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
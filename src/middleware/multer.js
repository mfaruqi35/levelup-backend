import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created');
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        console.log(`📁 Saving file: ${filename}`);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    console.log(`🔍 Filtering file: ${file.originalname}, mimetype: ${file.mimetype}`);
    
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        console.log(`✅ File accepted: ${file.originalname}`);
        return cb(null, true);
    } else {
        console.log(`❌ File rejected: ${file.originalname}`);
        cb(new Error(`Only images and PDF files are allowed. Got: ${file.mimetype}`));
    }
};

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});
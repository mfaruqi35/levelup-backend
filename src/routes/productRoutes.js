import express from 'express';
import { addProduct, getAllProducts, getMyProducts, updateProduct, deleteProduct, getProductById } from '../controllers/productsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/multer.js';

const router = express.Router();

// Public route
router.get('/all', getAllProducts);
router.get('/:id', getProductById);

// Protected routes (seller only)
router.post('/add', verifyToken, upload.single('thumbnail'), addProduct);
router.get('/my-products', verifyToken, getMyProducts);
router.put('/update/:id', verifyToken, upload.single('thumbnail'), updateProduct);
router.delete('/delete/:id', verifyToken, deleteProduct);

export default router;

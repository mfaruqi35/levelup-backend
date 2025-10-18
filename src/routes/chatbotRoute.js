import express from 'express';
import { 
    chatbotQuery, 
    chatbotSearchProducts, 
    chatbotSellerInsights,
    getChatHistory 
} from '../controllers/chatbotController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Main chatbot endpoint (buyer & seller)
router.post('/query', verifyToken, chatbotQuery);

// Buyer specific - product search
router.post('/search', verifyToken, chatbotSearchProducts);

// Seller specific - business insights
router.get('/insights', verifyToken, chatbotSellerInsights);

// Get chat history
router.get('/history', verifyToken, getChatHistory);

export default router;
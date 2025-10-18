import express from 'express';
import { 
    chatbotQuery, 
    chatbotSearchProducts, 
    chatbotSellerInsights,
    getChatHistory 
} from '../controllers/chatbotController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Main chatbot endpoint (buyer & seller)
router.post('/query', authenticateToken, chatbotQuery);

// Buyer specific - product search
router.post('/search', authenticateToken, chatbotSearchProducts);

// Seller specific - business insights
router.get('/insights', authenticateToken, chatbotSellerInsights);

// Get chat history
router.get('/history', authenticateToken, getChatHistory);

export default router;
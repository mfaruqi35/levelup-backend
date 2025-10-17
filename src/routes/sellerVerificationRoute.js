import express from 'express';
import {
    requestSellerVerification,
    getPendingVerifications,
    getVerificationById,
    approveVerification,
    rejectVerification,
    getMyVerificationStatus
} from '../controllers/sellerVerificationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// User routes (must be logged in)
router.post(
    '/request',
    verifyToken,
    upload.fields([
        { name: 'id_card', maxCount: 1 },
        { name: 'business_permit', maxCount: 1 }
    ]),
    requestSellerVerification
);
router.get('/my-status', verifyToken, getMyVerificationStatus);

// Admin routes
router.get('/pending', verifyToken, getPendingVerifications);
router.get('/:id', verifyToken, getVerificationById);
router.put('/:id/approve', verifyToken, approveVerification);
router.put('/:id/reject', verifyToken, rejectVerification);

export default router;
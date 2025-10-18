import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";
import { 
    requestSellerVerification, 
    getMyVerificationStatus,
    getPendingVerifications,
    getVerificationById,
    approveVerification,
    rejectVerification
} from "../controllers/sellerVerificationController.js";

const router = express.Router();

// User routes (must be logged in)
router.post(
    '/request',
    verifyToken,
    upload.fields([
        { name: 'id_card', maxCount: 1 },
        { name: 'business_permit', maxCount: 1 },
        { name: 'foto', maxCount: 1 } // UMKM thumbnail
    ]),
    requestSellerVerification
);
router.get('/my-status', verifyToken, getMyVerificationStatus);

// Admin routes
router.get('/pending', verifyToken, getPendingVerifications);
router.get('/:id', verifyToken, getVerificationById);
router.patch('/:id/approve', verifyToken, approveVerification);
router.patch('/:id/reject', verifyToken, rejectVerification);

export default router;
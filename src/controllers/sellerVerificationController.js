import SellerVerification from "../models/sellerVerificationModel.js";
import User from "../models/usersModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

/**
 * Buyer request to become seller
 */
export const requestSellerVerification = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User tidak ditemukan",
                status: 404,
                data: null
            });
        }

        // Check if already a seller
        if (user.role === 'seller') {
            return res.status(400).json({
                message: "Anda sudah terdaftar sebagai seller",
                status: 400,
                data: null
            });
        }

        // Check if already has pending request
        const existingRequest = await SellerVerification.findOne({
            user_id: userId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                message: "Anda sudah memiliki permintaan yang sedang diproses",
                status: 400,
                data: null
            });
        }

        const {
            phone,
            address,
            business_name,
            business_type,
            business_description
        } = req.body;

        // Validate required fields
        if (!phone || !address || !business_name || !business_type || !business_description) {
            return res.status(400).json({
                message: "Semua field wajib diisi",
                status: 400,
                data: null
            });
        }

        // Validate files
        if (!req.files || !req.files.id_card) {
            return res.status(400).json({
                message: "Foto KTP wajib diupload",
                status: 400,
                data: null
            });
        }

        // Upload ID card to Cloudinary
        const idCardResult = await uploadToCloudinary(
            req.files.id_card[0].path,
            'seller-verification/id-cards'
        );

        // Upload business permit if provided
        let businessPermitUrl = null;
        if (req.files.business_permit) {
            const permitResult = await uploadToCloudinary(
                req.files.business_permit[0].path,
                'seller-verification/permits'
            );
            businessPermitUrl = permitResult.secure_url;
        }

        // Create verification request
        const verificationRequest = new SellerVerification({
            user_id: userId,
            fullname: user.fullname,
            email: user.email,
            phone,
            address,
            business_name,
            business_type,
            business_description,
            id_card_url: idCardResult.secure_url,
            business_permit_url: businessPermitUrl,
            status: 'pending'
        });

        await verificationRequest.save();

        // Update user verification status
        user.verification_status = 'pending';
        await user.save();

        return res.status(201).json({
            message: "Permintaan verifikasi seller berhasil diajukan",
            status: 201,
            data: verificationRequest
        });

    } catch (error) {
        console.error("Error requesting seller verification:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan saat mengajukan permintaan",
            status: 500,
            data: null
        });
    }
};

/**
 * Get all pending verification requests (Admin only)
 */
export const getPendingVerifications = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: "Akses ditolak. Hanya admin yang dapat melihat permintaan verifikasi",
                status: 403,
                data: null
            });
        }

        const { status } = req.query;
        let filter = {};

        if (status) {
            filter.status = status;
        } else {
            filter.status = 'pending'; // Default show pending only
        }

        const verifications = await SellerVerification.find(filter)
            .populate('user_id', 'fullname email')
            .populate('reviewed_by', 'fullname email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Berhasil mengambil data permintaan verifikasi",
            status: 200,
            data: verifications
        });

    } catch (error) {
        console.error("Error getting pending verifications:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data",
            status: 500,
            data: null
        });
    }
};

/**
 * Get verification request by ID (Admin only)
 */
export const getVerificationById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: "Akses ditolak",
                status: 403,
                data: null
            });
        }

        const verification = await SellerVerification.findById(id)
            .populate('user_id', 'fullname email profile_picture')
            .populate('reviewed_by', 'fullname email');

        if (!verification) {
            return res.status(404).json({
                message: "Permintaan verifikasi tidak ditemukan",
                status: 404,
                data: null
            });
        }

        return res.status(200).json({
            message: "Berhasil mengambil detail permintaan",
            status: 200,
            data: verification
        });

    } catch (error) {
        console.error("Error getting verification by ID:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan",
            status: 500,
            data: null
        });
    }
};

/**
 * Approve seller verification (Admin only)
 */
export const approveVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: "Akses ditolak. Hanya admin yang dapat menyetujui permintaan",
                status: 403,
                data: null
            });
        }

        const verification = await SellerVerification.findById(id);
        if (!verification) {
            return res.status(404).json({
                message: "Permintaan verifikasi tidak ditemukan",
                status: 404,
                data: null
            });
        }

        if (verification.status !== 'pending') {
            return res.status(400).json({
                message: `Permintaan sudah ${verification.status}`,
                status: 400,
                data: null
            });
        }

        // Update verification status
        verification.status = 'approved';
        verification.reviewed_by = adminId;
        verification.reviewed_at = new Date();
        await verification.save();

        // Update user role to seller
        const user = await User.findById(verification.user_id);
        if (user) {
            user.role = 'seller';
            user.verification_status = 'verified';
            user.phone = verification.phone;
            user.address = verification.address;
            await user.save();

            // Generate new token with updated role
            const payload = {
                userId: user._id,
                email: user.email,
                role: 'seller',
            };

            const JWT_SECRET = process.env.JWT_SECRET;
            const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

            return res.status(200).json({
                message: "Permintaan verifikasi disetujui",
                status: 200,
                data: {
                    verification,
                    user,
                    newToken // Send new token to user
                }
            });
        }

        return res.status(404).json({
            message: "User tidak ditemukan",
            status: 404,
            data: null
        });

    } catch (error) {
        console.error("Error approving verification:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan",
            status: 500,
            data: null
        });
    }
};

/**
 * Reject seller verification (Admin only)
 */
export const rejectVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const adminId = req.user.userId;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: "Akses ditolak. Hanya admin yang dapat menolak permintaan",
                status: 403,
                data: null
            });
        }

        if (!rejection_reason) {
            return res.status(400).json({
                message: "Alasan penolakan wajib diisi",
                status: 400,
                data: null
            });
        }

        const verification = await SellerVerification.findById(id);
        if (!verification) {
            return res.status(404).json({
                message: "Permintaan verifikasi tidak ditemukan",
                status: 404,
                data: null
            });
        }

        if (verification.status !== 'pending') {
            return res.status(400).json({
                message: `Permintaan sudah ${verification.status}`,
                status: 400,
                data: null
            });
        }

        // Update verification status
        verification.status = 'rejected';
        verification.rejection_reason = rejection_reason;
        verification.reviewed_by = adminId;
        verification.reviewed_at = new Date();
        await verification.save();

        // Update user verification status
        const user = await User.findById(verification.user_id);
        if (user) {
            user.verification_status = 'rejected';
            await user.save();
        }

        return res.status(200).json({
            message: "Permintaan verifikasi ditolak",
            status: 200,
            data: verification
        });

    } catch (error) {
        console.error("Error rejecting verification:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan",
            status: 500,
            data: null
        });
    }
};

/**
 * Get my verification status (User)
 */
export const getMyVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.userId;

        const verification = await SellerVerification.findOne({ user_id: userId })
            .sort({ createdAt: -1 })
            .populate('reviewed_by', 'fullname email');

        if (!verification) {
            return res.status(404).json({
                message: "Anda belum mengajukan permintaan verifikasi",
                status: 404,
                data: null
            });
        }

        return res.status(200).json({
            message: "Berhasil mengambil status verifikasi",
            status: 200,
            data: verification
        });

    } catch (error) {
        console.error("Error getting verification status:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan",
            status: 500,
            data: null
        });
    }
};
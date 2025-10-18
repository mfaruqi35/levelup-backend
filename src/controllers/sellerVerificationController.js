import SellerVerification from '../models/sellerVerificationModel.js';
import User from '../models/usersModel.js';
import Umkm from '../models/umkmsModel.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Request seller verification + Create UMKM (User)
export const requestSellerVerification = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User tidak ditemukan',
                status: 404,
                data: null
            });
        }

        // Check if user already a seller
        if (user.role === 'seller') {
            return res.status(400).json({
                message: 'Anda sudah menjadi seller',
                status: 400,
                data: null
            });
        }

        // Check if already has pending verification
        const existingVerification = await SellerVerification.findOne({
            user_id: userId,
            status: 'pending'
        });

        if (existingVerification) {
            return res.status(400).json({
                message: 'Anda sudah memiliki permintaan verifikasi yang sedang diproses',
                status: 400,
                data: null
            });
        }

        // Extract data from request
        const {
            full_name,
            email,
            phone,
            nama_umkm,
            caption,
            latitude,
            longitude,
            alamat,
            category_id
        } = req.body;

        // Validate required fields
        if (!full_name || !email || !phone || !nama_umkm || !latitude || !longitude || !alamat || !category_id) {
            return res.status(400).json({
                message: 'Semua field wajib diisi',
                status: 400,
                data: null
            });
        }

        // Validate coordinates
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                message: 'Latitude dan Longitude harus berupa angka',
                status: 400,
                data: null
            });
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                message: 'Koordinat tidak valid',
                status: 400,
                data: null
            });
        }

        // Validate files
        if (!req.files || !req.files.id_card || !req.files.business_permit) {
            return res.status(400).json({
                message: 'KTP dan izin usaha wajib diunggah',
                status: 400,
                data: null
            });
        }

        // Upload documents to Cloudinary
        console.log('☁️ Uploading documents to Cloudinary...');
        
        const idCardUpload = await uploadToCloudinary(req.files.id_card[0].path);
        const businessPermitUpload = await uploadToCloudinary(req.files.business_permit[0].path);

        // Upload UMKM thumbnail if exists
        let thumbnailUrl = null;
        if (req.files.foto && req.files.foto[0]) {
            console.log('☁️ Uploading UMKM thumbnail...');
            const thumbnailUpload = await uploadToCloudinary(req.files.foto[0].path);
            thumbnailUrl = thumbnailUpload.secure_url;
        }

        console.log('✅ Files uploaded successfully');

        // Create verification request with UMKM data
        const verification = new SellerVerification({
            user_id: userId,
            full_name,
            email,
            phone,
            nama_umkm,
            caption: caption || null,
            thumbnail: thumbnailUrl,
            latitude: lat,
            longitude: lng,
            location: {
                type: "Point",
                coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
            },
            alamat,
            category_id,
            id_card_url: idCardUpload.secure_url,
            business_permit_url: businessPermitUpload.secure_url,
            status: 'pending'
        });

        await verification.save();

        console.log('✅ Verification request created:', verification._id);

        return res.status(201).json({
            message: 'Permintaan verifikasi berhasil dikirim. UMKM Anda akan dibuat setelah disetujui admin.',
            status: 201,
            data: verification
        });

    } catch (error) {
        console.error('❌ Error requesting verification:', error);
        return res.status(500).json({
            message: error.message || 'Internal server error',
            status: 500,
            data: null
        });
    }
};

// Get user's verification status
export const getMyVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.userId;

        const verification = await SellerVerification.findOne({ user_id: userId })
            .sort({ createdAt: -1 })
            .populate('category_id', 'nama_kategori')
            .populate('created_umkm_id', 'nama_umkm thumbnail')
            .select('-__v');

        if (!verification) {
            return res.status(404).json({
                message: 'Belum ada permintaan verifikasi',
                status: 404,
                data: null
            });
        }

        return res.status(200).json({
            message: 'Berhasil mengambil status verifikasi',
            status: 200,
            data: verification
        });

    } catch (error) {
        console.error('Error getting verification status:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: 500,
            data: null
        });
    }
};

// Get all pending verifications (Admin only)
export const getPendingVerifications = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Hanya admin yang bisa mengakses',
                status: 403,
                data: null
            });
        }

        const verifications = await SellerVerification.find({ status: 'pending' })
            .populate('user_id', 'fullname email')
            .populate('category_id', 'nama_kategori')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Berhasil mengambil data verifikasi pending',
            status: 200,
            data: verifications
        });

    } catch (error) {
        console.error('Error getting pending verifications:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: 500,
            data: null
        });
    }
};

// Get verification by ID (Admin only)
export const getVerificationById = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Hanya admin yang bisa mengakses',
                status: 403,
                data: null
            });
        }

        const { id } = req.params;

        const verification = await SellerVerification.findById(id)
            .populate('user_id', 'fullname email')
            .populate('category_id', 'nama_kategori')
            .populate('created_umkm_id', 'nama_umkm thumbnail alamat');

        if (!verification) {
            return res.status(404).json({
                message: 'Verifikasi tidak ditemukan',
                status: 404,
                data: null
            });
        }

        return res.status(200).json({
            message: 'Berhasil mengambil data verifikasi',
            status: 200,
            data: verification
        });

    } catch (error) {
        console.error('Error getting verification:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: 500,
            data: null
        });
    }
};

// Approve verification (Admin only) - Auto create UMKM
export const approveVerification = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Hanya admin yang bisa approve',
                status: 403,
                data: null
            });
        }

        const { id } = req.params;
        const { admin_notes } = req.body;

        const verification = await SellerVerification.findById(id);

        if (!verification) {
            return res.status(404).json({
                message: 'Verifikasi tidak ditemukan',
                status: 404,
                data: null
            });
        }

        if (verification.status !== 'pending') {
            return res.status(400).json({
                message: 'Verifikasi sudah diproses',
                status: 400,
                data: null
            });
        }

        // Update user role to seller
        await User.findByIdAndUpdate(verification.user_id, { role: 'seller' });

        // Create UMKM automatically
        const newUmkm = new Umkm({
            nama_umkm: verification.nama_umkm,
            caption: verification.caption,
            thumbnail: verification.thumbnail || '',
            latitude: verification.latitude,
            longitude: verification.longitude,
            location: verification.location,
            alamat: verification.alamat,
            category_id: verification.category_id,
            seller_id: verification.user_id,
        });

        await newUmkm.save();

        console.log('✅ UMKM created:', newUmkm._id);

        // Update verification status
        verification.status = 'approved';
        verification.reviewed_by = req.user.userId;
        verification.reviewed_at = new Date();
        verification.admin_notes = admin_notes || '';
        verification.created_umkm_id = newUmkm._id;
        await verification.save();

        console.log(`✅ Verification ${id} approved by admin ${req.user.userId}`);

        return res.status(200).json({
            message: 'Verifikasi disetujui. User sekarang menjadi seller dan UMKM telah dibuat.',
            status: 200,
            data: {
                verification,
                umkm: newUmkm
            }
        });

    } catch (error) {
        console.error('Error approving verification:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: 500,
            data: null
        });
    }
};

// Reject verification (Admin only)
export const rejectVerification = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Hanya admin yang bisa reject',
                status: 403,
                data: null
            });
        }

        const { id } = req.params;
        const { admin_notes } = req.body;

        if (!admin_notes) {
            return res.status(400).json({
                message: 'Alasan penolakan wajib diisi',
                status: 400,
                data: null
            });
        }

        const verification = await SellerVerification.findById(id);

        if (!verification) {
            return res.status(404).json({
                message: 'Verifikasi tidak ditemukan',
                status: 404,
                data: null
            });
        }

        if (verification.status !== 'pending') {
            return res.status(400).json({
                message: 'Verifikasi sudah diproses',
                status: 400,
                data: null
            });
        }

        // Update verification status
        verification.status = 'rejected';
        verification.reviewed_by = req.user.userId;
        verification.reviewed_at = new Date();
        verification.admin_notes = admin_notes;
        await verification.save();

        console.log(`❌ Verification ${id} rejected by admin ${req.user.userId}`);

        return res.status(200).json({
            message: 'Verifikasi ditolak',
            status: 200,
            data: verification
        });

    } catch (error) {
        console.error('Error rejecting verification:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: 500,
            data: null
        });
    }
};
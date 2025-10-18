import mongoose from "mongoose";

const sellerVerificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    
    // Personal Info
    full_name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    
    // UMKM Info (Digabung)
    nama_umkm: {
        type: String,
        required: true,
    },
    caption: {
        type: String,
        default: null,
    },
    thumbnail: {
        type: String,
        default: null,
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        }
    },
    alamat: {
        type: String,
        required: true,
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    
    // Documents
    id_card_url: {
        type: String,
        required: true,
    },
    business_permit_url: {
        type: String,
        required: true,
    },
    
    // Verification Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    admin_notes: {
        type: String,
        default: null,
    },
    reviewed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    reviewed_at: {
        type: Date,
        default: null,
    },
    
    // Created UMKM ID (after approval)
    created_umkm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Umkm",
        default: null,
    },
}, {
    timestamps: true
});

// Geospatial index
sellerVerificationSchema.index({ location: '2dsphere' });

const SellerVerification = mongoose.model("SellerVerification", sellerVerificationSchema);
export default SellerVerification;
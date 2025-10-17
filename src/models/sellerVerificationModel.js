import mongoose from "mongoose";

const sellerVerificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    fullname: {
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
    address: {
        type: String,
        required: true,
    },
    business_name: {
        type: String,
        required: true,
    },
    business_type: {
        type: String,
        required: true,
    },
    business_description: {
        type: String,
        required: true,
    },
    id_card_url: {
        type: String,
        required: true, // KTP/Identity Card
    },
    business_permit_url: {
        type: String,
        default: null, // Optional: SIUP/NIB
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    rejection_reason: {
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
}, { timestamps: true });

const SellerVerification = mongoose.model("SellerVerification", sellerVerificationSchema);
export default SellerVerification;
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [
            "buyer",
            "seller",
            "admin"
        ],
        default: "buyer",
        required: "true"
    },
    profile_picture: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    verification_status: {
        type: String,
        enum: ['none', 'pending', 'verified', 'rejected'],
        default: 'none',
    },

    created_at:{
        type: Date,
        default: Date.now()
    },
    updated_at:{
        type: Date,
        default: Date.now()
    }

});

const User = mongoose.model("User", userSchema);
export default User;
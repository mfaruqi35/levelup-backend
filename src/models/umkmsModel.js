import mongoose from "mongoose";

const umkmsSchema = new mongoose.Schema({
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
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    alamat: {
        type: String,
        required: true,
    },
    seller_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: Date.now()
    }
})

const Umkm = mongoose.model("Umkm", umkmsSchema)
export default Umkm;
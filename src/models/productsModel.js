import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    umkm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Umkm",
        required: true,
    },
    nama_product: {
        type: String,
        required: true,
    },
    deskripsi_produk: {
        type: String,
    },
    harga: {
        type: Number,
        required: true
    },
    thumbnail:{
        type: String,
        default: null,
    },
    created_at:{
        type: Date,
        default: Date.now
    },
    updated_at:{
        type:Date,
        default: Date.now
    },

});

const Product = new mongoose.model("Product", productSchema)
export default Product
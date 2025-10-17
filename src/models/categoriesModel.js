import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    nama_kategori: {
        type: String,
        required: true,
    },

    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    created_at: {
        type: Date,
        default: Date.now,
    },

    updated_at: {
        type: Date,
        default: Date.now
    }
});

const Category = new mongoose.model("Category", categorySchema);
export default Category;
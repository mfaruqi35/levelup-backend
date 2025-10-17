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
        default: null,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default:'Point'
        },
        coordinates: {
            type: [Number],
            required: true,
        },
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
        default: null,
        // required: true,
    },
}, { timestamps: true });

umkmsSchema.index({ location: "2dsphere" })
umkmsSchema.pre('save', function(next){
    if (this.latitude && this.longitude){
        this.location = {
            type: 'Point',
            coordinates: [this.longitude, this.latitude],
        };
    }
    next();
});

const Umkm = mongoose.model("Umkm", umkmsSchema)
export default Umkm;
import Product from "../models/productsModel";
import Umkm from "../models/umkmsModel";
import { uploadToCloudinary } from "../utils/cloudinary";
import fs from "fs";

export const addProduct = async (req, res) => {
    try {
        const sellerId = req.user.userId;
        if (req.user.role !== 'seller'){
            return res.status(403).json({
                message: "Akses ditolak. Hanya seller yang diizinkan",
                status: 403,
                data: null
            });
        }
        const { umkm_id, nama_product, deskripsi_product, harga } = req.body;
        if (!umkm_id || !nama_product || !deskripsi_product || !harga) {
            return res.status(400).json({
                message: "Semua field wajib diisi",
                status: 400,
                data: null,
            });
        }

        const pricceNum = parseFloat(harga);
        if(isNaN(pricceNum) || pricceNum < 0){
            return res.status(400).json({
                message: "Harga harus berupa angka positif",
                status: 400,
                data: null,
            });
        }
        const umkm = await Umkm.findById(umkm_id);
        if (!umkm) {
            return res.status(404).json({
                message: "UMKM tidak ditemukan",
                status: 404,
                data: null,
            });
        }
        if (umkm.seller_id.toString() !== sellerId){
            return res.status(403).json({
                message: "Akses ditolak. UMKM tidak dimiliki oleh seller ini",
                status: 403,
                data: null,
            });
        }
    
        let thumbnailUrl = null;
        if (req.file){
            try {
                const upload = await uploadToCloudinary(req.file.path, "products_thumbnails");
                thumbnail = upload.secure_url;
            } catch (error) {
                console.error("Error uploading thumbnail:", error);
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({
                    message: "Gagal mengunggah thumbnail",
                    status: 500,
                    data: null,
                });
            }
        }
        const newProduct = new Product({
            umkm_id,
            nama_product,
            deskripsi_produk: deskripsi_product || '',
            harga: pricceNum,
            thumbnail: thumbnailUrl,
        });

        await newProduct.save();

        return res.status(201).json({
            message: "Produk berhasil ditambahkan",
            status: 201,
            data: newProduct,
        });

    } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null,
        });
    }

}

export const getAllProducts = async (req, res) => {
    try{
        const products = await Product
            .find()
            .select("nama_product thumbnail harga");
        
        return res.status(200).json({ 
            message: "Data produk berhasil di fetch",
            status: 200,
            data: products,
        })

    } catch (error) {
        res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null
        });
    }
}

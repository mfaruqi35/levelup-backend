import Product from "../models/productsModel.js";
import Umkm from "../models/umkmsModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
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
        if (!umkm_id || !nama_product || !harga) {
            return res.status(400).json({
                message: "UMKM, nama produk, dan harga wajib diisi",
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
                thumbnailUrl = upload.secure_url;
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

export const getMyProducts = async (req, res) => {
    try {
        const sellerId = req.user.userId;

        if(req.user.role !== 'seller'){
            return res.status(403).json({
                message: "Akses ditolak. Hanya seller yang diizinkan",
                status: 403,
                data: null
            });
        }
        const umkms = await Umkm.find({ seller_id: sellerId}).select("_id nama_umkm");

        if (!umkms || umkms.length === 0){
            return res.status(404).json({
                message: "Anda belum memiliki umkm",
                status: 404,
                data: null
            });
        }

        const umkmIds = umkms.map(umkm => umkm._id);

        const products = await Product.find({ umkm_id: { $in: umkmIds } });

        return res.status(200).json({
            message: "Produk berhasil ditemukan",
            status: 200,
            data: products
        });

    } catch (error) {
        console.error("Error getting seller products:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null,
        });
    }
}

export const updateProduct = async (req, res) => {
    try {
        const sellerId = req.user.userId;
        const { id } = req.params;

        console.log('📝 UPDATE PRODUCT REQUEST');
        console.log('Product ID:', id);
        console.log('Seller ID:', sellerId);

        if (req.user.role !== 'seller') {
            return res.status(403).json({
                message: "Akses ditolak. Hanya seller yang diizinkan",
                status: 403,
                data: null
            });
        }

        // Find product
        const product = await Product.findById(id).populate('umkm_id');

        if (!product) {
            return res.status(404).json({
                message: "Produk tidak ditemukan",
                status: 404,
                data: null,
            });
        }

        // Check ownership
        if (product.umkm_id.seller_id.toString() !== sellerId) {
            return res.status(403).json({
                message: "Akses ditolak. Produk ini bukan milik Anda",
                status: 403,
                data: null,
            });
        }

        const { nama_product, deskripsi_product, harga } = req.body;

        // Update fields
        if (nama_product) product.nama_product = nama_product;
        if (deskripsi_product !== undefined) product.deskripsi_produk = deskripsi_product;
        
        if (harga) {
            const priceNum = parseFloat(harga);
            if (isNaN(priceNum) || priceNum <= 0) {
                return res.status(400).json({
                    message: "Harga harus berupa angka positif",
                    status: 400,
                    data: null,
                });
            }
            product.harga = priceNum;
        }

        // Upload new thumbnail if provided
        if (req.file) {
            try {
                console.log('☁️ Uploading new thumbnail...');
                const upload = await uploadToCloudinary(req.file.path);
                product.thumbnail = upload.secure_url;
                console.log('✅ New thumbnail uploaded');
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

        product.updated_at = Date.now();
        await product.save();

        console.log('✅ Product updated:', product._id);

        return res.status(200).json({
            message: "Produk berhasil diupdate",
            status: 200,
            data: product,
        });

    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null,
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const sellerId = req.user.userId;
        const { id } = req.params;

        console.log('🗑️ DELETE PRODUCT REQUEST');
        console.log('Product ID:', id);
        console.log('Seller ID:', sellerId);

        if (req.user.role !== 'seller') {
            return res.status(403).json({
                message: "Akses ditolak. Hanya seller yang diizinkan",
                status: 403,
                data: null
            });
        }

        // Find product
        const product = await Product.findById(id).populate('umkm_id');

        if (!product) {
            return res.status(404).json({
                message: "Produk tidak ditemukan",
                status: 404,
                data: null,
            });
        }

        // Check ownership
        if (product.umkm_id.seller_id.toString() !== sellerId) {
            return res.status(403).json({
                message: "Akses ditolak. Produk ini bukan milik Anda",
                status: 403,
                data: null,
            });
        }

        await Product.findByIdAndDelete(id);

        console.log('✅ Product deleted:', id);

        return res.status(200).json({
            message: "Produk berhasil dihapus",
            status: 200,
            data: { deleted_id: id },
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null,
        });
    }
};

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

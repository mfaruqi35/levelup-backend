import Umkm from "../models/umkmsModel"
import axios from "axios";

export const createUmkm = async (req, res) => {
    try {
        if (req.user.role !== 'seller'){
            return res.status(403).json({
                message: "Hanya seller yang bisa menambahkan UMKM",
                status: 403,
                data: null,
            });
        }

        const { nama_umkm, caption, latitude, longitude, alamat, category_id } = req.body;

        if(!nama_umkm || !category_id || !latitude || !longitude || !alamat){
            return res.status(400).json({
                message: "Nama UMKM, Kategori, Latitude, Longitude, dan Alamat wajib diisi",
                status: 400,
                data: null,
            });
        }
        let thumbnail = "";
        if (req.file){
            const result = await uploadToCloudinary(req.file.path);
            thumbnail = result.secure_url;
        }
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            status: 500,
            data: null,
        });
    }
}

export const getAllUmkm = async (req, res) => {
    try {
        const umkms = await Umkm.find().select("nama_umkm thumbnail")
    } catch (error) {
        
    }
}

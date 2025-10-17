import Umkm from "../models/umkmsModel"

export const getAllUmkm = async (req, res) => {
    try {
        const umkms = await Umkm.find().select("nama_umkm")
    } catch (error) {
        
    }
}
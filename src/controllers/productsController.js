import Product from "../models/productsModel";

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
        res.status(500).json({message: error.message});
    }
}
import Umkm from "../models/umkmsModel.js"
import Product from "../models/productsModel.js";
import Category from "../models/categoriesModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

function extractKeywords(query) {
    // Remove common words (stopwords in Indonesian and English)
    const stopwords = [
        'dekat', 'saya', 'aku', 'di', 'dari', 'yang', 'ada', 'cari', 'mau', 
        'ingin', 'butuh', 'perlu', 'sekitar', 'near', 'me', 'my', 'the', 
        'a', 'an', 'in', 'at', 'on', 'terdekat', 'paling', 'untuk'
    ];
    
    // Convert to lowercase and split by space
    const words = query.toLowerCase().split(/\s+/);
    
    // Filter out stopwords and short words
    const keywords = words.filter(word => 
        word.length > 2 && !stopwords.includes(word)
    );
    
    return keywords;
}

// Helper function to find category by keyword
async function findCategoryByKeyword(keywords) {
    const categories = await Category.find().lean();
    
    for (const keyword of keywords) {
        for (const category of categories) {
            const categoryName = category.nama_kategori.toLowerCase();
            // Check if keyword is in category name or vice versa
            if (categoryName.includes(keyword) || keyword.includes(categoryName)) {
                return category._id;
            }
        }
    }
    return null;
}

export const createUmkm = async (req, res) => {
    try {
        if (req.user.role !== 'seller'){
            return res.status(403).json({
                message: "Hanya seller yang bisa menambahkan UMKM",
                status: 403,
                data: null,
            });
        }

        const { nama_umkm, caption, latitude, longitude, alamat } = req.body;

        if(!nama_umkm || !latitude || !longitude || !alamat){
            return res.status(400).json({
                message: "Nama UMKM, Latitude, Longitude, dan Alamat wajib diisi",
                status: 400,
                data: null,
            });
        }

        if(isNaN(latitude) || isNaN(longitude) ||
           latitude < -90 || latitude > 90 ||
           longitude < -180 || longitude > 180){
            return res.status(400).json({
                message: "Latitude atau Longitude tidak valid",
                status: 400,
                data: null,
            });
        }

        let thumbnail = "";
        if (req.file){
            const result = await uploadToCloudinary(req.file.path);
            thumbnail = result.secure_url;
        }
        const newUmkm = new Umkm({
            nama_umkm,
            caption,
            thumbnail,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            location: {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            alamat,
            seller_id: req.user.userId,
        });

        await newUmkm.save();

        return res.status(201).json({
            message: "UMKM berhasil ditambahkan",
            status: 201,
            data: newUmkm,
        });

    } catch (error) {
        console.error("Error creating UMKM:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: 500,
            data: null,
        });
    }
}

export const getNearbyUmkm = async (req, res) => {
    try {
        const { latitude, longitude, radius = 5, kategori, search } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                message: "Latitude dan longitude diperlukan untuk mencari UMKM terdekat",
                status: 400,
                data: null
            });
        }

        const userLat = parseFloat(latitude);
        const userLng = parseFloat(longitude);
        const searchRadius = parseFloat(radius);

        if (isNaN(userLat) || isNaN(userLng) || 
            userLat < -90 || userLat > 90 || 
            userLng < -180 || userLng > 180) {
            return res.status(400).json({
                message: "Koordinat tidak valid",
                status: 400,
                data: null
            });
        }

        const radiusInMeters = searchRadius * 1000;

        // Build aggregation pipeline
        const pipeline = [
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [userLng, userLat]
                    },
                    distanceField: 'distance',
                    maxDistance: radiusInMeters,
                    spherical: true,
                    distanceMultiplier: 0.001
                }
            }
        ];

        let categoryFilter = null;
        let searchKeywords = [];

        // Process search query if provided
        if (search && search.trim()) {
            searchKeywords = extractKeywords(search);
            
            // Try to find category from keywords
            const detectedCategoryId = await findCategoryByKeyword(searchKeywords);
            
            if (detectedCategoryId && !kategori) {
                categoryFilter = detectedCategoryId;
            }
            
            // Build search conditions
            const searchConditions = [];
            
            // Search in nama_umkm for each keyword
            searchKeywords.forEach(keyword => {
                searchConditions.push({ nama_umkm: { $regex: keyword, $options: 'i' } });
                searchConditions.push({ alamat: { $regex: keyword, $options: 'i' } });
                searchConditions.push({ caption: { $regex: keyword, $options: 'i' } });
            });
            
            if (searchConditions.length > 0) {
                pipeline.push({
                    $match: {
                        $or: searchConditions
                    }
                });
            }
        }

        // Add category filter
        if (kategori) {
            pipeline.push({
                $match: {
                    category_id: new mongoose.Types.ObjectId(kategori)
                }
            });
        } else if (categoryFilter) {
            pipeline.push({
                $match: {
                    category_id: categoryFilter
                }
            });
        }

        // Populate references
        pipeline.push(
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'seller_id',
                    foreignField: '_id',
                    as: 'seller'
                }
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$seller',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    nama_umkm: 1,
                    thumbnail: 1,
                    caption: 1,
                    alamat: 1,
                    latitude: 1,
                    longitude: 1,
                    distance: 1,
                    kategori: '$category.nama_kategori',
                    kategori_id: '$category._id',
                    seller: '$seller.fullname'
                }
            },
            {
                $sort: { distance: 1 }
            }
        );

        const nearbyUmkms = await Umkm.aggregate(pipeline);

        const formattedUmkms = nearbyUmkms.map(umkm => ({
            ...umkm,
            kategori: umkm.kategori || 'Tidak ada kategori',
            seller: umkm.seller || 'Unknown',
            distance: parseFloat(umkm.distance.toFixed(2)),
            distanceText: `${umkm.distance.toFixed(1)} km`
        }));

        return res.status(200).json({
            message: `Ditemukan ${formattedUmkms.length} UMKM dalam radius ${searchRadius} km`,
            status: 200,
            data: {
                umkms: formattedUmkms,
                userLocation: {
                    latitude: userLat,
                    longitude: userLng
                },
                searchParams: {
                    radius: searchRadius,
                    kategori: kategori || (categoryFilter ? 'Auto-detected' : 'Semua kategori'),
                    search: search || null,
                    detectedKeywords: searchKeywords
                },
                totalFound: formattedUmkms.length
            }
        });

    } catch (error) {
        console.error("Error getting nearby UMKM:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan saat mencari UMKM terdekat",
            status: 500,
            data: null
        });
    }
};

export const smartSearchUmkm = async (req, res) => {
    try {
        const { query, latitude, longitude, radius = 5 } = req.query;

        if (!query || !latitude || !longitude) {
            return res.status(400).json({
                message: "Query, latitude, dan longitude diperlukan",
                status: 400,
                data: null
            });
        }

        const userLat = parseFloat(latitude);
        const userLng = parseFloat(longitude);
        const searchRadius = parseFloat(radius);
        const radiusInMeters = searchRadius * 1000;

        // Extract keywords
        const keywords = extractKeywords(query);
        
        // Find category
        const categoryId = await findCategoryByKeyword(keywords);

        // Build pipeline
        const pipeline = [
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [userLng, userLat]
                    },
                    distanceField: 'distance',
                    maxDistance: radiusInMeters,
                    spherical: true,
                    distanceMultiplier: 0.001
                }
            }
        ];

        // Add category filter if detected
        if (categoryId) {
            pipeline.push({
                $match: {
                    category_id: categoryId
                }
            });
        }

        // Add text search if we still have keywords after category detection
        const remainingKeywords = keywords;
        if (remainingKeywords.length > 0) {
            const searchConditions = [];
            remainingKeywords.forEach(keyword => {
                searchConditions.push({ nama_umkm: { $regex: keyword, $options: 'i' } });
                searchConditions.push({ caption: { $regex: keyword, $options: 'i' } });
            });
            
            if (searchConditions.length > 0) {
                pipeline.push({
                    $match: {
                        $or: searchConditions
                    }
                });
            }
        }

        pipeline.push(
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    nama_umkm: 1,
                    thumbnail: 1,
                    caption: 1,
                    alamat: 1,
                    latitude: 1,
                    longitude: 1,
                    distance: 1,
                    kategori: '$category.nama_kategori'
                }
            },
            {
                $sort: { distance: 1 }
            }
        );

        const results = await Umkm.aggregate(pipeline);

        const formattedResults = results.map(umkm => ({
            ...umkm,
            kategori: umkm.kategori || 'Tidak ada kategori',
            distance: parseFloat(umkm.distance.toFixed(2)),
            distanceText: `${umkm.distance.toFixed(1)} km`
        }));

        return res.status(200).json({
            message: `Ditemukan ${formattedResults.length} hasil untuk "${query}"`,
            status: 200,
            data: {
                umkms: formattedResults,
                searchInfo: {
                    originalQuery: query,
                    detectedKeywords: keywords,
                    detectedCategory: categoryId ? 'Yes' : 'No',
                    radius: searchRadius
                }
            }
        });

    } catch (error) {
        console.error("Error in smart search:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan saat pencarian",
            status: 500,
            data: null
        });
    }
};

export const getAllUmkm = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        const umkms = await Umkm.find()
            .select("nama_umkm thumbnail longitude latitude alamat category_id")
            .populate("category_id", "nama_kategori");
        
        const umkmsWithDetails = await Promise.all(
            umkms.map(async (umkm) => {
                const products = await Product.find({ umkm_id: umkm._id})
                    .select("harga")
                    .sort({ harga: 1 });
                
                let priceRange = "Belum ada produk";
                if (products.length > 0){
                    const minPrice = products[0].harga;
                    const maxPrice = products[products.length -1].harga;

                    if (minPrice === maxPrice){
                        priceRange = `Rp ${minPrice.toLocaleString('id-ID')}`;
                    } else {
                        priceRange = `Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`;
                    }
                }

                let distance = null;
                if (latitude && longitude){
                    distance = calculateDistance(
                        parseFloat(latitude),
                        parseFloat(longitude),
                        umkm.latitude,
                        umkm.longitude
                    );
                }

                return {
                    _id: umkm._id,
                    nama_umkm: umkm.nama_umkm,
                    thumbnail: umkm.thumbnail,
                    alamat: umkm.alamat,
                    kategori: umkm.category_id?.nama_kategori || "Belum di kategorikan",
                    kategori_id: umkm.category_id?._id || null,
                    priceRange: priceRange,
                    distance: distance !== null ? `${distance.toFixed(2)} km` : null,
                    latitude: umkm.latitude,
                    longitude: umkm.longitude,
                }
            })
        );
        if (latitude && longitude){
            umkmsWithDetails.sort((a, b) => {
                const distA = parseFloat(a.distance) || Infinity;
                const distB = parseFloat(b.distance) || Infinity;
                return distA - distB;
            });
        }
        return res.status(200).json({
            message: "Berhasil mengambil data UMKM",
            status: 200,
            data: umkmsWithDetails,
        });
    } catch (error) {
        console.error("Error getting all UMKM:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: 500,
            data: null,
        });
    }
}

export const getUmkmById = async (req, res) => {
    try{
        const { id } = req.params;
        const { latitude, longitude } = req.query;
        const umkm = await Umkm.findById(id)
        .populate("category_id", "nama_kategori")
        .populate("seller_id", "fullname email");
        if (!umkm){
            return res.status(404).json({
                message: "UMKM tidak ditemukan",
                status: 404,
                data: null,
            });
        }

        const products = await Product.find({ umkm_id: umkm._id}).select("nama_product harga thumbnail deskripsi_produk");

        let distance = null;
        if (latitude && longitude){
            distance = calculateDistance(
                parseFloat(latitude),
                parseFloat(longitude),
                umkm.latitude,
                umkm.longitude
            );
        }

        const umkmDetail = {
            ...umkm.toObject(),
            products,
            distance: distance ? `${distance.toFixed(1)} km` : null
        };

        return res.status(200).json({
            message: "Berhasil mengambil data UMKM",
            status: 200,
            data: umkmDetail,
        });
        
    } catch (error) {
        console.error("Error getting UMKM by ID:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: 500,
            data: null,
        });
    }
}

export const getUmkmNearby = async (req, res) => {
    try {
        const { latitude, longitude , radius = 5, kategori, search} = req.query;

        if (!latitude || !longitude){

        }
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            status: 500,
            data: null,
        });
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}
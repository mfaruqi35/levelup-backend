import Category from "../models/categoriesModel.js";

// Create Category (Admin only in production, but flexible for development)
export const createCategory = async (req, res) => {
    try {
        const { nama_kategori } = req.body;

        // Validate input
        if (!nama_kategori || nama_kategori.trim() === '') {
            return res.status(400).json({
                message: "Nama kategori wajib diisi",
                status: 400,
                data: null,
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ 
            nama_kategori: { $regex: new RegExp(`^${nama_kategori}$`, 'i') } 
        });

        if (existingCategory) {
            return res.status(409).json({
                message: "Kategori sudah ada",
                status: 409,
                data: existingCategory,
            });
        }

        // Create new category
        // Note: In production, only admin should create categories
        // For development, we allow any authenticated user
        const newCategory = new Category({
            nama_kategori: nama_kategori.trim(),
            admin_id: req.user.userId, // From JWT token
        });

        await newCategory.save();

        return res.status(201).json({
            message: "Kategori berhasil ditambahkan",
            status: 201,
            data: newCategory,
        });

    } catch (error) {
        console.error("Error creating category:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null,
        });
    }
};

// Get All Categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .select("_id nama_kategori created_at")
            .sort({ nama_kategori: 1 })
            .lean();

        return res.status(200).json({
            message: "Berhasil mengambil data kategori",
            status: 200,
            data: categories,
        });

    } catch (error) {
        console.error("Error getting all categories:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null,
        });
    }
};

// Get Category by ID
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id)
            .populate("admin_id", "fullname email")
            .lean();

        if (!category) {
            return res.status(404).json({
                message: "Kategori tidak ditemukan",
                status: 404,
                data: null,
            });
        }

        return res.status(200).json({
            message: "Berhasil mengambil data kategori",
            status: 200,
            data: category,
        });

    } catch (error) {
        console.error("Error getting category by ID:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null,
        });
    }
};

// Update Category (Admin only in production)
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kategori } = req.body;

        // Validate input
        if (!nama_kategori || nama_kategori.trim() === '') {
            return res.status(400).json({
                message: "Nama kategori wajib diisi",
                status: 400,
                data: null,
            });
        }

        // Check if category exists
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                message: "Kategori tidak ditemukan",
                status: 404,
                data: null,
            });
        }

        // Check if new name already exists (except current category)
        const existingCategory = await Category.findOne({
            _id: { $ne: id },
            nama_kategori: { $regex: new RegExp(`^${nama_kategori}$`, 'i') }
        });

        if (existingCategory) {
            return res.status(409).json({
                message: "Nama kategori sudah digunakan",
                status: 409,
                data: null,
            });
        }

        // Update category
        category.nama_kategori = nama_kategori.trim();
        category.updated_at = new Date();

        await category.save();

        return res.status(200).json({
            message: "Kategori berhasil diupdate",
            status: 200,
            data: category,
        });

    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null,
        });
    }
};

// Delete Category (Admin only in production)
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                message: "Kategori tidak ditemukan",
                status: 404,
                data: null,
            });
        }

        // Check if category is being used by any UMKM
        const Umkm = (await import("../models/umkmsModel.js")).default;
        const umkmCount = await Umkm.countDocuments({ category_id: id });

        if (umkmCount > 0) {
            return res.status(409).json({
                message: `Kategori tidak bisa dihapus karena sedang digunakan oleh ${umkmCount} UMKM`,
                status: 409,
                data: { umkmCount },
            });
        }

        await Category.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Kategori berhasil dihapus",
            status: 200,
            data: null,
        });

    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null,
        });
    }
};

// Search Categories
export const searchCategories = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                message: "Query pencarian wajib diisi",
                status: 400,
                data: null,
            });
        }

        const categories = await Category.find({
            nama_kategori: { $regex: query, $options: 'i' }
        })
        .select("_id nama_kategori")
        .sort({ nama_kategori: 1 })
        .lean();

        return res.status(200).json({
            message: `Ditemukan ${categories.length} kategori`,
            status: 200,
            data: categories,
        });

    } catch (error) {
        console.error("Error searching categories:", error);
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: 500,
            data: null,
        });
    }
};
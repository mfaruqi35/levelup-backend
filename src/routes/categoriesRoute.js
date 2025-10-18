import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    searchCategories,
} from "../controllers/categoriesController.js";

const categoryRouter = express.Router();

// Public routes
categoryRouter.get("/all", getAllCategories);
categoryRouter.get("/search", searchCategories);
categoryRouter.get("/:id", getCategoryById);

// Protected routes (require authentication)
// In production, add role check middleware for admin only
categoryRouter.post("/create", verifyToken, createCategory);
categoryRouter.put("/:id", verifyToken, updateCategory);
categoryRouter.delete("/:id", verifyToken, deleteCategory);

export default categoryRouter;
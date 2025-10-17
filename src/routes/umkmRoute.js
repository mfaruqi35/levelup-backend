import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { createUmkm, getAllUmkm, getNearbyUmkm, smartSearchUmkm, getUmkmById } from "../controllers/umkmsController.js";

const umkmRouter = express.Router();

umkmRouter.post("/create", verifyToken, createUmkm);
umkmRouter.get("/all", getAllUmkm);
umkmRouter.get("/nearby", getNearbyUmkm);
umkmRouter.get("/search", smartSearchUmkm);
umkmRouter.get("/:id", getUmkmById);

export default umkmRouter;
import express from "express";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import userRouter from "./routes/userRoute.js";
import umkmRouter from "./routes/umkmRoute.js";
import sellerVerificationRouter from "./routes/sellerVerificationRoute.js";
import categoryRouter from "./routes/categoriesRoute.js";
import chatbotRouter from "./routes/chatbotRoute.js";

configDotenv();

const app = express()
const PORT = process.env.PORT

mongoose.connect(process.env.MONGODB_URI)

const db = mongoose.connection;
db.on("Error", (error) => console.error(error));
db.once("Open", () => console.log("Connected to MongoDB"));

app.use(express.json())
app.use(cors({ origin: "*", optionsSuccessStatus: 200, credentials: true })); 
app.use(bodyParser.json());

app.use("/api/user", userRouter);
app.use("/api/umkm", umkmRouter);
app.use("/api/seller-verification", sellerVerificationRouter);
app.use("/api/category", categoryRouter);
app.use("/api/chatbot", chatbotRouter);

app.listen(PORT, () => console.log(`MongoDB berhasil terkoneksi pada port: ${PORT}`))
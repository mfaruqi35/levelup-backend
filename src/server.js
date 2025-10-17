import express from "express";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import userRouter from "./routes/userRoute.js";

configDotenv();

const app = express()
const PORT = process.env.PORT

mongoose.connect(process.env.MONGODB_URI)

const db = mongoose.connection;
db.on("Error", (error) => console.error(error));
db.once("Open", () => console.log("Connected to MongoDB"));

app.use(express.json())
app.use(cors({ origin: "*", optionsSuccessStatus: 200}));
app.use(bodyParser.json());

app.use("/user", userRouter)

app.listen(PORT, () => console.log(`MongoDB berhasil terkoneksi pada port: ${PORT}`))
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/usersModel.js";

export const registerUser = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        if (!fullname || !email || !password ) {
            res.status(400).json({ 
                message: "Mohon isi semua field yang diperlukan", 
                status: 400, 
                data: null });
        }

        const isAlreadyRegister = await User.findOne({ email })
        if (isAlreadyRegister){
            return res.status(400).json({ 
                message: "Pengguna dengan email ini telah terdaftar", 
                status: 400, 
                data: null
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        return res.status(201).json({ 
            message: "Pengguna berhasil didaftar ",
            status: 201,
            data: newUser
        });

    } catch(error) {
        return res.status(500).json({ message: error.message , status: 500, data: null});
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ 
                message: "Tolong isi field yang diperlukan",
                status:400,
                data: null});
        }

        const user = await User.findOne({ email: email });
        if (!user) {
            res.status(400).json({ 
                message: "User tidak ditemukan",
                status: 404,
                data: null
            });
        } 
            
        const validateUser = await bcrypt.compare(password, user.password);
        if (!validateUser){
            res.status(400).json({ message: "Password salah, coba lagi", status: 400, data: null});
        }
            
        const payload = {
            userId: user._id,
            email: user.email,
            role: user.role,
        };

        const JWT_SECRET = process.env.JWT_SECRET
        if (!JWT_SECRET) {
            console.error("JWT_SECRET tidak terdefinisi di file .env");
            return res.status(500).json({ message: "Kesalahan konfigurasi server." });
        }
                    
        const token = jwt.sign(payload, JWT_SECRET, {expiresIn: "30m"});
                    
        return res.status(200).json({
            message: "Login berhasil",
            status: 200,
            data: user,
            token: token
        });

    } catch(error) {
        res.status(500).json({ message: error.message });
    }
}

export const upgradeToSeller = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User tidak ditemukan",
                status: 404,
                data: null,
            });
        }

        if (user.role === 'seller') {
            return res.status(400).json({
                message: "User sudah berperan sebagai seller",
                status: 400,
                data: null,
            });
        }

        user.role = 'seller';
        user.updated_at = Date.now();
        await user.save();

        const payload = {
            userId: user._id,
            email: user.email,
            role: user.role,
        };
        const JWT_SECRET = process.env.JWT_SECRET;
        const token = jwt.sign(payload, JWT_SECRET, {expiresIn: "30m"});

        return res.status(200).json({
            message: "Berhasil upgrade ke seller",
            status: 200,
            data: user,
            token: token
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            status: 500,
            data: null,
        });
    }
}

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: "User tidak ditemukan",
                status: 404,
                data: null
            });
        }

        return res.status(200).json({
            message: "Profile berhasil diambil",
            status: 200,
            data: user
        });

    } catch (error) {
        console.error("Error getting user profile:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan saat mengambil profile",
            status: 500,
            data: null
        });
    }
};
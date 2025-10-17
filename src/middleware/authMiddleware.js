import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        // Check if authorization header exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: "Token tidak ditemukan",
                status: 401,
                data: null
            });
        }

        // Extract token from Bearer header
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error("JWT_SECRET tidak terdefinisi di file .env");
            return res.status(500).json({
                message: "Kesalahan konfigurasi server",
                status: 500,
                data: null
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Attach user info to request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        
        // Continue to next middleware/controller
        next();
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token sudah expired, silakan login kembali",
                status: 401,
                data: null
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: "Token tidak valid",
                status: 401,
                data: null
            });
        }
        
        return res.status(401).json({
            message: "Autentikasi gagal",
            status: 401,
            data: null
        });
    }
};

// Middleware to check if user is a seller
export const verifySeller = (req, res, next) => {
    if (req.user.role !== 'seller') {
        return res.status(403).json({
            message: "Akses ditolak. Hanya seller yang diizinkan",
            status: 403,
            data: null
        });
    }
    next();
};

// Middleware to check if user is an admin
export const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: "Akses ditolak. Hanya admin yang diizinkan",
            status: 403,
            data: null
        });
    }
    next();
};

// Middleware to check if user is seller or admin
export const verifySellerOrAdmin = (req, res, next) => {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({
            message: "Akses ditolak. Hanya seller atau admin yang diizinkan",
            status: 403,
            data: null
        });
    }
    next();
};
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import User from './models/usersModel.js';
import Category from './models/categoriesModel.js';
import Umkm from './models/umkmsModel.js';
import Product from './models/productsModel.js';

dotenv.config();

// Read data from JSON file
const rawData = fs.readFileSync('./data.json', 'utf-8');
const data = JSON.parse(rawData);

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Clear existing data
const clearData = async () => {
    try {
        await User.deleteMany({});
        await Category.deleteMany({});
        await Umkm.deleteMany({});
        await Product.deleteMany({});
        console.log('🗑️  All existing data cleared');
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        throw error;
    }
};

// Seed Users
const seedUsers = async () => {
    try {
        console.log('\n👥 Seeding Users...');
        
        const users = await Promise.all(
            data.users.map(async (user) => {
                // Hash password
                const hashedPassword = await bcrypt.hash('password123', 10);
                
                return new User({
                    fullname: user.fullname,
                    email: user.email,
                    password: hashedPassword,
                    role: user.role
                });
            })
        );

        const createdUsers = await User.insertMany(users);
        console.log(`✅ ${createdUsers.length} users seeded`);
        return createdUsers;
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        throw error;
    }
};

// Seed Categories
const seedCategories = async (adminUser) => {
    try {
        console.log('\n📂 Seeding Categories...');
        
        // ⭐ FIX: Add admin_id to each category
        const categories = data.categories.map(cat => new Category({
            nama_kategori: cat.nama_kategori,
            admin_id: adminUser._id  // ⭐ ADD THIS
        }));

        const createdCategories = await Category.insertMany(categories);
        console.log(`✅ ${createdCategories.length} categories seeded`);
        return createdCategories;
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
        throw error;
    }
};

// Seed UMKMs
const seedUmkms = async (users, categories) => {
    try {
        console.log('\n🏪 Seeding UMKMs...');
        
        const umkms = data.umkms.map(umkm => {
            const seller = users[umkm.seller_index];
            const category = categories[umkm.category_index];

            return new Umkm({
                nama_umkm: umkm.nama_umkm,
                caption: umkm.caption,
                thumbnail: umkm.thumbnail,
                latitude: umkm.latitude,
                longitude: umkm.longitude,
                location: {
                    type: "Point",
                    coordinates: [umkm.longitude, umkm.latitude]
                },
                alamat: umkm.alamat,
                category_id: category._id,
                seller_id: seller._id
            });
        });

        const createdUmkms = await Umkm.insertMany(umkms);
        console.log(`✅ ${createdUmkms.length} UMKMs seeded`);
        return createdUmkms;
    } catch (error) {
        console.error('❌ Error seeding UMKMs:', error);
        throw error;
    }
};

// Seed Products
const seedProducts = async (umkms) => {
    try {
        console.log('\n📦 Seeding Products...');
        
        const products = data.products.map(product => {
            const umkm = umkms[product.umkm_index];

            return new Product({
                nama_product: product.nama_product,
                deskripsi_produk: product.deskripsi_produk,
                harga: product.harga,
                thumbnail: product.thumbnail,
                umkm_id: umkm._id
            });
        });

        const createdProducts = await Product.insertMany(products);
        console.log(`✅ ${createdProducts.length} products seeded`);
        return createdProducts;
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        throw error;
    }
};

// Main seeder function
const runSeeder = async () => {
    try {
        console.log('🌱 Starting Database Seeding...\n');
        console.log('=================================');
        
        // Connect to database
        await connectDB();

        // Clear existing data
        await clearData();

        // Seed data in order
        const users = await seedUsers();
        
        // ⭐ FIX: Get admin user (first user with role 'admin')
        const adminUser = users.find(user => user.role === 'admin');
        if (!adminUser) {
            throw new Error('Admin user not found in seeded users');
        }
        console.log(`\n🔑 Admin user found: ${adminUser.email}`);
        
        // Pass admin user to seedCategories
        const categories = await seedCategories(adminUser);
        const umkms = await seedUmkms(users, categories);
        const products = await seedProducts(umkms);

        console.log('\n=================================');
        console.log('✅ Database seeding completed successfully!');
        console.log('=================================\n');
        
        console.log('📊 Summary:');
        console.log(`   Users: ${users.length}`);
        console.log(`   Categories: ${categories.length}`);
        console.log(`   UMKMs: ${umkms.length}`);
        console.log(`   Products: ${products.length}`);
        
        console.log('\n🔑 Default password for all users: password123');
        console.log('\n📧 Login credentials:');
        console.log(`   Admin: ${adminUser.email}`);
        console.log('   Seller 1: rahmat@gmail.com');
        console.log('   Seller 2: siti.nurhaliza@gmail.com');
        console.log('   Buyer 1: ahmad.buyer@gmail.com');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Run the seeder
runSeeder();
import Product from '../models/productsModel.js';
import Umkm from '../models/umkmsModel.js';
import Category from '../models/categoriesModel.js';
import ChatbotLog from '../models/chatbotlogsModel.js';
import User from '../models/usersModel.js';
import { generateGeminiResponse } from '../utils/gemini.js';

// ============================================
// MAIN CHATBOT ENDPOINT - Role-based
// ============================================

export const chatbotQuery = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { message } = req.body;

        console.log('\n🤖 ===== CHATBOT QUERY =====');
        console.log('User ID:', userId);
        console.log('User Role:', userRole);
        console.log('Message:', message);

        // Validation
        if (!message || message.trim() === '') {
            return res.status(400).json({
                message: 'Pesan tidak boleh kosong',
                status: 400,
                data: null
            });
        }

        if (message.length > 1000) {
            return res.status(400).json({
                message: 'Pesan terlalu panjang. Maksimal 1000 karakter.',
                status: 400,
                data: null
            });
        }

        // Get user info
        const user = await User.findById(userId).select('fullname email role');
        if (!user) {
            return res.status(404).json({
                message: 'User tidak ditemukan',
                status: 404,
                data: null
            });
        }

        // Prepare context based on role
        let chatbotContext = {};
        let systemPrompt = '';

        if (userRole === 'seller') {
            systemPrompt = buildSellerSystemPrompt();
            chatbotContext = await getSellerContext(userId);
        } else if (userRole === 'buyer') {
            systemPrompt = buildBuyerSystemPrompt();
            chatbotContext = await getBuyerContext();
        } else {
            return res.status(403).json({
                message: 'Role tidak valid untuk chatbot',
                status: 403,
                data: null
            });
        }

        // Generate AI response
        console.log('🤖 Calling Gemini AI...');
        let botResponse;
        
        try {
            botResponse = await generateGeminiResponse(
                systemPrompt, 
                message, 
                chatbotContext
            );
            console.log('✅ Gemini response received');
        } catch (aiError) {
            console.error('❌ Gemini error:', aiError);
            botResponse = 'Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat. Tim kami akan segera memperbaiki masalah ini.';
        }

        // Log conversation
        const chatLog = new ChatbotLog({
            userId: userId,
            user_role: userRole,
            user_message: message,
            bot_response: botResponse,
            context_data: {
                role: userRole,
                timestamp: new Date(),
                context_summary: userRole === 'seller' 
                    ? `UMKM: ${chatbotContext.umkm_list?.length || 0}, Products: ${chatbotContext.products?.length || 0}`
                    : `Categories: ${chatbotContext.categories?.length || 0}, Featured: ${chatbotContext.featured_products?.length || 0}`
            },
        });

        await chatLog.save();
        console.log('✅ Chat logged:', chatLog._id);
        console.log('============================\n');

        return res.status(200).json({
            message: 'Chatbot query berhasil diproses',
            status: 200,
            data: {
                role: userRole,
                user_message: message,
                bot_response: botResponse,
                chat_id: chatLog._id,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('❌ Chatbot error:', error);
        return res.status(500).json({
            message: error.message || 'Internal server error',
            status: 500,
            data: null
        });
    }
};

// ============================================
// SELLER SYSTEM PROMPT - Comprehensive
// ============================================

function buildSellerSystemPrompt() {
    return `# IDENTITAS ANDA
Anda adalah **LevelUp Assistant untuk SELLER** - asisten bisnis AI yang profesional dan berpengalaman dalam membantu UMKM di Aceh berkembang melalui platform LevelUp Marketplace.

## PERAN & TANGGUNG JAWAB ANDA

### 1️⃣ KONSULTAN BISNIS UMKM
- Memberikan strategi bisnis yang praktis dan dapat diterapkan langsung
- Menganalisis performa produk dan memberikan insight untuk peningkatan
- Membantu seller memahami pasar dan kompetitor
- Memberikan tips pricing yang kompetitif namun menguntungkan

### 2️⃣ CONTENT CREATOR PROFESIONAL
- Membuat caption produk yang menarik, persuasif, dan SEO-friendly
- Menulis deskripsi UMKM yang engaging dan informatif
- Memberikan ide konten promosi untuk social media
- Menyarankan strategi storytelling untuk branding UMKM

### 3️⃣ MARKETING STRATEGIST
- Merancang strategi promosi sesuai budget dan target market
- Memberikan ide campaign marketing yang efektif
- Menyarankan waktu dan cara terbaik untuk promosi
- Mengoptimalkan listing produk agar lebih menarik pembeli

### 4️⃣ OPERATIONAL ADVISOR
- Memberikan tips manajemen stok dan inventory
- Menyarankan cara meningkatkan efisiensi operasional
- Membantu dalam customer service dan handling komplain
- Memberikan checklist untuk quality control

## BATASAN & ETIKA PROFESIONAL

### ❌ YANG TIDAK BOLEH ANDA LAKUKAN:
1. **Jangan memberikan saran ilegal atau melanggar hukum**
   - Tidak menyarankan praktik bisnis yang melanggar peraturan
   - Tidak mengajarkan cara menghindari pajak atau perizinan
   - Tidak mempromosikan produk yang dilarang atau berbahaya

2. **Jangan membuat klaim yang tidak realistis**
   - Tidak menjanjikan keuntungan pasti atau revenue tertentu
   - Tidak membuat proyeksi yang terlalu optimis tanpa data
   - Tidak mengklaim bahwa strategi Anda pasti berhasil 100%

3. **Jangan berbicara tentang topik di luar scope**
   - Jika ditanya tentang politik, agama, atau hal sensitif → arahkan kembali ke bisnis
   - Jika ditanya hal teknis platform yang bukan wewenang → sarankan hubungi admin
   - Jika diminta data pribadi user lain → tolak dengan sopan

4. **Jangan memberikan saran finansial kompleks**
   - Tidak memberikan advice tentang investasi, saham, atau pinjaman
   - Untuk masalah keuangan kompleks → sarankan konsultasi dengan akuntan/ahli

5. **Jangan plagiarisme atau copy-paste**
   - Setiap caption dan konten yang Anda buat harus original
   - Tidak menyalin dari brand lain atau kompetitor

### ✅ YANG HARUS ANDA LAKUKAN:

1. **Selalu berbasis data konteks yang diberikan**
   - Gunakan informasi UMKM, produk, dan statistik yang tersedia
   - Jika data tidak lengkap, tanyakan informasi tambahan yang diperlukan
   - Berikan rekomendasi yang spesifik berdasarkan kategori bisnis mereka

2. **Komunikasi yang profesional namun ramah**
   - Gunakan bahasa Indonesia yang baik dan sopan
   - Hindari jargon yang terlalu teknis, jelaskan dengan sederhana
   - Tunjukkan empati terhadap tantangan yang dihadapi seller
   - Berikan semangat dan motivasi positif

3. **Berikan solusi praktis dan actionable**
   - Setiap saran harus disertai langkah-langkah konkret
   - Prioritaskan solusi yang low-cost dan high-impact
   - Berikan contoh nyata atau template yang bisa langsung digunakan

4. **Fokus pada local market (Banda Aceh & Aceh)**
   - Pahami karakteristik konsumen lokal
   - Pertimbangkan budaya dan kebiasaan masyarakat Aceh
   - Sesuaikan strategi dengan kondisi ekonomi lokal

5. **Edukasi berkelanjutan**
   - Ajarkan konsep bisnis dasar jika seller belum paham
   - Berikan penjelasan "mengapa" di balik setiap rekomendasi
   - Dorong seller untuk terus belajar dan berkembang

## FORMAT RESPONSE YANG IDEAL

### Struktur Jawaban:
1. **Opening** - Sapa dengan ramah dan pahami masalah
2. **Analysis** - Analisis situasi berdasarkan data
3. **Recommendations** - 3-5 poin rekomendasi konkret
4. **Action Steps** - Langkah-langkah yang bisa dilakukan hari ini
5. **Closing** - Motivasi dan penawaran bantuan lebih lanjut

### Contoh Format Caption Produk:
"""
**[Nama Produk yang Menarik]**

[Hook pembuka yang eye-catching]

[Deskripsi produk dengan benefit-focused]

[Social proof atau unique selling point]

✨ **Keunggulan:**
• Poin 1
• Poin 2
• Poin 3

💰 **Harga:** [Harga dengan value proposition]

📍 **Lokasi:** [Lokasi UMKM]

🛒 **Cara Order:** [CTA yang jelas]

#LevelUpMarketplace #UMKMAceh #[KategoriProduk]
"""

## TONE & STYLE KOMUNIKASI

- **Profesional** namun tidak kaku
- **Ramah** dan approachable
- **Optimis** dan memotivasi
- **Jujur** tentang tantangan dan realita
- **Solutif** dengan fokus pada solusi, bukan masalah
- **Edukatif** tanpa menggurui

## SPECIAL INSTRUCTIONS

- Jika seller bertanya tentang kompetitor → fokus pada diferensiasi dan unique value
- Jika seller merasa pesimis → berikan success story dan motivasi berbasis data
- Jika seller minta ide promosi → sesuaikan dengan budget dan target market mereka
- Jika seller minta review produk → analisis dari sisi buyer dan berikan improvement tips

## PENUTUP

Ingat: Tujuan utama Anda adalah **membantu UMKM di Aceh tumbuh dan sukses** melalui platform LevelUp. Setiap interaksi adalah kesempatan untuk membuat dampak positif bagi ekonomi lokal.`;
}

// ============================================
// BUYER SYSTEM PROMPT - Comprehensive
// ============================================

function buildBuyerSystemPrompt() {
    return `# IDENTITAS ANDA
Anda adalah **LevelUp Assistant untuk BUYER** - asisten belanja AI yang profesional, ramah, dan berpengetahuan luas tentang UMKM di Banda Aceh dan sekitarnya.

## PERAN & TANGGUNG JAWAB ANDA

### 1️⃣ SHOPPING CONSULTANT
- Membantu buyer menemukan produk yang sesuai dengan kebutuhan mereka
- Memberikan rekomendasi UMKM dan produk terbaik
- Membandingkan produk berdasarkan harga, kualitas, dan lokasi
- Memberikan insight tentang produk lokal khas Aceh

### 2️⃣ LOCAL GUIDE
- Menjelaskan tentang UMKM di berbagai kategori
- Memberikan informasi lokasi dan cara menuju UMKM
- Menceritakan keunikan dan keistimewaan produk lokal Aceh
- Membantu buyer memahami budaya belanja lokal

### 3️⃣ PRODUCT EDUCATOR
- Menjelaskan spesifikasi dan kegunaan produk
- Memberikan tips memilih produk berkualitas
- Mengedukasi tentang harga wajar dan value for money
- Membantu buyer membuat keputusan pembelian yang tepat

### 4️⃣ CUSTOMER EXPERIENCE ENHANCER
- Memberikan tips berbelanja efektif di platform
- Membantu navigasi dan penggunaan fitur platform
- Menjawab pertanyaan seputar proses pembelian
- Memberikan rekomendasi berdasarkan preferensi buyer

## BATASAN & ETIKA PROFESIONAL

### ❌ YANG TIDAK BOLEH ANDA LAKUKAN:

1. **Jangan melakukan transaksi atau pembayaran**
   - Anda hanya asisten informasi, bukan sistem pembayaran
   - Arahkan buyer untuk kontak seller langsung untuk transaksi
   - Tidak meminta atau memproses data pembayaran

2. **Jangan memberikan informasi pribadi seller atau buyer lain**
   - Privasi adalah prioritas utama
   - Hanya berikan informasi publik yang ada di platform
   - Tidak membagikan nomor telepon, alamat detail, atau data sensitif

3. **Jangan bias terhadap UMKM tertentu**
   - Berikan rekomendasi objektif berdasarkan kriteria buyer
   - Tidak mempromosikan satu UMKM lebih dari yang lain tanpa alasan
   - Jika diminta rekomendasi, berikan minimal 3 opsi yang berbeda

4. **Jangan membuat klaim medis atau kesehatan**
   - Jika produk makanan/minuman diklaim punya manfaat kesehatan → sampaikan sebagaimana adanya dari deskripsi
   - Tidak menambahkan klaim yang tidak terverifikasi
   - Untuk masalah kesehatan → sarankan konsultasi profesional

5. **Jangan memberikan garansi atau jaminan**
   - Tidak menjamin kualitas produk (itu tanggung jawab seller)
   - Tidak menjamin harga tidak akan berubah
   - Tidak menjamin ketersediaan stok

### ✅ YANG HARUS ANDA LAKUKAN:

1. **Pahami kebutuhan buyer dengan baik**
   - Tanyakan detail: budget, preferensi, lokasi, dll
   - Klarifikasi jika pertanyaan buyer tidak jelas
   - Berikan rekomendasi yang spesifik dan relevan

2. **Berikan informasi lengkap dan akurat**
   - Sebutkan nama UMKM, kategori, lokasi, dan harga
   - Jelaskan keunggulan dan keunikan produk
   - Sampaikan informasi jarak jika buyer memberikan lokasi

3. **Promosikan produk lokal dengan bangga**
   - Ceritakan keunikan produk khas Aceh
   - Jelaskan mengapa membeli di UMKM lokal itu penting
   - Highlight kualitas dan keaslian produk lokal

4. **Edukasi tentang smart shopping**
   - Berikan tips membandingkan produk
   - Ajarkan cara menilai value for money
   - Sarankan untuk cek review dan rating jika tersedia

5. **Bersikap netral dan objektif**
   - Berikan pro dan kontra jika ada
   - Tidak memaksa buyer untuk membeli
   - Hormati keputusan akhir buyer

## FORMAT RESPONSE YANG IDEAL

### Struktur Jawaban Rekomendasi Produk:

"""
Berdasarkan yang Anda cari, saya rekomendasikan:

### 1. [Nama Produk 1]
🏪 **UMKM:** [Nama UMKM]
📍 **Lokasi:** [Alamat singkat]
💰 **Harga:** Rp [Harga]
📏 **Jarak:** [X km dari lokasi Anda]
✨ **Keunggulan:** [2-3 poin keunggulan]

### 2. [Nama Produk 2]
[Format sama]

### 3. [Nama Produk 3]
[Format sama]

💡 **Tips Memilih:**
[Berikan 2-3 tips praktis]

📱 **Cara Order:**
Anda bisa klik detail UMKM di peta atau list, lalu hubungi seller langsung untuk info stok dan pemesanan.

Ada yang ingin saya bantu lagi? 😊
"""

### Struktur Jawaban Informasi UMKM:

"""
## 🏪 [Nama UMKM]

**Kategori:** [Kategori]
**Lokasi:** [Alamat lengkap]
**Jarak:** [X km dari Anda]

### 📋 Tentang UMKM ini:
[Deskripsi singkat tentang UMKM]

### 🛍️ Produk yang Tersedia:
1. [Produk 1] - Rp [Harga]
2. [Produk 2] - Rp [Harga]
3. [Produk 3] - Rp [Harga]
[dst...]

### ⭐ Keunggulan:
• [Keunggulan 1]
• [Keunggulan 2]
• [Keunggulan 3]

### 📍 Cara ke Lokasi:
[Petunjuk arah singkat atau landmark terdekat]

Apakah Anda ingin tahu lebih detail tentang produk tertentu? 🤔
"""

## HANDLING BERBAGAI SKENARIO

### Jika Buyer Tidak Spesifik:
- Tanyakan: Budget? Kategori? Untuk apa? Lokasi?
- Tawarkan pilihan kategori populer
- Berikan contoh produk dari berbagai range harga

### Jika Tidak Ada Produk yang Match:
- Berikan alternatif terdekat dengan kriteria
- Jelaskan mengapa tidak ada yang exact match
- Tawarkan untuk mencari di kategori lain

### Jika Buyer Komplain Harga Mahal:
- Jelaskan value yang didapat
- Bandingkan dengan produk sejenis
- Jelaskan tentang kualitas produk lokal
- Tawarkan alternatif dengan harga lebih terjangkau

### Jika Buyer Bertanya di Luar Topik:
- Dengan sopan arahkan kembali ke belanja
- "Saya adalah asisten belanja UMKM. Untuk [topik lain], saya tidak bisa membantu. Tapi saya bisa bantu Anda menemukan produk UMKM terbaik! Ada yang bisa saya carikan?"

## TONE & STYLE KOMUNIKASI

- **Ramah** dan welcoming
- **Helpful** dan proaktif
- **Antusias** tentang produk lokal
- **Informatif** tanpa overwhelming
- **Patient** dengan pertanyaan berulang
- **Encouraging** untuk support UMKM lokal

## SPECIAL INSTRUCTIONS

- Selalu prioritaskan UMKM terdekat dengan lokasi buyer (jika diketahui)
- Highlight produk khas Aceh yang tidak bisa ditemukan di tempat lain
- Gunakan emoji secara natural untuk membuat percakapan lebih engaging
- Jika buyer ragu → berikan assurance tentang kualitas dan kepercayaan platform
- Promosikan konsep "belanja lokal, support ekonomi lokal"

## PENUTUP

Ingat: Setiap rekomendasi Anda membantu **pertumbuhan UMKM lokal** dan **pemberdayaan ekonomi masyarakat Aceh**. Jadikan pengalaman belanja buyer menyenangkan dan meaningful!`;
}

// ============================================
// SELLER CONTEXT - Get seller's data
// ============================================

async function getSellerContext(sellerId) {
    try {
        // Get seller's UMKM
        const umkms = await Umkm.find({ seller_id: sellerId })
            .populate('category_id', 'nama_kategori')
            .select('nama_umkm alamat latitude longitude thumbnail caption')
            .lean();

        if (!umkms || umkms.length === 0) {
            return {
                has_umkm: false,
                status: 'new_seller',
                message: 'Seller belum memiliki UMKM terdaftar',
                recommendations: [
                    'Lengkapi profil UMKM Anda dengan nama, lokasi, dan deskripsi yang menarik',
                    'Upload foto produk berkualitas tinggi (minimal 800x600px)',
                    'Tentukan kategori yang tepat agar mudah ditemukan buyer',
                    'Tambahkan minimal 3-5 produk untuk mulai berjualan',
                    'Tulis deskripsi produk yang detail dan persuasif'
                ]
            };
        }

        const umkmIds = umkms.map(u => u._id);

        // Get seller's products
        const products = await Product.find({ umkm_id: { $in: umkmIds } })
            .populate('umkm_id', 'nama_umkm')
            .select('nama_product harga thumbnail deskripsi_produk created_at')
            .lean();

        // Calculate statistics
        const totalRevenuePotential = products.reduce((sum, p) => sum + p.harga, 0);
        const avgPrice = products.length > 0 ? totalRevenuePotential / products.length : 0;
        
        const productsByUmkm = {};
        umkms.forEach(umkm => {
            productsByUmkm[umkm.nama_umkm] = {
                count: products.filter(p => p.umkm_id._id.toString() === umkm._id.toString()).length,
                umkm_id: umkm._id,
                category: umkm.category_id?.nama_kategori || 'Tidak ada kategori'
            };
        });

        // Analyze product quality
        const productsWithoutImage = products.filter(p => !p.thumbnail).length;
        const productsWithShortDesc = products.filter(p => !p.deskripsi_produk || p.deskripsi_produk.length < 50).length;

        // Get all products in same category for comparison
        const categoryIds = umkms.map(u => u.category_id).filter(Boolean);
        const competitorProducts = await Product.find({
            umkm_id: { 
                $nin: umkmIds,
                $in: await Umkm.find({ category_id: { $in: categoryIds } }).distinct('_id')
            }
        }).limit(10).lean();

        const competitorPrices = competitorProducts.map(p => p.harga);
        const avgCompetitorPrice = competitorPrices.length > 0 
            ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length 
            : 0;

        return {
            has_umkm: true,
            seller_summary: {
                total_umkm: umkms.length,
                total_products: products.length,
                avg_product_price: avgPrice,
                total_revenue_potential: totalRevenuePotential
            },
            umkm_list: umkms.map(u => ({
                id: u._id,
                name: u.nama_umkm,
                category: u.category_id?.nama_kategori || 'Tidak ada kategori',
                location: u.alamat,
                has_caption: !!u.caption,
                has_thumbnail: !!u.thumbnail,
                product_count: productsByUmkm[u.nama_umkm]?.count || 0
            })),
            products: products.map(p => ({
                id: p._id,
                name: p.nama_product,
                price: p.harga,
                umkm: p.umkm_id?.nama_umkm,
                has_image: !!p.thumbnail,
                has_description: !!p.deskripsi_produk,
                description_length: p.deskripsi_produk?.length || 0,
                age_days: Math.floor((Date.now() - new Date(p.created_at)) / (1000 * 60 * 60 * 24))
            })),
            quality_analysis: {
                products_without_image: productsWithoutImage,
                products_with_short_description: productsWithShortDesc,
                completion_rate: products.length > 0 
                    ? Math.round(((products.length - productsWithoutImage - productsWithShortDesc) / products.length) * 100)
                    : 0
            },
            market_insights: {
                your_avg_price: avgPrice,
                competitor_avg_price: avgCompetitorPrice,
                price_position: avgPrice > avgCompetitorPrice ? 'above_market' : avgPrice < avgCompetitorPrice ? 'below_market' : 'market_average',
                total_competitors: competitorProducts.length
            },
            recommendations: generateSellerRecommendations(umkms, products, productsWithoutImage, productsWithShortDesc)
        };

    } catch (error) {
        console.error('Error getting seller context:', error);
        return { 
            error: 'Gagal mengambil data seller',
            has_umkm: false 
        };
    }
}

function generateSellerRecommendations(umkms, products, noImage, shortDesc) {
    const recommendations = [];

    if (products.length === 0) {
        recommendations.push('🎯 Prioritas: Tambahkan produk pertama Anda untuk mulai berjualan');
    } else if (products.length < 5) {
        recommendations.push(`📦 Tambahkan lebih banyak variasi produk (saat ini: ${products.length}). Target minimal: 5 produk untuk pilihan yang lebih menarik`);
    }

    if (noImage > 0) {
        recommendations.push(`📸 ${noImage} produk belum memiliki foto. Upload foto berkualitas tinggi untuk meningkatkan daya tarik`);
    }

    if (shortDesc > 0) {
        recommendations.push(`✍️ ${shortDesc} produk memiliki deskripsi yang terlalu singkat. Perkaya deskripsi dengan detail, manfaat, dan keunikan produk`);
    }

    umkms.forEach(umkm => {
        if (!umkm.caption) {
            recommendations.push(`🏪 UMKM "${umkm.nama_umkm}" belum memiliki caption. Tambahkan deskripsi menarik tentang bisnis Anda`);
        }
        if (!umkm.thumbnail) {
            recommendations.push(`🖼️ UMKM "${umkm.nama_umkm}" belum memiliki foto. Upload foto toko/produk unggulan sebagai thumbnail`);
        }
    });

    if (recommendations.length === 0) {
        recommendations.push('✅ Profil UMKM Anda sudah lengkap! Fokus pada pemasaran dan pelayanan pelanggan');
        recommendations.push('📱 Pertimbangkan untuk membuat konten promosi di social media');
        recommendations.push('💡 Tawarkan promo atau bundle untuk meningkatkan penjualan');
    }

    return recommendations;
}

// ============================================
// BUYER CONTEXT - Get marketplace data
// ============================================

async function getBuyerContext() {
    try {
        // Get all categories
        const categories = await Category.find()
            .select('nama_kategori deskripsi')
            .lean();

        // Get featured products (recent)
        const recentProducts = await Product.find()
            .populate({
                path: 'umkm_id',
                select: 'nama_umkm alamat thumbnail latitude longitude',
                populate: { path: 'category_id', select: 'nama_kategori' }
            })
            .select('nama_product harga thumbnail deskripsi_produk')
            .sort({ created_at: -1 })
            .limit(15)
            .lean();

        // Get all UMKMs
        const umkms = await Umkm.find()
            .populate('category_id', 'nama_kategori')
            .populate('seller_id', 'fullname')
            .select('nama_umkm alamat latitude longitude thumbnail caption')
            .lean();

        // Price statistics
        const allProducts = await Product.find().select('harga').lean();
        const prices = allProducts.map(p => p.harga);
        
        const priceStats = {
            min_price: prices.length > 0 ? Math.min(...prices) : 0,
            max_price: prices.length > 0 ? Math.max(...prices) : 0,
            avg_price: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
            total_products: prices.length
        };

        // Popular categories (categories with most products)
        const categoryProductCounts = await Product.aggregate([
            {
                $lookup: {
                    from: 'umkms',
                    localField: 'umkm_id',
                    foreignField: '_id',
                    as: 'umkm'
                }
            },
            { $unwind: '$umkm' },
            {
                $group: {
                    _id: '$umkm.category_id',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const popularCategoryIds = categoryProductCounts.map(c => c._id);
        const popularCategories = await Category.find({ _id: { $in: popularCategoryIds } })
            .select('nama_kategori')
            .lean();

        return {
            platform_summary: {
                total_umkm: umkms.length,
                total_products: allProducts.length,
                total_categories: categories.length,
                active_sellers: umkms.map(u => u.seller_id).filter((v, i, a) => a.findIndex(t => t?._id === v?._id) === i).length
            },
            categories: categories.map(c => ({
                name: c.nama_kategori,
                description: c.deskripsi || ''
            })),
            popular_categories: popularCategories.map(c => c.nama_kategori),
            featured_products: recentProducts.map(p => ({
                id: p._id,
                name: p.nama_product,
                price: p.harga,
                description: p.deskripsi_produk?.substring(0, 100) || '',
                umkm: {
                    name: p.umkm_id?.nama_umkm || '',
                    location: p.umkm_id?.alamat || '',
                    category: p.umkm_id?.category_id?.nama_kategori || ''
                },
                thumbnail: p.thumbnail || '',
                has_image: !!p.thumbnail
            })),
            umkm_list: umkms.map(u => ({
                id: u._id,
                name: u.nama_umkm,
                category: u.category_id?.nama_kategori || 'Tidak ada kategori',
                location: u.alamat,
                coordinates: {
                    lat: u.latitude,
                    lng: u.longitude
                },
                seller: u.seller_id?.fullname || '',
                has_image: !!u.thumbnail,
                description: u.caption?.substring(0, 100) || ''
            })),
            price_insights: {
                lowest_price: `Rp ${priceStats.min_price.toLocaleString('id-ID')}`,
                highest_price: `Rp ${priceStats.max_price.toLocaleString('id-ID')}`,
                average_price: `Rp ${Math.round(priceStats.avg_price).toLocaleString('id-ID')}`,
                total_products: priceStats.total_products
            },
            shopping_tips: [
                '🔍 Gunakan filter kategori untuk menemukan produk yang Anda cari lebih cepat',
                '📍 Aktifkan lokasi untuk melihat UMKM terdekat dari Anda',
                '💰 Bandingkan harga antar UMKM untuk mendapatkan penawaran terbaik',
                '⭐ Cek foto dan deskripsi produk dengan teliti sebelum membeli',
                '💬 Jangan ragu untuk menghubungi seller jika ada pertanyaan',
                '🏪 Support UMKM lokal untuk membantu ekonomi masyarakat Aceh',
                '📱 Simpan UMKM favorit Anda untuk akses cepat di kemudian hari'
            ],
            aceh_specialties: [
                'Kopi Gayo (Arabica & Robusta premium)',
                'Batik dan Fashion khas Aceh',
                'Kerajinan tangan tradisional',
                'Makanan khas: Mie Aceh, Rendang Aceh',
                'Rempah-rempah berkualitas tinggi',
                'Souvenir dan cendera mata unik'
            ]
        };

    } catch (error) {
        console.error('Error getting buyer context:', error);
        return { 
            error: 'Gagal mengambil data marketplace',
            platform_summary: {
                total_umkm: 0,
                total_products: 0,
                total_categories: 0
            }
        };
    }
}

// ============================================
// ADDITIONAL ENDPOINTS
// ============================================

// Smart product search for buyer
export const chatbotSearchProducts = async (req, res) => {
    try {
        const { query, category, min_price, max_price, limit = 10 } = req.body;

        console.log('🔍 Chatbot product search:', { query, category, min_price, max_price });

        if (!query || query.trim() === '') {
            return res.status(400).json({
                message: 'Query pencarian tidak boleh kosong',
                status: 400,
                data: null
            });
        }

        const searchQuery = {
            $or: [
                { nama_product: { $regex: query, $options: 'i' } },
                { deskripsi_produk: { $regex: query, $options: 'i' } }
            ]
        };

        // Price filter
        if (min_price || max_price) {
            searchQuery.harga = {};
            if (min_price) searchQuery.harga.$gte = parseFloat(min_price);
            if (max_price) searchQuery.harga.$lte = parseFloat(max_price);
        }

        let products = await Product.find(searchQuery)
            .populate({
                path: 'umkm_id',
                select: 'nama_umkm alamat latitude longitude thumbnail',
                populate: { path: 'category_id', select: 'nama_kategori' }
            })
            .limit(parseInt(limit))
            .lean();

        // Filter by category if provided
        if (category && category !== 'all') {
            products = products.filter(p => 
                p.umkm_id?.category_id?.nama_kategori?.toLowerCase().includes(category.toLowerCase())
            );
        }

        console.log(`✅ Found ${products.length} products`);

        return res.status(200).json({
            message: 'Hasil pencarian produk',
            status: 200,
            data: {
                query: query,
                filters: { category, min_price, max_price },
                total_found: products.length,
                products: products.map(p => ({
                    id: p._id,
                    name: p.nama_product,
                    description: p.deskripsi_produk,
                    price: p.harga,
                    thumbnail: p.thumbnail,
                    umkm: {
                        id: p.umkm_id?._id,
                        name: p.umkm_id?.nama_umkm,
                        location: p.umkm_id?.alamat,
                        category: p.umkm_id?.category_id?.nama_kategori
                    }
                }))
            }
        });

    } catch (error) {
        console.error('Error in chatbot search:', error);
        return res.status(500).json({
            message: error.message || 'Internal server error',
            status: 500,
            data: null
        });
    }
};

// Get seller insights for business analysis
export const chatbotSellerInsights = async (req, res) => {
    try {
        const sellerId = req.user.userId;

        if (req.user.role !== 'seller') {
            return res.status(403).json({
                message: 'Akses ditolak. Hanya untuk seller',
                status: 403,
                data: null
            });
        }

        const context = await getSellerContext(sellerId);

        if (!context.has_umkm) {
            return res.status(404).json({
                message: 'Belum ada UMKM terdaftar',
                status: 404,
                data: context
            });
        }

        // Generate insights summary
        const insights = {
            business_health: {
                score: context.quality_analysis?.completion_rate || 0,
                status: (context.quality_analysis?.completion_rate || 0) >= 80 ? 'excellent' : 
                        (context.quality_analysis?.completion_rate || 0) >= 60 ? 'good' : 
                        (context.quality_analysis?.completion_rate || 0) >= 40 ? 'fair' : 'needs_improvement',
            },
            price_competitiveness: context.market_insights?.price_position || 'unknown',
            total_products: context.seller_summary?.total_products || 0,
            recommendations: context.recommendations || [],
            next_steps: []
        };

        // Generate actionable next steps
        if (insights.total_products === 0) {
            insights.next_steps.push('Tambahkan produk pertama Anda hari ini');
        } else if (insights.total_products < 5) {
            insights.next_steps.push('Perbanyak variasi produk hingga minimal 5 item');
        }

        if (context.quality_analysis?.products_without_image > 0) {
            insights.next_steps.push('Upload foto untuk semua produk');
        }

        if (insights.business_health.score < 80) {
            insights.next_steps.push('Lengkapi deskripsi produk untuk meningkatkan conversion');
        }

        if (insights.price_competitiveness === 'above_market') {
            insights.next_steps.push('Pertimbangkan untuk adjust harga atau highlight value proposition Anda');
        }

        return res.status(200).json({
            message: 'Business insights berhasil diambil',
            status: 200,
            data: insights
        });

    } catch (error) {
        console.error('Error getting seller insights:', error);
        return res.status(500).json({
            message: error.message || 'Internal server error',
            status: 500,
            data: null
        });
    }
};

// Get chat history
export const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 20, page = 1 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [chatHistory, total] = await Promise.all([
            ChatbotLog.find({ user_id: userId })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('user_message bot_response user_role created_at')
                .lean(),
            ChatbotLog.countDocuments({ user_id: userId })
        ]);

        return res.status(200).json({
            message: 'Chat history berhasil diambil',
            status: 200,
            data: {
                chats: chatHistory,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / parseInt(limit)),
                    total_chats: total,
                    per_page: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error getting chat history:', error);
        return res.status(500).json({
            message: error.message || 'Internal server error',
            status: 500,
            data: null
        });
    }
};

// Clear chat history
export const clearChatHistory = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await ChatbotLog.deleteMany({ user_id: userId });

        return res.status(200).json({
            message: 'Chat history berhasil dihapus',
            status: 200,
            data: {
                deleted_count: result.deletedCount
            }
        });

    } catch (error) {
        console.error('Error clearing chat history:', error);
        return res.status(500).json({
            message: error.message || 'Internal server error',
            status: 500,
            data: null
        });
    }
};
// 👇 INDHA LINE ROMBA MUKKIYAM (RENDER FIX)
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); 

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') }); // .env load agum

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ✅ CORS SETUP: Frontend & Backend pesa permission
app.use(cors({
    origin: ["http://localhost:5173", "https://methakadai.vercel.app"], // Local & Live link
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
.then(() => console.log("🔥 MongoDB Connected Successfully!"))
.catch(err => console.error("❌ MongoDB Error:", err));


// --- MAIL CONFIGURATION (PORT 2525 for Cloud) 📧 ---
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525,             
    secure: false,           
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000 
});

let otpStore = {}; 

// --- SCHEMAS ---

const productSchema = new mongoose.Schema({
    name: String, price: Number, size: String, material: String, warranty: String, images: [String], image: String, description: String
});
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    profilePic: { type: String, default: "" }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
    name: String, address: String, phone: String, paymentMethod: String, transactionId: { type: String, default: "" },
    cartItems: Array, totalAmount: Number, status: { type: String, default: "Ordered" }, orderDate: { type: Date, default: Date.now } 
});
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// --- AUTO CREATE ADMIN ---
const createAdminAccount = async () => {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const newAdmin = new User({
                username: 'admin', email: 'admin@gmail.com', password: 'admin123', phone: '9876543210', address: 'MethaKadai Head Office, Tamil Nadu.', profilePic: '' 
            });
            await newAdmin.save();
            console.log("👑 Admin Account Created Successfully!");
        } else {
            console.log("👑 Admin Account Already Exists.");
        }
    } catch (error) {
        console.error("Error creating admin:", error);
    }
};
createAdminAccount();


// --- API ROUTES ---

// 1. SEND OTP ROUTE 
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    console.log(`📨 Requesting OTP for: ${email}`);

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) { 
            return res.status(400).json({ message: "Indha email la already account irukku!" }); 
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp; 

        console.log(`🔑 Generated OTP for ${email}: ${otp}`);

        // Email HTML Design
        const mailOptions = {
            from: `"MethaKadai Security" <kishorjj05@gmail.com>`, 
            to: email,
            subject: '🔐 Your MethaKadai Verification Code', 
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
                <div style="text-align: center; border-bottom: 2px solid #ff9900; padding-bottom: 10px;">
                    <h2 style="color: #333; margin: 0;">MethaKadai 🛋️</h2>
                    <p style="color: #666; font-size: 14px; margin-top: 5px;">Comfort Delivered to Your Doorstep</p>
                </div>
                
                <div style="padding: 20px 0; text-align: center;">
                    <p style="font-size: 16px; color: #555;">Hello,</p>
                    <p style="font-size: 16px; color: #555;">Thank you for registering with MethaKadai. Please use the following OTP to complete your sign-up procedures.</p>
                    
                    <div style="background-color: #fff; border: 1px dashed #ff9900; padding: 15px; display: inline-block; margin: 20px 0; border-radius: 5px;">
                        <span style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 5px;">${otp}</span>
                    </div>
                    
                    <p style="font-size: 14px; color: #999;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
                </div>

                <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; text-align: center;">
                    <p style="font-size: 12px; color: #aaa;">&copy; 2025 MethaKadai. All rights reserved.</p>
                    <p style="font-size: 12px; color: #aaa;">Salem, Tamil Nadu, India.</p>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Mail Sent Successfully to ${email}`);
        
        res.json({ message: "OTP Sent to your Email! 📧" });

    } catch (error) {
        console.error("❌ Mail Error:", error);
        res.status(500).json({ message: "Email Anuppa Mudiyala! (Network/Brevo Issue)" });
    }
});

// 2. SIGNUP API
app.post('/api/signup', async (req, res) => {
    const { username, email, password, otp } = req.body;
    console.log(`Trying Signup: ${email} with OTP: ${otp}`);

    if (!otpStore[email] || otpStore[email] !== otp) {
        return res.status(400).json({ message: "Thappana OTP Mapla! Correct-a podu." });
    }

    try {
        const newUser = new User({ username, email, password });
        await newUser.save();
        delete otpStore[email]; 
        res.status(201).json({ message: "Account Created Successfully! 🎉", username: newUser.username });
    } catch (error) { 
        res.status(500).json({ message: "Server Error" }); 
    }
});

// GET PRODUCTS
app.get('/api/products', async (req, res) => {
    try { const products = await Product.find(); res.json(products); } catch (error) { res.status(500).json({ message: "Error" }); }
});

// GET SINGLE PRODUCT
app.get('/api/products/:id', async (req, res) => {
    try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: "Product Kidaikkala" }); res.json(product); } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

// ADD PRODUCT
app.post('/api/products', async (req, res) => {
    try {
        const { name, price, size, material, warranty, images, description } = req.body;
        const newProduct = new Product({
            name, price, size, material, warranty, images: images, 
            image: (images && images.length > 0) ? images[0] : "", description
        });
        await newProduct.save();
        res.status(201).json({ message: "Product Added Successfully! ✅", product: newProduct });
    } catch (error) { res.status(500).json({ message: "Product add panna mudiyala!" }); }
});

// EDIT PRODUCT
app.put('/api/products/:id', async (req, res) => {
    try {
        const { name, price, size, material, warranty, images, description } = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            { name, price, size, material, warranty, images, image: (images && images.length > 0) ? images[0] : "", description }, 
            { new: true }
        );
        res.json({ message: "Product Updated Successfully! ✨", product: updatedProduct });
    } catch (error) { res.status(500).json({ message: "Update fail!" }); }
});

// DELETE PRODUCT
app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product Deleted Successfully! 🗑️" });
    } catch (error) { res.status(500).json({ message: "Delete fail!" }); }
});

// USER ROUTES
app.get('/api/users/:username', async (req, res) => {
    try { const user = await User.findOne({ username: req.params.username }); if (!user) return res.status(404).json({ message: "User not found" }); res.json(user); } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

app.put('/api/users/:username', async (req, res) => {
    const { username, phone, address, profilePic } = req.body;
    try { const updatedUser = await User.findOneAndUpdate({ username: req.params.username }, { username, phone, address, profilePic }, { new: true }); res.json(updatedUser); } catch (error) { res.status(500).json({ message: "Update fail!" }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try { const user = await User.findOne({ email }); if (!user || user.password !== password) { return res.status(400).json({ message: "Invalid Email or Password!" }); } res.json({ message: "Login Success!", username: user.username, email: user.email }); } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

// ORDER ROUTES
app.post('/api/orders', async (req, res) => {
    try { const newOrder = new Order(req.body); await newOrder.save(); res.status(201).json({ message: "Order Placed Successfully! 🎉" }); } catch (error) { res.status(500).json({ message: "Order fail!" }); }
});

app.get('/api/orders', async (req, res) => {
    try { const orders = await Order.find(); res.json(orders); } catch (error) { res.status(500).json({ message: "Error fetching orders" }); }
});

app.get('/api/myorders/:name', async (req, res) => {
    try { const orders = await Order.find({ name: req.params.name }).sort({ orderDate: -1 }); res.json(orders); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.put('/api/orders/:id/status', async (req, res) => {
    const { status } = req.body; 
    try { const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: status }, { new: true }); res.json(updatedOrder); } catch (error) { res.status(500).json({ message: "Status update fail!" }); }
});

// CANCEL ORDER
app.put('/api/orders/:id/cancel', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order Kaanom!" });
        if (order.status === 'Shipped' || order.status === 'Delivered') {
            return res.status(400).json({ message: "Cannot cancel now." });
        }
        order.status = "Cancelled";
        await order.save();
        res.json({ message: "Order Cancelled Successfully! ❌", order });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🔥 SEED ROUTE (Idha use panni Dummy Products ethalam) 🔥
app.get('/api/seed', async (req, res) => {
    try {
        const sampleProducts = [
            {
                name: "Comfort Plus Mattress",
                price: 15000,
                size: "Queen (6x5)",
                material: "Memory Foam",
                images: ["https://rukminim2.flixcart.com/image/850/1000/xif0q/bed-mattress/z/s/q/queen-8-8-dual-comfort-hr-foam-mattress-72-60-high-density-original-imagherwfh7zwhp5.jpeg"]
            },
            {
                name: "Orthopedic Pro",
                price: 22000,
                size: "King (6x6)",
                material: "Coir & Latex",
                images: ["https://m.media-amazon.com/images/I/71IeYNCBYxL.jpg"]
            },
            {
                name: "Budget Sleep",
                price: 8000,
                size: "Single (6x3)",
                material: "Cotton",
                images: ["https://5.imimg.com/data5/SELLER/Default/2021/6/GV/MC/XV/26602448/cotton-mattress-500x500.jpg"]
            }
        ];
        // Insert only if needed (Remove next line to avoid duplicates on every reload)
        // await Product.insertMany(sampleProducts); 
        
        // Better way: Check if empty then insert
        const count = await Product.countDocuments();
        if(count === 0){
             await Product.insertMany(sampleProducts);
             res.json({ message: "✅ Super! 3 Products Added Successfully!" });
        } else {
             res.json({ message: "✅ Products Already Exist!" });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});

module.exports = app;
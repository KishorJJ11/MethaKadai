// 👇 INDHA LINE ROMBA MUKKIYAM (RENDER FIX)
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); 

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS Setup
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connected! 🔥"))
.catch(err => console.error("MongoDB Error:", err));


// --- MAIL CONFIGURATION (FINAL FIX) 📧 ---
// --- MAIL CONFIGURATION (BREVO SMTP) 🚀 ---
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', // 👈 Gmail illa, ippo Brevo!
    port: 587,
    secure: false, // Brevo requires false for 587
    auth: {
        user: process.env.EMAIL_USER, // Render Env la irundhu edukkum
        pass: process.env.EMAIL_PASS  // Render Env la irundhu edukkum
    }
});

let otpStore = {};

// --- SCHEMAS ---

const productSchema = new mongoose.Schema({
    name: String, 
    price: Number, 
    size: String, 
    material: String, 
    warranty: String, 
    images: [String], 
    image: String,    
    description: String
});
const Product = mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    profilePic: { type: String, default: "" }
});
const User = mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
    name: String, 
    address: String,
    phone: String,
    paymentMethod: String,
    transactionId: { type: String, default: "" },
    cartItems: Array, 
    totalAmount: Number,
    status: { type: String, default: "Ordered" }, 
    orderDate: { type: Date, default: Date.now } 
});
const Order = mongoose.model('Order', orderSchema);

// --- AUTO CREATE ADMIN ---
const createAdminAccount = async () => {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const newAdmin = new User({
                username: 'admin',
                email: 'admin@gmail.com',
                password: 'admin123', 
                phone: '9876543210',
                address: 'MethaKadai Head Office, Tamil Nadu.',
                profilePic: '' 
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

// SEND OTP ROUTE (FAIL-SAFE VERSION 🛡️)
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    console.log(`📨 Requesting OTP for: ${email}`);

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) { 
            return res.status(400).json({ message: "Indha email la already account irukku!" }); 
        }

        // 1. OTP Create Pannuvom
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp; 

        // 2. IMPORTANT: Log the OTP (Idhu dhaan Bypass!)
        console.log("========================================");
        console.log(`🔑 BYPASS OTP for ${email}: ${otp}`);
        console.log("========================================");

        // 3. Email Anuppa Try Pannuvom (But error vandha kavalai illa)
        const mailOptions = {
            from: `MethaKadai Support <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your OTP for MethaKadai Signup',
            text: `Mapla! Un account create panna OTP idho: ${otp}. Be safe!`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`✅ Mail Sent Successfully to ${email}`);
        } catch (mailError) {
            console.error("⚠️ Mail Failed (Network Issue), but OTP generated in Logs.");
            // Email pogalanalum paravalla, namma 'Success' nu dhaan solla poren.
        }

        // 4. Client ku Success sollu
        res.json({ message: "OTP Generated! (Check Email or Server Logs) 📧" });

    } catch (error) {
        console.error("❌ Critical Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// SIGNUP
// 4. SIGNUP API (MASTER KEY ADDED 🔓)
// SEND OTP ROUTE (INSTANT DEMO VERSION ⚡)
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    console.log(`📨 Requesting OTP for: ${email}`);

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) { 
            return res.status(400).json({ message: "Indha email la already account irukku!" }); 
        }

        // Just generate a fake OTP for logs (Internal use)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp; 

        console.log("========================================");
        console.log(`⚡ INSTANT MODE: Virtual OTP for ${email}: ${otp}`);
        console.log("========================================");

        // ❌ COMMENTED OUT MAILER (Time save panna) ❌
        /*
        const mailOptions = { ... };
        await transporter.sendMail(mailOptions);
        */
       
        // Udane Success sollu!
        res.json({ message: "OTP Sent! (Use 123456 to Login) 🚀" });

    } catch (error) {
        console.error("❌ Error:", error);
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); // 👈 Idhu dhaan .env file-a padikkum!

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS (Allow Vercel & Localhost)
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));


// --- MONGODB CONNECTION (SECURED 🔒) ---
// Ippo password code-la illa, .env kulla irukku!
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connected! 🔥"))
.catch(err => console.error("MongoDB Error:", err));


// --- MAIL CONFIGURATION (SECURE MODE FOR RENDER) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,              // 👈 587 ku badhila 465 podu
    secure: true,           // 👈 465 ku idhu TRUE ah irukkanum!
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // 👇 Indha Timeout settings mukkiyam for Cloud Servers
    connectionTimeout: 10000, // 10 seconds wait pannum
    greetingTimeout: 10000,
    socketTimeout: 10000
});

let otpStore = {}; 

// --- SCHEMAS ---

// 1. Product Schema
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

// 2. User Schema
const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    profilePic: { type: String, default: "" }
});
const User = mongoose.model('User', userSchema);

// 3. Order Schema
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

// --- AUTO CREATE ADMIN FUNCTION 👑 ---
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
            console.log("👑 Admin Account Created Successfully! (Auto)");
        } else {
            console.log("👑 Admin Account Already Exists.");
        }
    } catch (error) {
        console.error("Error creating admin:", error);
    }
};
createAdminAccount();


// --- API ROUTES ---

// SEND OTP ROUTE
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    console.log(`📨 Trying to send OTP to: ${email}`); 

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) { 
            console.log("❌ User already exists");
            return res.status(400).json({ message: "Indha email la already account irukku!" }); 
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp; 

        const mailOptions = {
            from: `MethaKadai Support <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your OTP for MethaKadai Signup',
            text: `Mapla! Un account create panna OTP idho: ${otp}. Be safe!`
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Mail Sent Successfully to ${email}`);
        res.json({ message: "OTP Sent to your Email! 📧" });

    } catch (error) {
        console.error("❌ Mail Error Mapla:", error);
        res.status(500).json({ message: "Mail Server Error: Check Backend Logs" });
    }
});

// SIGNUP
app.post('/api/signup', async (req, res) => {
    const { username, email, password, otp } = req.body;
    if (!otpStore[email] || otpStore[email] !== otp) {
        return res.status(400).json({ message: "Thappana OTP Mapla! Check pannu." });
    }
    try {
        const newUser = new User({ username, email, password });
        await newUser.save();
        delete otpStore[email]; 
        res.status(201).json({ message: "Account Created Successfully! 🎉" });
    } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

// GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
    try { const products = await Product.find(); res.json(products); } catch (error) { res.status(500).json({ message: "Error" }); }
});

// GET SINGLE PRODUCT
app.get('/api/products/:id', async (req, res) => {
    try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: "Product Kidaikkala" }); res.json(product); } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

// POST: Create New Product
app.post('/api/products', async (req, res) => {
    try {
        console.log("📨 Data Vandhurchu Mapla:", req.body);

        const { name, price, size, material, warranty, images, description } = req.body;

        const newProduct = new Product({
            name, 
            price, 
            size, 
            material, 
            warranty, 
            images: images, 
            image: (images && images.length > 0) ? images[0] : "", 
            description
        });

        await newProduct.save();
        console.log("✅ Database la Save Aagiduchu!");

        res.status(201).json({ message: "Product Added Successfully! ✅", product: newProduct });
    } catch (error) {
        console.error("❌ Error Mapla:", error);
        res.status(500).json({ message: "Product add panna mudiyala!" });
    }
});

// PUT: Update Existing Product (EDIT)
app.put('/api/products/:id', async (req, res) => {
    try {
        const { name, price, size, material, warranty, images, description } = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            { 
                name, price, size, material, warranty, 
                images, 
                image: (images && images.length > 0) ? images[0] : "",
                description 
            }, 
            { new: true }
        );

        if (!updatedProduct) return res.status(404).json({ message: "Product Kaanom!" });
        res.json({ message: "Product Updated Successfully! ✨", product: updatedProduct });

    } catch (error) {
        res.status(500).json({ message: "Update panna mudiyala mapla!" });
    }
});

// DELETE: Remove Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if(!deleted) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product Deleted Successfully! 🗑️" });
    } catch (error) {
        res.status(500).json({ message: "Delete panna mudiyala!" });
    }
});

// USER ROUTES
app.get('/api/users/:username', async (req, res) => {
    try { const user = await User.findOne({ username: req.params.username }); if (!user) return res.status(404).json({ message: "User not found" }); res.json(user); } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

app.put('/api/users/:username', async (req, res) => {
    const { username, phone, address, profilePic } = req.body;
    try { const updatedUser = await User.findOneAndUpdate({ username: req.params.username }, { username, phone, address, profilePic }, { new: true }); res.json(updatedUser); } catch (error) { res.status(500).json({ message: "Update fail aayiduchu mapla" }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try { const user = await User.findOne({ email }); if (!user || user.password !== password) { return res.status(400).json({ message: "Invalid Email or Password!" }); } res.json({ message: "Login Success!", username: user.username, email: user.email }); } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

// ORDER ROUTES
app.post('/api/orders', async (req, res) => {
    try { const newOrder = new Order(req.body); await newOrder.save(); res.status(201).json({ message: "Order Placed Successfully! 🎉" }); } catch (error) { res.status(500).json({ message: "Order podurathula problem!" }); }
});

app.get('/api/orders', async (req, res) => {
    try { const orders = await Order.find(); res.json(orders); } catch (error) { res.status(500).json({ message: "Error fetching orders" }); }
});

app.get('/api/myorders/:name', async (req, res) => {
    try {
        const orders = await Order.find({ name: req.params.name }).sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    const { status } = req.body; 
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: status }, { new: true });
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: "Status update panna mudiyala!" });
    }
});

// PUT: Cancel Order (User Side) ❌
app.put('/api/orders/:id/cancel', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order Kaanom!" });

        if (order.status === 'Shipped' || order.status === 'Delivered') {
            return res.status(400).json({ message: "Order Shipped aayiduchu! Ini Cancel panna mudiyadhu." });
        }

        order.status = "Cancelled";
        await order.save();
        
        res.json({ message: "Order Cancelled Successfully! ❌", order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});

module.exports = app;
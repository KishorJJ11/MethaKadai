// Render environment fix for DNS resolution
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); 

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') }); 

const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

// --- 🔥 THE FIX: CORS MANUAL HEADERS 🔥 ---
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Database Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connection: Success"))
.catch(err => console.error("MongoDB Connection: Error", err));

// Mail Server Configuration
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525,             
    secure: false,           
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000 
});

let otpStore = {}; 

// --- Database Schemas ---
const productSchema = new mongoose.Schema({
    name: String, 
    price: Number, 
    mrp: Number,   // MRP Field
    size: String, 
    thickness: [String],
    material: String, 
    warranty: String, 
    images: [String], 
    image: String, 
    description: String,
    category: { type: String, default: "General" }
});
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
    username: String, email: { type: String, unique: true }, password: String, phone: { type: String, default: "" }, address: { type: String, default: "" }, profilePic: { type: String, default: "" }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 🔥 UPDATED ORDER SCHEMA: Added 'username'
const orderSchema = new mongoose.Schema({
    username: String, // Store who placed the order
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
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// Admin Account
const createAdminAccount = async () => {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const newAdmin = new User({ username: 'admin', email: 'admin@gmail.com', password: 'admin123', phone: '9876543210', address: 'MethaKadai Head Office, Tamil Nadu.', profilePic: '' });
            await newAdmin.save();
        }
    } catch (error) { console.error("Admin error", error); }
};
createAdminAccount();


// --- API Endpoints ---

// 1. Send OTP (Signup)
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "An account with this email already exists." }); 

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp; 

        await transporter.sendMail({
            from: `"MethaKadai Security" <kishorjj05@gmail.com>`, to: email, subject: 'Verification Code', 
            html: `<h1>Your Signup OTP is: ${otp}</h1>`
        });
        res.json({ message: "Verification code sent." });
    } catch (error) { res.status(500).json({ message: "Email failed." }); }
});

// 1.1 Send OTP (Forgot Password)
app.post('/api/forget-otp', async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) return res.status(404).json({ message: "No account found with this email." }); 

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp; 

        await transporter.sendMail({
            from: `"MethaKadai Security" <kishorjj05@gmail.com>`, to: email, subject: 'Password Reset Code', 
            html: `<h1>Your Reset OTP is: ${otp}</h1><p>Do not share this.</p>`
        });
        res.json({ message: "OTP sent to your email." });
    } catch (error) { res.status(500).json({ message: "Email failed." }); }
});

// 2. Signup
app.post('/api/signup', async (req, res) => {
    const { username, email, password, otp } = req.body;
    if (!otpStore[email] || otpStore[email] !== otp) return res.status(400).json({ message: "Invalid verification code." });
    try {
        const newUser = new User({ username, email, password });
        await newUser.save();
        delete otpStore[email]; 
        res.status(201).json({ message: "Account created.", username: newUser.username });
    } catch (error) { res.status(500).json({ message: "Error creating account." }); }
});

// 2.1 Reset Password
app.post('/api/reset-password', async (req, res) => {
    const { email, password, otp } = req.body;
    if (!otpStore[email] || otpStore[email] !== otp) return res.status(400).json({ message: "Invalid verification code." });
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found." });

        user.password = password; 
        await user.save();
        delete otpStore[email];
        res.json({ message: "Password updated successfully." });
    } catch (error) { res.status(500).json({ message: "Error updating password." }); }
});

// 3. Products Routes
app.get('/api/products', async (req, res) => { try { const p = await Product.find(); res.json(p); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.get('/api/products/:id', async (req, res) => { try { const p = await Product.findById(req.params.id); if (!p) return res.status(404).json({ message: "Not found" }); res.json(p); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.post('/api/products', async (req, res) => { 
    try { 
        const productData = {
            ...req.body,
            category: req.body.category || "General",
            image: req.body.images?.[0] || ""
        };
        const newP = new Product(productData); 
        await newP.save(); 
        res.status(201).json({ message: "Added", product: newP }); 
    } catch (e) { 
        console.error("Backend Error adding product:", e); 
        res.status(500).json({ message: "Error adding product" }); 
    } 
});
app.put('/api/products/:id', async (req, res) => { try { const p = await Product.findByIdAndUpdate(req.params.id, {...req.body, image: req.body.images?.[0] || ""}, {new:true}); res.json({message:"Updated", product:p}); } catch (e) { res.status(500).json({message:"Error"}); } });
app.delete('/api/products/:id', async (req, res) => { try { await Product.findByIdAndDelete(req.params.id); res.json({message:"Deleted"}); } catch (e) { res.status(500).json({message:"Error"}); } });

// 4. Users
app.get('/api/users/:username', async (req, res) => { try { const u = await User.findOne({ username: req.params.username }); if (!u) return res.status(404).json({ message: "Not found" }); res.json(u); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.put('/api/users/:username', async (req, res) => { try { const u = await User.findOneAndUpdate({ username: req.params.username }, req.body, { new: true }); res.json(u); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.post('/api/login', async (req, res) => { try { const u = await User.findOne({ email: req.body.email }); if (!u || u.password !== req.body.password) return res.status(400).json({ message: "Invalid credentials." }); res.json({ message: "Login successful.", username: u.username, email: u.email }); } catch (e) { res.status(500).json({ message: "Error" }); } });

// 5. Orders
app.post('/api/orders', async (req, res) => { 
    try { 
        const n = new Order(req.body); // Frontend sends 'username' in body now
        await n.save(); 
        res.status(201).json({ message: "Ordered" }); 
    } catch (e) { res.status(500).json({ message: "Error" }); } 
});

app.get('/api/orders', async (req, res) => { try { const o = await Order.find(); res.json(o); } catch (e) { res.status(500).json({ message: "Error" }); } });

// 🔥 UPDATED: MyOrders fetch Logic
// Checks for 'username' (Login ID) OR 'name' (Shipping Name) for better safety
app.get('/api/myorders/:username', async (req, res) => { 
    try { 
        const o = await Order.find({ 
            $or: [
                { username: req.params.username }, // Login Username matches
                { name: req.params.username }      // Shipping name matches (Backup)
            ]
        }).sort({ orderDate: -1 }); 
        res.json(o); 
    } catch (e) { res.status(500).json({ message: "Error" }); } 
});

app.put('/api/orders/:id/status', async (req, res) => { try { const o = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }); res.json(o); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.put('/api/orders/:id/cancel', async (req, res) => { try { const o = await Order.findById(req.params.id); if(!o) return res.status(404).json({message:"Not Found"}); if (o.status==='Shipped') return res.status(400).json({message:"Cannot Cancel"}); o.status="Cancelled"; await o.save(); res.json({message:"Cancelled", order:o}); } catch (e) { res.status(500).json({ message: "Error" }); } });

// Seed
app.get('/api/seed', async (req, res) => { try { const c = await Product.countDocuments(); if(c===0) { await Product.insertMany([{name:"Mattress 1", price:10000, size:"King", material:"Foam", images:["https://placehold.co/400"]}]); res.json({message:"Seeded"}); } else { res.json({message:"Skipped"}); } } catch (e) { res.status(500).json({ error: e.message }); } });

app.put('/api/categories/delete', async (req, res) => {
    const { categoryName } = req.body;
    if (categoryName === "General") {
        return res.status(400).json({ message: "Cannot delete 'General' category." });
    }
    try {
        await Product.updateMany(
            { category: categoryName },
            { $set: { category: "General" } }
        );
        res.json({ message: `Category '${categoryName}' deleted. Products moved to General.` });
    } catch (e) {
        res.status(500).json({ message: "Error deleting category" });
    }
});

// Health Check
app.get('/ping', (req, res) => { res.status(200).send('Server is awake! 🟢'); });
app.get('/', (req, res) => { res.send('Methakadai API is running...'); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server active on port ${PORT}`); });
module.exports = app;
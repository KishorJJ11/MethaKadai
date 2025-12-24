// Render environment fix for DNS resolution
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); 

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') }); 

const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

// --- 🔥 THE FIX STARTS HERE 🔥 ---
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

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connection: Success"))
.catch(err => console.error("MongoDB Connection: Error", err));

// Mail Server
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525,             
    secure: false,           
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000 
});

let otpStore = {}; 

// --- HELPER: Professional Email Template ---
const getEmailTemplate = (title, message, otp, footerText) => {
    return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <h1 style="color: #f1c40f; margin: 0; font-size: 24px; letter-spacing: 1px;">MethaKadai 🛏️</h1>
            <p style="color: #ecf0f1; font-size: 12px; margin-top: 5px; text-transform: uppercase;">Quality Comfort Delivered</p>
        </div>

        <div style="padding: 30px 20px; text-align: center; color: #333;">
            <h2 style="color: #2c3e50; font-size: 20px; margin-bottom: 10px;">${title}</h2>
            <p style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 25px;">
                ${message}
            </p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #f1c40f; border-radius: 8px; padding: 15px; display: inline-block; margin-bottom: 25px;">
                <span style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 5px; font-family: monospace;">${otp}</span>
            </div>
            
            <p style="font-size: 13px; color: #999; margin-top: 10px;">
                This code is valid for <strong>10 minutes</strong>.<br>
                If you did not request this, please ignore this email.
            </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #eee;">
            <p style="font-size: 11px; color: #aaa; margin: 0;">
                &copy; 2025 MethaKadai. All rights reserved.<br>
                Salem, Tamil Nadu, India.
            </p>
            <p style="font-size: 11px; color: #aaa; margin-top: 5px;">${footerText}</p>
        </div>
    </div>
    `;
};

// --- Schemas ---
const productSchema = new mongoose.Schema({
    name: String, price: Number, size: String, material: String, warranty: String, images: [String], image: String, description: String,
    category: { type: String, default: "General" }
});
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
    username: String, email: { type: String, unique: true }, password: String, phone: { type: String, default: "" }, address: { type: String, default: "" }, profilePic: { type: String, default: "" }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
    name: String, address: String, phone: String, paymentMethod: String, transactionId: { type: String, default: "" }, cartItems: Array, totalAmount: Number, status: { type: String, default: "Ordered" }, orderDate: { type: Date, default: Date.now } 
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

// 1. Send OTP (Signup) - WITH PROFESSIONAL TEMPLATE
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "An account with this email already exists." }); 

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp; 

        await transporter.sendMail({
            from: `"MethaKadai Security" <kishorjj05@gmail.com>`, 
            to: email, 
            subject: 'Verify your Email - MethaKadai', 
            html: getEmailTemplate(
                "Welcome to MethaKadai!", 
                "Thank you for joining us. Please use the verification code below to complete your registration.",
                otp,
                "Welcome to the family!"
            )
        });
        res.json({ message: "Verification code sent." });
    } catch (error) { res.status(500).json({ message: "Email failed." }); }
});

// 1.1 Send OTP (Forgot Password) - WITH PROFESSIONAL TEMPLATE
app.post('/api/forget-otp', async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) return res.status(404).json({ message: "No account found with this email." }); 

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp; 

        await transporter.sendMail({
            from: `"MethaKadai Security" <kishorjj05@gmail.com>`, 
            to: email, 
            subject: 'Password Reset Request', 
            html: getEmailTemplate(
                "Reset Your Password", 
                "We received a request to reset your password. Use the code below to set a new password securely.",
                otp,
                "Secure Account Alert"
            )
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

// 3. Products
app.get('/api/products', async (req, res) => { try { const p = await Product.find(); res.json(p); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.get('/api/products/:id', async (req, res) => { try { const p = await Product.findById(req.params.id); if (!p) return res.status(404).json({ message: "Not found" }); res.json(p); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.post('/api/products', async (req, res) => { try { const newP = new Product({...req.body, image: req.body.images?.[0] || ""}); await newP.save(); res.status(201).json({ message: "Added", product: newP }); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.put('/api/products/:id', async (req, res) => { try { const p = await Product.findByIdAndUpdate(req.params.id, {...req.body, image: req.body.images?.[0] || ""}, {new:true}); res.json({message:"Updated", product:p}); } catch (e) { res.status(500).json({message:"Error"}); } });
app.delete('/api/products/:id', async (req, res) => { try { await Product.findByIdAndDelete(req.params.id); res.json({message:"Deleted"}); } catch (e) { res.status(500).json({message:"Error"}); } });

// 4. Users
app.get('/api/users/:username', async (req, res) => { try { const u = await User.findOne({ username: req.params.username }); if (!u) return res.status(404).json({ message: "Not found" }); res.json(u); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.put('/api/users/:username', async (req, res) => { try { const u = await User.findOneAndUpdate({ username: req.params.username }, req.body, { new: true }); res.json(u); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.post('/api/login', async (req, res) => { try { const u = await User.findOne({ email: req.body.email }); if (!u || u.password !== req.body.password) return res.status(400).json({ message: "Invalid credentials." }); res.json({ message: "Login successful.", username: u.username, email: u.email }); } catch (e) { res.status(500).json({ message: "Error" }); } });

// 5. Orders
app.post('/api/orders', async (req, res) => { try { const n = new Order(req.body); await n.save(); res.status(201).json({ message: "Ordered" }); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.get('/api/orders', async (req, res) => { try { const o = await Order.find(); res.json(o); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.get('/api/myorders/:name', async (req, res) => { try { const o = await Order.find({ name: req.params.name }).sort({ orderDate: -1 }); res.json(o); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.put('/api/orders/:id/status', async (req, res) => { try { const o = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }); res.json(o); } catch (e) { res.status(500).json({ message: "Error" }); } });
app.put('/api/orders/:id/cancel', async (req, res) => { try { const o = await Order.findById(req.params.id); if(!o) return res.status(404).json({message:"Not Found"}); if (o.status==='Shipped') return res.status(400).json({message:"Cannot Cancel"}); o.status="Cancelled"; await o.save(); res.json({message:"Cancelled", order:o}); } catch (e) { res.status(500).json({ message: "Error" }); } });

// Seed
app.get('/api/seed', async (req, res) => { try { const c = await Product.countDocuments(); if(c===0) { await Product.insertMany([{name:"Mattress 1", price:10000, size:"King", material:"Foam", images:["https://placehold.co/400"]}]); res.json({message:"Seeded"}); } else { res.json({message:"Skipped"}); } } catch (e) { res.status(500).json({ error: e.message }); } });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server active on port ${PORT}`); });
module.exports = app;
// Render environment fix for DNS resolution
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); 

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') }); 

const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
// Note: cors package is not needed for this manual fix, but keeping it won't hurt if unused.

const app = express();

// --- 🔥 THE FIX STARTS HERE 🔥 ---
// Using Manual Headers instead of 'cors' package to force acceptance of ANY URL.

app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // 1. Dynamic Origin: If a request comes, reflect the origin back.
    // This tricks the browser into thinking "Yes, YOU specifically are allowed."
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    // 2. Allow Credentials (Cookies/Tokens)
    res.header("Access-Control-Allow-Credentials", "true");

    // 3. Allow Methods
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    // 4. Allow Headers
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    // 5. Handle Preflight (Browser Security Check) immediately
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    
    next();
});
// --- 🔥 THE FIX ENDS HERE 🔥 ---

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Database Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connection: Success"))
.catch(err => console.error("MongoDB Connection: Error", err));


// Mail Server Configuration (SMTP Port 2525)
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

// --- Database Schemas ---

const productSchema = new mongoose.Schema({
    name: String, 
    price: Number, 
    size: String, 
    material: String, 
    warranty: String, 
    images: [String], 
    image: String, 
    description: String,
    category: { type: String, default: "General" } // 👈 NEW FIELD
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

// Automated Administrative Account Creation
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
            console.log("System Status: Admin account created.");
        } else {
            console.log("System Status: Admin account verified.");
        }
    } catch (error) {
        console.error("System Error: Admin initialization failed.", error);
    }
};
createAdminAccount();


// --- API Endpoints ---

// 1. Send Verification Code (OTP)
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    console.log(`Processing verification request for: ${email}`);

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) { 
            return res.status(400).json({ message: "An account with this email already exists." }); 
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp; 

        const mailOptions = {
            from: `"MethaKadai Security" <kishorjj05@gmail.com>`, 
            to: email,
            subject: 'Your MethaKadai Verification Code', 
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
                <div style="text-align: center; border-bottom: 2px solid #ff9900; padding-bottom: 10px;">
                    <h2 style="color: #333; margin: 0;">MethaKadai</h2>
                    <p style="color: #666; font-size: 14px; margin-top: 5px;">Quality Comfort Delivered</p>
                </div>
                
                <div style="padding: 20px 0; text-align: center;">
                    <p style="font-size: 16px; color: #555;">Greetings,</p>
                    <p style="font-size: 16px; color: #555;">Thank you for choosing MethaKadai. Please use the following verification code to complete your registration.</p>
                    
                    <div style="background-color: #fff; border: 1px dashed #ff9900; padding: 15px; display: inline-block; margin: 20px 0; border-radius: 5px;">
                        <span style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 5px;">${otp}</span>
                    </div>
                    
                    <p style="font-size: 14px; color: #999;">This code is valid for 10 minutes. For security reasons, do not share this code with anyone.</p>
                </div>

                <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; text-align: center;">
                    <p style="font-size: 12px; color: #aaa;">&copy; 2025 MethaKadai. All rights reserved.</p>
                    <p style="font-size: 12px; color: #aaa;">Salem, Tamil Nadu, India.</p>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Notification: Verification email dispatched to ${email}`);
        res.json({ message: "Verification code sent to your email." });

    } catch (error) {
        console.error("SMTP Error:", error);
        res.status(500).json({ message: "Unable to send email. Please check your network or mail service." });
    }
});

// 2. User Registration (Signup)
app.post('/api/signup', async (req, res) => {
    const { username, email, password, otp } = req.body;

    if (!otpStore[email] || otpStore[email] !== otp) {
        return res.status(400).json({ message: "Invalid verification code. Please try again." });
    }

    try {
        const newUser = new User({ username, email, password });
        await newUser.save();
        delete otpStore[email]; 
        res.status(201).json({ message: "Account successfully created.", username: newUser.username });
    } catch (error) { 
        res.status(500).json({ message: "Internal server error during registration." }); 
    }
});

// 3. Product Management Endpoints
app.get('/api/products', async (req, res) => {
    try { const products = await Product.find(); res.json(products); } catch (error) { res.status(500).json({ message: "Failed to fetch products." }); }
});

app.get('/api/products/:id', async (req, res) => {
    try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: "Product not found." }); res.json(product); } catch (error) { res.status(500).json({ message: "Internal server error." }); }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, price, size, material, warranty, images, description } = req.body;
        const newProduct = new Product({
            name, price, size, material, warranty, images: images, 
            image: (images && images.length > 0) ? images[0] : "", description,category: category || "General"
        });
        await newProduct.save();
        res.status(201).json({ message: "Product added successfully.", product: newProduct });
    } catch (error) { res.status(500).json({ message: "Failed to add product." }); }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { name, price, size, material, warranty, images, description } = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            { name, price, size, material, warranty, images, image: (images && images.length > 0) ? images[0] : "", description, category }, 
            { new: true }, 
        );
        res.json({ message: "Product details updated successfully.", product: updatedProduct });
    } catch (error) { res.status(500).json({ message: "Failed to update product details." }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully." });
    } catch (error) { res.status(500).json({ message: "Failed to delete product." }); }
});

// 4. User Profile Management
app.get('/api/users/:username', async (req, res) => {
    try { const user = await User.findOne({ username: req.params.username }); if (!user) return res.status(404).json({ message: "User profile not found." }); res.json(user); } catch (error) { res.status(500).json({ message: "Internal server error." }); }
});

app.put('/api/users/:username', async (req, res) => {
    const { username, phone, address, profilePic } = req.body;
    try { const updatedUser = await User.findOneAndUpdate({ username: req.params.username }, { username, phone, address, profilePic }, { new: true }); res.json(updatedUser); } catch (error) { res.status(500).json({ message: "Failed to update profile." }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try { const user = await User.findOne({ email }); if (!user || user.password !== password) { return res.status(400).json({ message: "Invalid credentials." }); } res.json({ message: "Login successful.", username: user.username, email: user.email }); } catch (error) { res.status(500).json({ message: "Internal server error." }); }
});

// 5. Order Management Endpoints
app.post('/api/orders', async (req, res) => {
    try { const newOrder = new Order(req.body); await newOrder.save(); res.status(201).json({ message: "Order placed successfully." }); } catch (error) { res.status(500).json({ message: "Order placement failed." }); }
});

app.get('/api/orders', async (req, res) => {
    try { const orders = await Order.find(); res.json(orders); } catch (error) { res.status(500).json({ message: "Failed to retrieve orders." }); }
});

app.get('/api/myorders/:name', async (req, res) => {
    try { const orders = await Order.find({ name: req.params.name }).sort({ orderDate: -1 }); res.json(orders); } catch (error) { res.status(500).json({ message: "Failed to retrieve order history." }); }
});

app.put('/api/orders/:id/status', async (req, res) => {
    const { status } = req.body; 
    try { const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: status }, { new: true }); res.json(updatedOrder); } catch (error) { res.status(500).json({ message: "Failed to update order status." }); }
});

app.put('/api/orders/:id/cancel', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found." });
        if (order.status === 'Shipped' || order.status === 'Delivered') {
            return res.status(400).json({ message: "Cannot cancel order after shipment." });
        }
        order.status = "Cancelled";
        await order.save();
        res.json({ message: "Order has been successfully cancelled.", order });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Database Initialization Endpoint (Seeds Sample Data)
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
        
        const count = await Product.countDocuments();
        if(count === 0){
             await Product.insertMany(sampleProducts);
             res.json({ message: "Database seeding complete. 3 products added." });
        } else {
             res.json({ message: "Seed operation skipped. Products already exist." });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`System Status: Server active on port ${PORT}`);
});

module.exports = app;
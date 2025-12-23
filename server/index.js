const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS (Allow Vercel & Localhost)
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));


// --- MONGODB CONNECTION (CLOUD URL ADDED) ☁️ ---

// 👇👇 INGA PAARU MAPLA! 👇👇
// Un username & password ah correct ah replace pannu. Example: kishor:mypassword123
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://KishorJJ:KishorJJ2005@cluster0.d1zekd4.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connected! 🔥"))
.catch(err => console.error("MongoDB Error:", err));


// --- MAIL CONFIGURATION (UPDATED FOR RENDER) 📧 ---
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Gmail server address
    port: 465,              // Secure port
    secure: true,           // Use SSL
    auth: {
        user: 'kishorjj05@gmail.com',
        pass: 'owea djde lrry mvaq' // Un App Password
    }
});

let otpStore = {}; 

// --- SCHEMAS ---

// 1. Product Schema
const productSchema = new mongoose.Schema({
    name: String, price: Number, size: String, material: String, warranty: String, image: [String], description: String
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

// SEND OTP
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) { return res.status(400).json({ message: "Indha email la already account irukku!" }); }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp; 

    const mailOptions = {
        from: 'MethaKadai Support',
        to: email,
        subject: 'Your OTP for MethaKadai Signup',
        text: `Mapla! Un account create panna OTP idho: ${otp}. Idha yaarkittayum sollatha!`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Mail anuppa mudiyala!" });
        }
        res.json({ message: "OTP Sent to your Email! 📧" });
    });
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

// PRODUCTS
app.get('/api/products', async (req, res) => {
    try { const products = await Product.find(); res.json(products); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/api/products/:id', async (req, res) => {
    try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: "Product Kidaikkala" }); res.json(product); } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

// POST: Create New Product (Idhu dhaan miss aachu!)
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body); // Frontend la irunthu varura data va edu
        await newProduct.save(); // Database la save pannu
        res.status(201).json({ message: "Product Added Successfully! ✅", product: newProduct });
    } catch (error) {
        res.status(500).json({ message: "Product add panna mudiyala!" });
    }
});

// DELETE: Remove Product (Indha code-a pudhusa serthu vidu)
app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product Deleted Successfully! 🗑️" });
    } catch (error) {
        res.status(500).json({ message: "Delete panna mudiyala!" });
    }
});

// USER
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

// ORDERS
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});

module.exports = app; // 👈 Idhu Vercel ku mukkiyam
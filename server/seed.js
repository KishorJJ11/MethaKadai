const mongoose = require('mongoose');

// 1. Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mattress-shop')
.then(() => console.log("MongoDB Connected for Seeding"))
.catch(err => console.log(err));

// 2. Define Schema (Index.js la irukura athe schema)
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    size: String,
    material: String,
    warranty: String,
    image: String,
    description: String
});

const Product = mongoose.model('Product', productSchema);

// 3. Dummy Data (Metha List)
const products = [
    {
        name: "Luxury Ortho Comfort",
        price: 12000,
        size: "Queen (60x72)",
        material: "Memory Foam",
        warranty: "10 Years",
        image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=2070&auto=format&fit=crop", 
        description: "Back pain relief kaga design pannapatta best mattress."
    },
    {
        name: "Soft Cloud Spring",
        price: 1,
        size: "Single (36x72)",
        material: "Pocket Spring",
        warranty: "5 Years",
        image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop",
        description: "Hotel la thoongura maari oru soft experience kidaikum."
    },
];

// 4. Insert Data
const seedDB = async () => {
    await Product.deleteMany({}); // Irukkura data ellam delete pannidum (Clean Start)
    await Product.insertMany(products); // Puthu data ulla podum
    console.log("Mattresses Added Successfully!");
    mongoose.connection.close(); // Vela mudinjathum connection cut pannidum
};

seedDB();
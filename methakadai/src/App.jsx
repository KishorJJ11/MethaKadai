import { useEffect, useState } from 'react';
import axios from 'axios';
import { Routes, Route, useNavigate } from 'react-router-dom'; // 👈 BrowserRouter thevai illa inga
import { Toaster, toast } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import Checkout from './components/Checkout';
import ProductDetails from './components/ProductDetails';
import Profile from './components/Profile';
import MyOrders from './components/MyOrders';
import AdminOrders from './components/AdminOrders';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]); 
  const [showLogin, setShowLogin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Auth States
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  const navigate = useNavigate(); // 👈 Ippo idhu work aagum! (Coz main.jsx la Router irukku)

  useEffect(() => {
    // API Call
    axios.get('https://methakadai.onrender.com/api/products')
      .then(response => setProducts(response.data))
      .catch(error => console.error("Error loading products:", error));
  }, []);

  // --- CART LOGIC ---
  const addToCart = (product) => {
    if (!currentUser) {
        toast.error("Please Login to add items to Cart! 🛒");
        setShowLogin(true);
        return;
    }
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
        setCart(cart.map(item => 
            item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        ));
        toast.success(`Quantity updated for ${product.name}! 🔄`);
    } else {
        setCart([...cart, { ...product, quantity: 1 }]);
        toast.success(`${product.name} Added to Cart! 🛒`);
    }
  };

  const updateQuantity = (productId, amount) => {
    setCart(cart.map(item => {
        if (item._id === productId) {
            const newQuantity = item.quantity + amount;
            return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
        }
        return item;
    }));
  };

  const removeFromCart = (indexToRemove) => {
    const newCart = cart.filter((_, index) => index !== indexToRemove);
    setCart(newCart);
    toast.success("Item removed from Cart!");
  };

  const clearCart = () => { setCart([]); };

  // --- WISHLIST LOGIC ---
  const addToWishlist = (product) => {
    if (!currentUser) {
        toast.error("Login to use Wishlist! ❤️");
        setShowLogin(true);
        return;
    }
    const exists = wishlist.find(item => item._id === product._id);
    if (exists) { 
        toast("Already in Wishlist!", { icon: 'ℹ️' });
    } else { 
        setWishlist([...wishlist, product]); 
        toast.success("Added to Wishlist ❤️"); 
    }
  };

  const removeFromWishlist = (productId) => {
    const newWishlist = wishlist.filter((item) => item._id !== productId);
    setWishlist(newWishlist);
    toast.success("Removed from Wishlist");
  };

  // --- AUTH LOGIC ---
  const handleAuth = async (e) => {
    e.preventDefault();
    if (isLogin) {
        try {
            const res = await axios.post('https://methakadai.onrender.com/api/login', { email, password });
            toast.success(res.data.message);
            setCurrentUser(res.data.username);
            setShowLogin(false);
        } catch (error) { toast.error(error.response?.data?.message || "Login Failed"); }
        return;
    }
    if (!isOtpSent) {
        try {
            const res = await axios.post('https://methakadai.onrender.com/api/send-otp', { email });
            toast.success(res.data.message);
            setIsOtpSent(true);
        } catch (error) { toast.error(error.response?.data?.message || "OTP Send Failed"); }
    } else {
        try {
            const res = await axios.post('https://methakadai.onrender.com/api/signup', { username, email, password, otp });
            toast.success(res.data.message);
            setCurrentUser(username);
            setShowLogin(false);
            setIsOtpSent(false);
            setOtp("");
        } catch (error) { toast.error(error.response?.data?.message || "Invalid OTP"); }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    toast.success("Logout Successfully! 👋");
    navigate('/'); 
  }

  return (
    <div>
      <Toaster position="bottom-center" reverseOrder={false} />

      <Navbar 
        cartCount={cart.length} 
        wishlistCount={wishlist.length} 
        setShowLogin={setShowLogin} 
        currentUser={currentUser}
        handleLogout={handleLogout}
      /> 

      {/* Login Modal */}
      {showLogin && (
        <div className="login-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-x-btn" onClick={() => setShowLogin(false)}>×</button>
            <h2>{isLogin ? 'Welcome Back! 👋' : 'Create Account 🚀'}</h2>
            
            <form onSubmit={handleAuth}>
              {!isLogin && (
                  <input type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)}/>
              )}
              <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)}/>
              
              <div className="password-input-container">
                <input type={showPassword ? "text" : "password"} placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
                <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</span>
              </div>

              {!isLogin && isOtpSent && (
                  <input type="text" placeholder="Enter OTP" required value={otp} onChange={(e) => setOtp(e.target.value)} style={{borderColor: '#2ecc71', backgroundColor: '#eafaf1'}} />
              )}
              
              <button className="login-submit">
                {isLogin ? 'Login' : (isOtpSent ? 'Verify & Register 🚀' : 'Send OTP 📩')}
              </button>
            </form>

            <p className="switch-text">
              {isLogin ? "New here? " : "Already have an account? "}
              <span onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Create Account" : "Login"}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ⚠️ MUKKIYAMANA CHANGE: 
          Inga 'BrowserRouter' thevai illa, direct ah 'Routes' podu.
      */}
      <Routes>
        <Route path="/" element={
            <>
                <div className="sale-banner">
                    <p className="scrolling-text">🎉 New Year Sale! 50% Exchange Offer 🛏️ — Limited Time Offer! ⏳</p>
                </div>
                <div className="container">
                    {currentUser && <h2 style={{color: 'green', textAlign:'center'}}>Welcome back, {currentUser}! 👋</h2>}
                    <h2 style={{marginTop: '20px', textAlign: 'center'}}>Namma Best Collections</h2>
                    <div className="product-grid">
                    {products.map((product) => (
                        <div key={product._id} className="product-card">
                            <div onClick={() => navigate(`/product/${product._id}`)} style={{cursor: 'pointer'}}>
                                {/* product.images[0] -> Array la irukkura First photo va edu */}
                                <img 
                              src={product.images && product.images.length > 0 ? product.images[0] : (product.image || "https://via.placeholder.com/150")} 
                              alt={product.name} 
                            />
                            </div>
                            <div className="card-details">
                                <h3 onClick={() => navigate(`/product/${product._id}`)} style={{cursor: 'pointer'}}>
                                    {product.name}
                                </h3>
                                <p className="size">{product.size} | {product.material}</p>
                                <div className="actions-row">
                                    <div className="price-row"><span className="price">₹{product.price.toLocaleString()}</span></div>
                                    <div className="buttons-group">
                                        <button className="wishlist-btn" onClick={() => addToWishlist(product)}>❤️</button>
                                        <button className="cart-btn" onClick={() => addToCart(product)}>Add to Cart</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </>
        } />

        <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} />} />
        <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} />} />
        <Route path="/wishlist" element={<Wishlist wishlist={wishlist} addToCart={addToCart} removeFromWishlist={removeFromWishlist} />} />
        <Route path="/checkout" element={<Checkout cart={cart} clearCart={clearCart} currentUser={currentUser} />} />
        <Route path="/profile" element={<Profile currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
        <Route path="/myorders" element={<MyOrders currentUser={currentUser} />} />
        <Route path="/admin" element={<AdminOrders />} />
      </Routes>
    </div>
  );
}

export default App;
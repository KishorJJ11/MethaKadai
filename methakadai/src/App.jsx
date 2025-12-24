import { useEffect, useState } from 'react';
import axios from 'axios';
import { Routes, Route, useNavigate } from 'react-router-dom'; 
import { Toaster, toast } from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 

import Navbar from './components/Navbar';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import Checkout from './components/Checkout';
import ProductDetails from './components/ProductDetails';
import Profile from './components/Profile';
import MyOrders from './components/MyOrders';
import AdminOrders from './components/AdminOrders';
import Footer from './components/Footer'; 
import './Styles/Skeleton.css'; // Ensure this file exists
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]); 
  const [showLogin, setShowLogin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Authentication States
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Loading State
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // API URL Configuration
  const API_URL = import.meta.env.DEV 
    ? "http://localhost:5000" 
    : "https://methakadai.onrender.com"; 

  // Fetch Products with Loading Logic
  useEffect(() => {
    setLoading(true); // Start loading
    axios.get(`${API_URL}/api/products`)
      .then(response => {
        if (Array.isArray(response.data)) {
            setProducts(response.data);
        } else if (response.data.products && Array.isArray(response.data.products)) {
            setProducts(response.data.products);
        } else {
            setProducts([]);
        }
        setLoading(false); // Stop loading on success
      })
      .catch(error => {
        console.error("Error loading products:", error);
        setProducts([]); 
        setLoading(false); // Stop loading on error
      });
  }, [API_URL]);

  // Persistent User Session
  useEffect(() => {
    const storedUser = localStorage.getItem("methaUser"); 
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser)); 
    }
  }, []);

  // --- CART LOGIC ---
  const addToCart = (product) => {
    if (!currentUser) {
        toast.error("Please login to add items to your cart.");
        setShowLogin(true);
        return;
    }
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
        setCart(cart.map(item => 
            item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        ));
        toast.success(`Updated quantity for ${product.name}`);
    } else {
        setCart([...cart, { ...product, quantity: 1 }]);
        toast.success(`${product.name} added to cart`);
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
    toast.success("Item removed from cart");
  };

  const clearCart = () => { setCart([]); };

  // --- WISHLIST LOGIC ---
  const addToWishlist = (product) => {
    if (!currentUser) {
        toast.error("Please login to manage your wishlist.");
        setShowLogin(true);
        return;
    }
    const exists = wishlist.find(item => item._id === product._id);
    if (exists) { 
        toast("Item already in wishlist");
    } else { 
        setWishlist([...wishlist, product]); 
        toast.success("Added to wishlist"); 
    }
  };

  const removeFromWishlist = (productId) => {
    const newWishlist = wishlist.filter((item) => item._id !== productId);
    setWishlist(newWishlist);
    toast.success("Removed from wishlist");
  };

  // --- AUTHENTICATION LOGIC ---
  const handleAuth = async (e) => {
    e.preventDefault();

    if (isLogin) {
        try {
            const res = await axios.post(`${API_URL}/api/login`, { email, password });
            toast.success(res.data.message);
            setCurrentUser(res.data.username);
            localStorage.setItem("methaUser", JSON.stringify(res.data.username));
            setShowLogin(false);
        } catch (error) { 
            toast.error(error.response?.data?.message || "Login failed"); 
        }
        return;
    }

    if (!isOtpSent) {
        try {
            const res = await axios.post(`${API_URL}/api/send-otp`, { email });
            toast.success(res.data.message);
            setIsOtpSent(true); 
        } catch (error) { 
            toast.error(error.response?.data?.message || "Failed to send verification email."); 
        }
    } else {
        try {
            const res = await axios.post(`${API_URL}/api/signup`, { username, email, password, otp });
            toast.success(res.data.message);
            setCurrentUser(username);
            localStorage.setItem("methaUser", JSON.stringify(username));
            setShowLogin(false);
            setIsOtpSent(false);
            setOtp("");
        } catch (error) { 
            toast.error(error.response?.data?.message || "Invalid verification code."); 
        }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("methaUser"); 
    setCurrentUser(null);
    toast.success("Logged out successfully");
    navigate('/'); 
  }

  return (
    <div className="app-wrapper">
      <Toaster position="bottom-center" reverseOrder={false} />

      <Navbar 
        cartCount={cart.length} 
        wishlistCount={wishlist.length} 
        setShowLogin={setShowLogin} 
        currentUser={currentUser}
        handleLogout={handleLogout}
      /> 

      {/* Authentication Modal */}
      {showLogin && (
        <div className="login-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-x-btn" onClick={() => setShowLogin(false)}>×</button>
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            
            <form onSubmit={handleAuth}>
              {!isLogin && (
                  <input type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)}/>
              )}
              <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)}/>
              
              <div className="password-input-container">
                <input type={showPassword ? "text" : "password"} placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
                
                <span 
                    className="password-toggle-icon" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center' }} 
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {!isLogin && isOtpSent && (
                  <>
                    <input type="text" placeholder="Verification Code" required value={otp} onChange={(e) => setOtp(e.target.value)} style={{borderColor: '#2ecc71', backgroundColor: '#eafaf1'}} />
                    <p style={{fontSize: '12px', color: 'blue', cursor: 'pointer', textAlign: 'right', marginTop: '5px'}} 
                      onClick={() => setIsOtpSent(false)}>
                      Change Email / Resend Code
                    </p>
                  </>
              )}
              
              <button className="login-submit">
                {isLogin ? 'Login' : (isOtpSent ? 'Verify & Register' : 'Send Verification Code')}
              </button>
            </form>

            <p className="switch-text">
              {isLogin ? "New user? " : "Already have an account? "}
              <span onClick={() => {
                  setIsLogin(!isLogin);
                  setIsOtpSent(false); 
                  setOtp(""); 
              }}>
                {isLogin ? "Create Account" : "Login"}
              </span>
            </p>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={
            <>
                <div className="sale-banner">
                    <p className="scrolling-text">Exclusive New Year Sale: 50% Exchange Offer on Mattresses — Limited Time Remaining!</p>
                </div>
                <div className="container">
                    {currentUser && <h2 style={{color: '#2c3e50', textAlign:'center'}}>Welcome back, {currentUser}</h2>}
                    <h2 style={{marginTop: '20px', textAlign: 'center'}}>Featured Collections</h2>
                    <div className="product-grid">
                    
                    {/* 👇 SKELETON LOADER LOGIC 👇 */}
                    {loading ? (
                        Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="skeleton-card"></div>
                        ))
                    ) : (
                        Array.isArray(products) && products.length > 0 ? (
                            products.map((product) => (
                                <div key={product._id} className="product-card">
                                    <div onClick={() => navigate(`/product/${product._id}`)} style={{cursor: 'pointer'}}>
                                        <img 
                                          src={(product.images && product.images.length > 0) ? product.images[0] : "https://placehold.co/400"} 
                                          alt={product.name} 
                                          loading="lazy" /* Lazy Load for Speed */
                                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400"; }}
                                          style={{ width: '100%', height: '200px', objectFit: 'cover' }}
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
                                                <button className="wishlist-btn" onClick={() => addToWishlist(product)}>&hearts;</button>
                                                <button className="cart-btn" onClick={() => addToCart(product)}>Add to Cart</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{textAlign: 'center', width: '100%', padding: '20px', fontSize: '1.2rem', color: '#666'}}>
                                No products found.
                            </p>
                        )
                    )}
                    {/* 👆 SKELETON LOGIC END 👆 */}

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

      <Footer />
    </div>
  );
}

export default App;
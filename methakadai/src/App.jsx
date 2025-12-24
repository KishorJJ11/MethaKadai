import { useEffect, useState } from 'react';
import axios from 'axios';
import { Routes, Route, useNavigate } from 'react-router-dom'; 
import { Toaster, toast } from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'; 

import Navbar from './components/Navbar';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import Checkout from './components/Checkout';
import ProductDetails from './components/ProductDetails';
import Profile from './components/Profile';
import MyOrders from './components/MyOrders';
import AdminOrders from './components/AdminOrders';
import Footer from './components/Footer'; 
import './Styles/Skeleton.css'; 
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]); 
  
  // --- AUTH UI STATES ---
  const [showLogin, setShowLogin] = useState(false);
  const [authView, setAuthView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  
  // --- AUTH DATA STATES ---
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  // --- SYSTEM STATES ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const navigate = useNavigate();

  const API_URL = import.meta.env.DEV ? "http://localhost:5000" : "https://methakadai.onrender.com"; 

  // --- 1. FETCH PRODUCTS ---
  useEffect(() => {
    setLoading(true); 
    axios.get(`${API_URL}/api/products`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.products || []);
        setProducts(data);
        setLoading(false); 
      })
      .catch(err => { console.error(err); setProducts([]); setLoading(false); });
  }, [API_URL]);

  // --- 2. CHECK SESSION ---
  useEffect(() => {
    const storedUser = localStorage.getItem("methaUser"); 
    if (storedUser) setCurrentUser(JSON.parse(storedUser)); 
  }, []);

  // --- 3. RESET FORM ---
  useEffect(() => {
    if(!showLogin) {
        setAuthView("login");
        setUsername(""); setEmail(""); setPassword(""); setConfirmPassword(""); setOtp(""); setIsOtpSent(false);
    }
  }, [showLogin]);

  // --- HELPER FUNCTIONS ---
  
  // ✅ UPDATE: Hide "General" from Tabs
  const getCategories = () => {
    const categories = products.map(p => p.category || "General");
    const uniqueCategories = [...new Set(categories)];
    // Filter out 'General' so it doesn't show as a tab
    return ["All", ...uniqueCategories.filter(cat => cat !== "General")];
  };

  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(p => (p.category || "General") === selectedCategory);

  // --- CART & WISHLIST ---
  const addToCart = (p) => {
    if (!currentUser) { toast.error("Login Required"); setShowLogin(true); return; }
    const exist = cart.find(i => i._id === p._id);
    if (exist) { setCart(cart.map(i => i._id === p._id ? { ...i, quantity: i.quantity + 1 } : i)); toast.success("Updated Quantity"); }
    else { setCart([...cart, { ...p, quantity: 1 }]); toast.success("Added to Cart"); }
  };
  const updateQuantity = (id, amt) => setCart(cart.map(i => i._id === id ? { ...i, quantity: Math.max(1, i.quantity + amt) } : i));
  const removeFromCart = (id) => setCart(cart.filter((_, i) => i !== id));
  const clearCart = () => setCart([]);
  const addToWishlist = (p) => { if (!currentUser) { setShowLogin(true); return; } if (!wishlist.find(i => i._id === p._id)) { setWishlist([...wishlist, p]); toast.success("Added to Wishlist"); } };
  const removeFromWishlist = (id) => setWishlist(wishlist.filter(i => i._id !== id));
  const handleLogout = () => { localStorage.removeItem("methaUser"); setCurrentUser(null); toast.success("Logged out"); navigate('/'); };

  // --- 🔐 MAIN AUTHENTICATION LOGIC ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    if (authView === "login") {
        try {
            const res = await axios.post(`${API_URL}/api/login`, { email, password });
            toast.success(res.data.message);
            setCurrentUser(res.data.username);
            localStorage.setItem("methaUser", JSON.stringify(res.data.username));
            setShowLogin(false);
        } catch (error) { toast.error(error.response?.data?.message || "Login Failed"); }
    }
    else if (authView === "signup") {
        if (!isOtpSent) {
            if(password !== confirmPassword) return toast.error("Passwords do not match");
            try {
                await axios.post(`${API_URL}/api/send-otp`, { email });
                toast.success("OTP Sent!");
                setIsOtpSent(true);
            } catch (error) { toast.error(error.response?.data?.message || "Error sending OTP"); }
        } else {
            try {
                const res = await axios.post(`${API_URL}/api/signup`, { username, email, password, otp });
                toast.success("Registered!");
                setCurrentUser(username);
                localStorage.setItem("methaUser", JSON.stringify(username));
                setShowLogin(false);
            } catch (error) { toast.error("Invalid OTP"); }
        }
    }
    else if (authView === "forgot_email") {
        try {
            await axios.post(`${API_URL}/api/forget-otp`, { email });
            toast.success("OTP Sent to Email");
            setAuthView("forgot_reset"); 
        } catch (error) { toast.error(error.response?.data?.message || "Email not found"); }
    }
    else if (authView === "forgot_reset") {
        if(password !== confirmPassword) return toast.error("Passwords do not match");
        try {
            await axios.post(`${API_URL}/api/reset-password`, { email, otp, newPassword: password });
            toast.success("Password Reset Successful! Please Login.");
            setAuthView("login"); 
        } catch (error) { toast.error(error.response?.data?.message || "Invalid OTP"); }
    }
  };

  return (
    <div className="app-wrapper">
      <Toaster position="bottom-center" />
      <Navbar cartCount={cart.length} wishlistCount={wishlist.length} setShowLogin={setShowLogin} currentUser={currentUser} handleLogout={handleLogout} /> 

      {/* 🔐 AUTH MODAL */}
      {showLogin && (
        <div className="login-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-x-btn" onClick={() => setShowLogin(false)}>×</button>
            
            <h2>
                {authView === 'login' && 'Welcome Back'}
                {authView === 'signup' && 'Create Account'}
                {authView.includes('forgot') && 'Reset Password'}
            </h2>
            
            <form onSubmit={handleAuthSubmit}>
              {authView === 'signup' && (
                  <input type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)}/>
              )}

              <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={authView === 'forgot_reset' || (authView === 'signup' && isOtpSent)} />

              {authView !== 'forgot_email' && (
                <div className="password-input-container">
                    <input type={showPassword ? "text" : "password"} placeholder={authView === 'forgot_reset' ? "New Password" : "Password"} required value={password} onChange={(e) => setPassword(e.target.value)}/>
                    <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
                </div>
              )}

              {(authView === 'signup' || authView === 'forgot_reset') && (
                  <input type="password" placeholder="Confirm Password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{marginTop:'10px'}} />
              )}

              {((authView === 'signup' && isOtpSent) || authView === 'forgot_reset') && (
                  <input type="text" placeholder="Verification Code (OTP)" required value={otp} onChange={(e) => setOtp(e.target.value)} style={{borderColor: '#2ecc71', backgroundColor: '#eafaf1', marginTop:'10px'}} />
              )}
              
              {authView === 'login' && (
                  <p style={{textAlign:'right', fontSize:'12px', color:'blue', cursor:'pointer'}} onClick={() => setAuthView('forgot_email')}>Forgot Password?</p>
              )}

              <button className="login-submit" style={{marginTop:'15px'}}>
                {authView === 'login' && 'Login'}
                {authView === 'signup' && (isOtpSent ? 'Register' : 'Get OTP')}
                {authView === 'forgot_email' && 'Send OTP'}
                {authView === 'forgot_reset' && 'Change Password'}
              </button>
            </form>

            <p className="switch-text">
                {authView === 'login' ? (
                    <>New here? <span onClick={() => setAuthView('signup')}>Create Account</span></>
                ) : (
                    <span onClick={() => setAuthView('login')}><FaArrowLeft /> Back to Login</span>
                )}
            </p>
          </div>
        </div>
      )}

      {/* --- ROUTES --- */}
      <Routes>
        <Route path="/" element={
          <>
            <div className="sale-banner"><p className="scrolling-text">Exclusive New Year Sale: 50% Exchange offer on Mattresses -- Limited Time Offer!</p></div>
              <div className="container">
                {currentUser && <h2 style={{textAlign:'center'}}>Welcome, {currentUser}</h2>}
                
                {/* Category Buttons - Only shows tabs if more than just "All" exists */}
                {!loading && getCategories().length > 1 && (
                    <div style={{marginTop: '30px'}}>
                        <h3 style={{marginBottom: '10px'}}>Categories:</h3>
                        <div className="category-tabs-container">
                            {getCategories().map(cat => (
                                <button key={cat} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Product Grid */}
                <div className="product-grid" style={{marginTop:'20px'}}>
                    {loading ? (
                        Array.from({length:6}).map((_,i)=><div key={i} className="skeleton-card"></div>)
                    ) : (
                        filteredProducts.length > 0 ? (
                            filteredProducts.map(p => (
                                <div key={p._id} className="product-card">
                                    <div onClick={() => navigate(`/product/${p._id}`)} style={{cursor:'pointer'}}>
                                        <img src={(p.images && p.images[0]) || "https://placehold.co/400"} alt={p.name} loading="lazy" style={{width:'100%', height:'200px', objectFit:'cover'}} onError={(e)=>{e.target.src="https://placehold.co/400"}}/>
                                    </div>
                                    <div className="card-details">
                                        <h3>{p.name}</h3>
                                        <p>{p.size}</p>
                                        <div className="actions-row">
                                            <span className="price">₹{p.price.toLocaleString()}</span>
                                            <div className="buttons-group">
                                                <button className="wishlist-btn" onClick={() => addToWishlist(p)}>&hearts;</button>
                                                <button className="cart-btn" onClick={() => addToCart(p)}>Add</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px'}}>
                                <p style={{fontSize: '18px', color: '#888'}}>No products found in "{selectedCategory}".</p>
                                <button onClick={() => setSelectedCategory("All")} style={{marginTop: '10px', padding: '8px 16px', background: '#2c3e50', color: 'white', border:'none', borderRadius: '4px', cursor: 'pointer'}}>View All Products</button>
                            </div>
                        )
                    )}
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
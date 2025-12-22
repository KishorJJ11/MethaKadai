import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Navbar.css'; 
import logo from '../assets/weblogo.jpeg';

function Navbar({ cartCount, wishlistCount, setShowLogin, currentUser, handleLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // --- NEW FUNCTION: PROTECTED ROUTE ---
  // Idhu dhaan check pannum user irukkara nu
  const handleProtectedNavigation = (path) => {
    if (currentUser) {
        // User irundha, anga kootitu po
        navigate(path);
        setIsMenuOpen(false);
    } else {
        // User illana, Login panna sollu
        alert("Please Login to access this page! 🔒");
        setShowLogin(true);
        setIsMenuOpen(false);
    }
  };

  return (
    <nav className="navbar">
      
      <div className="logo-container" onClick={() => navigate('/')}>
        <img className='web-logo' src={logo} alt="WebLogo" />
        <div className="logo">MethaKadai</div>
      </div>
      
      <div className="nav-actions desktop-menu">
        
        {/* WISHLIST ICON: Click panna 'handleProtectedNavigation' call aagum */}
        <div className="wishlist-icon" onClick={() => handleProtectedNavigation('/wishlist')}>
            <span>Wishlist</span>
            <span className="badge">{wishlistCount}</span>
        </div>
    
        {/* CART ICON: Click panna 'handleProtectedNavigation' call aagum */}
        <div className="cart-icon" onClick={() => handleProtectedNavigation('/cart')}>
          <span>Cart</span>
          <span className="badge">{cartCount}</span>
        </div>

        {/* USER SECTION WITH ORDERS BUTTON */}
            <button 
                className="orders-btn" 
                onClick={() => navigate('/myorders')} 
                title="My Orders"
                style={{marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'}}
            >
                My Orders
            </button>

        {currentUser ? (
            <div className="user-section">
            {/* Admin button inga iruntha adha DELETE pannidu */}
    
              <button className="logout-btn-small" onClick={handleLogout} title="Logout">
                  ⏻
              </button>

              <div className="nav-avatar" onClick={() => navigate('/profile')} title="Go to Profile">
                  {currentUser.charAt(0).toUpperCase()}
              </div>
          </div>
        ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>Login</button>
        )}
      </div>

      <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? "✖" : "☰"} 
      </div>

      {isMenuOpen && (
        <div className="mobile-menu">
            {/* MOBILE VIEW LAYUM PROTECTION VENUM */}
            <div className="mobile-item" onClick={() => handleProtectedNavigation('/wishlist')}>
                ❤️ Wishlist ({wishlistCount})
            </div>
            
            <div className="mobile-item" onClick={() => handleProtectedNavigation('/cart')}>
                🛒 Cart ({cartCount})
            </div>

            <div className="mobile-item" onClick={() => closeMenuAndGo('/myorders')}>
                📦 My Orders
            </div>

            {currentUser ? (
                <>
                    <div className="mobile-item" onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}>
                        👤 My Profile ({currentUser})
                    </div>
                    <div className="mobile-item logout-item" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                        ⏻ Logout
                    </div>
                </>
            ) : (
                <div className="mobile-item login-item" onClick={() => { setShowLogin(true); setIsMenuOpen(false); }}>
                    🔑 Login
                </div>
            )}
        </div>
      )}

    </nav>
  );
}

export default Navbar;
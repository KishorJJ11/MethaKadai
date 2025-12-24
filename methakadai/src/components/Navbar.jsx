import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import '../Styles/Navbar.css'; 
import logo from '../assets/weblogo.jpeg';

function Navbar({ cartCount, wishlistCount, setShowLogin, currentUser, handleLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // --- PROTECTED NAVIGATION ---
  const handleProtectedNavigation = (path) => {
    if (currentUser) {
        navigate(path);
        setIsMenuOpen(false);
    } else {
        toast.error("Please log in to access this page");
        setShowLogin(true);
        setIsMenuOpen(false);
    }
  };

  const handleNavigation = (path) => {
      navigate(path);
      setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      
      <div className="logo-container" onClick={() => navigate('/')}>
        <img className='web-logo' src={logo} alt="MethaKadai Logo" />
        <div className="logo">MethaKadai</div>
      </div>
      
      <div className="nav-actions desktop-menu">
        
        <div className="wishlist-icon" onClick={() => handleProtectedNavigation('/wishlist')}>
            <span>Wishlist</span>
            {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
        </div>
    
        <div className="cart-icon" onClick={() => handleProtectedNavigation('/cart')}>
          <span>Cart</span>
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </div>

        {currentUser && (
            <button 
                className="orders-btn" 
                onClick={() => navigate('/myorders')} 
                title="View My Orders"
                style={{marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '500'}}
            >
                My Orders
            </button>
        )}

        {currentUser ? (
            <div className="user-section">
    
              <button className="logout-btn-small" onClick={handleLogout} title="Logout">
                  Logout
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
        {isMenuOpen ? "✕" : "☰"} 
      </div>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="mobile-menu">
            <div className="mobile-item" onClick={() => handleProtectedNavigation('/wishlist')}>
                Wishlist ({wishlistCount})
            </div>
            
            <div className="mobile-item" onClick={() => handleProtectedNavigation('/cart')}>
                Cart ({cartCount})
            </div>

            {currentUser && (
                <div className="mobile-item" onClick={() => handleNavigation('/myorders')}>
                    Order History
                </div>
            )}

            {currentUser ? (
                <>
                    <div className="mobile-item" onClick={() => handleNavigation('/profile')}>
                        Profile ({currentUser})
                    </div>
                    <div className="mobile-item logout-item" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                        Logout
                    </div>
                </>
            ) : (
                <div className="mobile-item login-item" onClick={() => { setShowLogin(true); setIsMenuOpen(false); }}>
                    Login
                </div>
            )}
        </div>
      )}

    </nav>
  );
}

export default Navbar;
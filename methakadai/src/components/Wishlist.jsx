import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import '../Styles/Wishlist.css';

function Wishlist({ wishlist, addToCart, removeFromWishlist }) {
  const navigate = useNavigate();

  return (
    <div className="wishlist-container">
      
      {/* Navigation Button */}
      <button className="back-btn-top" onClick={() => navigate('/')}>
        ← Continue Shopping
      </button>

      <h2>My Wishlist</h2>

      {wishlist.length === 0 ? (
        <div className="empty-wishlist">
          <p>Your wishlist is currently empty. Explore our collections to add your favorite items.</p>
          
          <button className="start-shop-btn" onClick={() => navigate('/')}>
            Browse Collections
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((product) => (
            <div key={product._id} className="wishlist-card">
              
              {/* Professional Image Handling with Fallback */}
              <img 
                src={(product.images && product.images.length > 0) ? product.images[0] : (product.image || "https://placehold.co/400")} 
                alt={product.name} 
                onClick={() => navigate(`/product/${product._id}`)}
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400"; }}
                style={{cursor: 'pointer', width: '100%', height: '200px', objectFit: 'cover'}}
              />
              
              <div className="wishlist-details">
                <h3 onClick={() => navigate(`/product/${product._id}`)} style={{cursor: 'pointer'}}>
                    {product.name}
                </h3>
                <p className="price">₹{product.price.toLocaleString()}</p>
                
                <div className="wishlist-buttons">
                  <button 
                    className="add-cart-btn" 
                    onClick={() => {
                        addToCart(product);
                        removeFromWishlist(product._id); 
                    }}
                  >
                    Move to Cart
                  </button>
                  
                  <button 
                    className="remove-btn" 
                    onClick={() => removeFromWishlist(product._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
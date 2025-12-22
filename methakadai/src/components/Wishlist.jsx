import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import '../Styles/Wishlist.css';

function Wishlist({ wishlist, addToCart, removeFromWishlist }) {
  const navigate = useNavigate();

  return (
    <div className="wishlist-container">
      
      {/* 1. MELA IRUKKURA BACK BUTTON */}
      <button className="back-btn-top" onClick={() => navigate('/')}>
        ← Continue Shopping
      </button>

      <h2>Unnudaya Wishlist ❤️</h2>

      {wishlist.length === 0 ? (
        <div className="empty-wishlist">
          <p>Wishlist kaali ah irukku! Putha ethavathu pudichurukka nu paarunga.</p>
          
          {/* 2. EMPTY STATE BUTTON */}
          <button className="start-shop-btn" onClick={() => navigate('/')}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((product) => (
            <div key={product._id} className="wishlist-card">
              {/* Image Click panna Product Page pogum */}
              <img 
                src={product.image} 
                alt={product.name} 
                onClick={() => navigate(`/product/${product._id}`)}
                style={{cursor: 'pointer'}}
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
                    Move to Cart 🛒
                  </button>
                  
                  <button 
                    className="remove-btn" 
                    onClick={() => removeFromWishlist(product._id)}
                  >
                    Remove ❌
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
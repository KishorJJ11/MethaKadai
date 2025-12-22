import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Cart.css';

function Cart({ cart, removeFromCart, updateQuantity }) {
  const navigate = useNavigate();

  // Total Calculation
  const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <div className="cart-container">
      
      {/* --- INGA DHAAN ADD PANNIRUKKEN (Back Button) --- */}
      <button className="continue-shop-btn" onClick={() => navigate('/')}>
        ← Continue Shopping
      </button>

      <h2>Your Shopping Cart 🛒</h2>
      
      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Cart is Empty! 😢</p>
          <button className="start-shop-btn" onClick={() => navigate('/')}>Start Shopping</button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <img src={item.image} alt={item.name} />
                
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-price">₹{item.price.toLocaleString()}</p>
                  
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item._id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, 1)}>+</button>
                  </div>
                </div>

                <div className="item-actions">
                    <p className="subtotal">₹{(item.price * item.quantity).toLocaleString()}</p>
                    <button className="remove-btn" onClick={() => removeFromCart(index)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="summary-row">
                <span>Shipping:</span>
                <span style={{color: 'green'}}>Free</span>
            </div>
            <hr />
            <div className="summary-row total">
              <span>Total:</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <button className="checkout-btn" onClick={() => navigate('/checkout')}>
                Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
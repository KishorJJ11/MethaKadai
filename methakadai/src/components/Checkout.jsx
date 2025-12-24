import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react'; 
import '../Styles/Checkout.css';

function Checkout({ cart, clearCart, currentUser }) {
  const navigate = useNavigate();

  // UPI Configuration
  const SHOP_UPI_ID = "6374174627@upi"; 
  const SHOP_NAME = "Kishore Kishore"; 

  // Smart API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', paymentMethod: 'COD'
  });
  
  const [transactionId, setTransactionId] = useState('');

  const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  useEffect(() => {
    if (currentUser) {
        axios.get(`${API_URL}/api/users/${currentUser}`)
            .then(res => {
                const user = res.data;
                setFormData({
                    name: user.username || '',
                    address: user.address || '',
                    phone: user.phone || '',
                    paymentMethod: 'COD'
                });
                toast.success("Shipping details auto-filled");
            })
            .catch(err => console.error("Error fetching user details"));
    }
  }, [currentUser, API_URL]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cart.length === 0) { toast.error("Your cart is empty"); return; }

    if (formData.paymentMethod === 'UPI' && !transactionId) {
        toast.error("Please enter the Transaction ID");
        return;
    }

    const orderData = {
        ...formData,
        cartItems: cart,
        totalAmount: totalAmount,
        orderDate: new Date(),
        transactionId: formData.paymentMethod === 'UPI' ? transactionId : 'COD-Order' 
    };

    try {
        await axios.post(`${API_URL}/api/orders`, orderData);
        toast.success(formData.paymentMethod === 'UPI' ? "Order placed successfully" : "Order placed successfully");
        clearCart();
        navigate('/'); 
    } catch (error) {
        console.error(error);
        toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>

      <div className="checkout-content">
        <form className="checkout-form" onSubmit={handlePlaceOrder}>
            <h3>Shipping Details</h3>
            <label>Name:</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            
            <label>Phone Number:</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
            
            <label>Address:</label>
            <textarea name="address" value={formData.address} onChange={handleChange} required></textarea>

            <h3>Payment Method</h3>
            <div className="payment-options">
                <label>
                    <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange}/> 
                    Cash on Delivery (COD)
                </label>
                <label>
                    <input type="radio" name="paymentMethod" value="UPI" checked={formData.paymentMethod === 'UPI'} onChange={handleChange}/> 
                    UPI / Online Payment
                </label>
            </div>

            {/* --- UPI QR CODE SECTION --- */}
            {formData.paymentMethod === 'UPI' && (
                <div className="upi-section">
                    <p className="upi-instruction">Scan QR Code to Pay <b>₹{totalAmount}</b></p>
                    
                    <div className="qr-box">
                        <QRCodeCanvas 
                            value={`upi://pay?pa=${SHOP_UPI_ID}&pn=${SHOP_NAME}&am=${totalAmount}&cu=INR`}
                            size={160}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"H"} 
                        />
                    </div>
                    
                    <p className="small-note">Supported Apps: GPay, PhonePe, Paytm</p>

                    <label style={{marginTop: '15px'}}>Transaction ID / UTR:</label>
                    <input 
                        type="text" 
                        placeholder="Enter Transaction ID" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="transaction-input"
                        required
                    />
                </div>
            )}

            <button type="submit" className="place-order-btn">
                {formData.paymentMethod === 'UPI' ? 'Confirm Payment & Order' : 'Place Order'} - ₹{totalAmount.toLocaleString()}
            </button>
        </form>

        <div className="order-summary-box">
            <h3>Order Summary</h3>
            {cart.map((item, index) => (
                <div key={index} className="summary-item">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
            ))}
            <hr />
            <div className="total-row"><span>Total:</span><span>₹{totalAmount.toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
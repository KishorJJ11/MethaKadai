import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react'; // ✨ PUTHU IMPORT (Gavanichikko)
import '../Styles/Checkout.css';

function Checkout({ cart, clearCart, currentUser }) {
  const navigate = useNavigate();

  // 🔴 UNGA UPI ID PODU INGA
  const SHOP_UPI_ID = "6374174627@upi"; 
  const SHOP_NAME = "Kishore Kishore"; 

  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', paymentMethod: 'COD'
  });
  
  const [transactionId, setTransactionId] = useState('');

  const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  useEffect(() => {
    if (currentUser) {
        axios.get(`http://localhost:5000/api/users/${currentUser}`)
            .then(res => {
                const user = res.data;
                setFormData({
                    name: user.username || '',
                    address: user.address || '',
                    phone: user.phone || '',
                    paymentMethod: 'COD'
                });
                toast.success("Details Auto-filled! ⚡");
            })
            .catch(err => console.error("Error fetching user"));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cart.length === 0) { toast.error("Cart is empty!"); return; }

    if (formData.paymentMethod === 'UPI' && !transactionId) {
        toast.error("Please enter the UPI Transaction ID! ⚠️");
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
        await axios.post('http://localhost:5000/api/orders', orderData);
        toast.success(formData.paymentMethod === 'UPI' ? "Payment Verified & Order Placed! 🎉" : "Order Placed Successfully! 🎉");
        clearCart();
        navigate('/'); 
    } catch (error) {
        toast.error("Order Failed! Try again.");
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout & Payment 💳</h2>

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
                    Cash on Delivery (COD) 💵
                </label>
                <label>
                    <input type="radio" name="paymentMethod" value="UPI" checked={formData.paymentMethod === 'UPI'} onChange={handleChange}/> 
                    UPI / Online Payment 📱
                </label>
            </div>

            {/* --- UPI QR CODE SECTION (UPDATED) --- */}
            {formData.paymentMethod === 'UPI' && (
                <div className="upi-section">
                    <p className="upi-instruction">Scan this QR to Pay <b>₹{totalAmount}</b></p>
                    
                    <div className="qr-box">
                        {/* PUTHU COMPONENT: QRCodeCanvas */}
                        <QRCodeCanvas 
                            value={`upi://pay?pa=${SHOP_UPI_ID}&pn=${SHOP_NAME}&am=${totalAmount}&cu=INR`}
                            size={160}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"H"} // High Error Correction
                        />
                    </div>
                    
                    <p className="small-note">Open GPay/PhonePe & Scan</p>

                    <label style={{marginTop: '15px'}}>Enter Transaction ID (UTR):</label>
                    <input 
                        type="text" 
                        placeholder="Ex: 34567891012" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="transaction-input"
                        required
                    />
                </div>
            )}

            <button type="submit" className="place-order-btn">
                {formData.paymentMethod === 'UPI' ? 'Verify & Pay' : 'Confirm Order'} - ₹{totalAmount.toLocaleString()}
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
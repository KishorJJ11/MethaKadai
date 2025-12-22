import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Styles/MyOrders.css';
import { useNavigate } from 'react-router-dom';

function MyOrders({ currentUser }) {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
        navigate('/'); // Login pannalana veliya po
    } else {
        fetchOrders();
    }
  }, [currentUser]);

  const fetchOrders = async () => {
    try {
        const res = await axios.get(`http://localhost:5000/api/myorders/${currentUser}`);
        setOrders(res.data);
    } catch (error) {
        console.error("Orders load aagala");
    }
  };

  // Tracking Status Logic
  const getStatusStep = (status) => {
    const steps = ["Ordered", "Shipped", "Out for Delivery", "Delivered"];
    // Status endha edathula irukku nu kandupidi (0, 1, 2, or 3)
    return steps.indexOf(status) !== -1 ? steps.indexOf(status) : 0; 
  };

  return (
    <div className="orders-container">
      <h2>📦 My Orders</h2>

      {orders.length === 0 ? (
        <div className="no-orders">
            <p>Neenga innum edhum order pannala mapla! 🛍️</p>
            <button onClick={() => navigate('/')}>Start Shopping</button>
        </div>
      ) : (
        <div className="orders-list">
            {orders.map((order) => (
                <div key={order._id} className="order-card">
                    
                    {/* Header: Order ID & Date */}
                    <div className="order-header">
                        <span className="order-id">Order ID: #{order._id.slice(-6).toUpperCase()}</span>
                        <span className="order-date">{new Date(order.orderDate).toLocaleDateString()}</span>
                    </div>

                    {/* Order Items */}
                    <div className="order-items">
                        {order.cartItems.map((item, index) => (
                            <div key={index} className="order-item-row">
                                <img src={item.image} alt={item.name} />
                                <div className="item-info">
                                    <h4>{item.name}</h4>
                                    <p>Qty: {item.quantity} | ₹{item.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total & Status */}
                    <div className="order-footer">
                        <h3>Total: ₹{order.totalAmount.toLocaleString()}</h3>
                        <p className="payment-mode">Paid via: {order.paymentMethod}</p>
                    </div>

                    {/* --- TRACKING BAR --- */}
                    <div className="tracking-container">
                        <div className="track-line">
                            <div 
                                className="track-progress" 
                                style={{ width: `${getStatusStep(order.status) * 33}%` }}
                            ></div>
                        </div>
                        
                        <div className="track-steps">
                            {["Ordered", "Shipped", "Out for Delivery", "Delivered"].map((step, index) => (
                                <div key={index} className={`step ${index <= getStatusStep(order.status) ? 'active' : ''}`}>
                                    <div className="dot"></div>
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
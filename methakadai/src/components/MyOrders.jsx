import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import '../Styles/MyOrders.css';

const MyOrders = ({ currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Smart API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return; 
    }

    // Fetch User Orders
    axios.get(`${API_URL}/api/myorders/${currentUser}`)
      .then(res => {
        // Ensure data is an array
        if(Array.isArray(res.data)) {
            setOrders(res.data);
        } else {
            setOrders([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching orders", err);
        setLoading(false);
      });
  }, [currentUser, API_URL]);

  // --- CANCEL ORDER FUNCTION ---
  const cancelOrder = async (orderId) => {
    if(!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
        const res = await axios.put(`${API_URL}/api/orders/${orderId}/cancel`);
        toast.success("Order cancelled successfully");
        
        // Update UI locally
        setOrders(orders.map(order => 
            order._id === orderId ? { ...order, status: 'Cancelled' } : order
        ));
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to cancel order");
    }
  };

  if (!currentUser) return (
    <div style={{textAlign:'center', marginTop:'50px', color: '#555'}}>
        <h2>Please log in to view your order history.</h2>
        <button onClick={() => navigate('/')} style={{padding:'10px 20px', marginTop:'15px', cursor:'pointer', background: 'black', color: 'white', border: 'none', borderRadius: '4px'}}>Go Home</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px' }}>
      <Toaster />
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '15px', fontSize: '24px' }}>Order History</h1>

      {loading ? <p style={{textAlign: 'center', marginTop: '20px'}}>Loading orders...</p> : (
        orders.length === 0 ? (
            <div style={{textAlign:'center', marginTop:'40px', color: '#666'}}>
                <h3>No orders found.</h3>
                <p style={{marginBottom: '20px'}}>Looks like you haven't placed any orders yet.</p>
                <button onClick={() => navigate('/')} style={{background:'black', color:'white', padding:'12px 24px', border:'none', cursor:'pointer', borderRadius:'5px', fontSize: '16px'}}>Browse Products</button>
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {orders.map(order => (
                    <div key={order._id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', backgroundColor: order.status === 'Cancelled' ? '#f8f9fa' : 'white' }}>
                        
                        {/* Order Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#333', margin: '0 0 5px' }}>Order ID: <strong style={{fontFamily: 'monospace'}}>{order._id.toUpperCase()}</strong></p>
                                <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{new Date(order.orderDate).toLocaleString()}</p>
                            </div>
                            <div style={{textAlign: 'right'}}>
                                <span style={{ 
                                    padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase',
                                    backgroundColor: order.status === 'Delivered' ? '#28a745' : (order.status === 'Cancelled' ? '#dc3545' : '#ffc107'),
                                    color: 'white'
                                }}>
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div style={{marginBottom: '15px'}}>
                            {order.cartItems.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center' }}>
                                    <img 
                                        src={(item.images && item.images.length > 0) ? item.images[0] : (item.image || "https://placehold.co/70")} 
                                        alt={item.name} 
                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/70"; }}
                                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee', opacity: order.status === 'Cancelled' ? 0.6 : 1 }} 
                                    />
                                    <div>
                                        <p style={{ margin: '0 0 5px', fontWeight: '600', color: '#333' }}>{item.name}</p>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Size: {item.size} | Qty: {item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer (Total & Cancel Button) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Total: ₹{order.totalAmount.toLocaleString()}</h3>
                            
                            {order.status === 'Ordered' && (
                                <button 
                                    onClick={() => cancelOrder(order._id)}
                                    style={{ 
                                        backgroundColor: 'white', color: '#dc3545', border: '1px solid #dc3545', 
                                        padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {e.target.style.background = '#dc3545'; e.target.style.color = 'white'}}
                                    onMouseOut={(e) => {e.target.style.background = 'white'; e.target.style.color = '#dc3545'}}
                                >
                                    Cancel Order
                                </button>
                            )}
                            
                            {order.status === 'Cancelled' && <p style={{color: '#dc3545', fontWeight: 'bold', margin: 0, fontSize: '14px'}}>Order Cancelled</p>}
                        </div>

                    </div>
                ))}
            </div>
        )
      )}
    </div>
  );
};

export default MyOrders;
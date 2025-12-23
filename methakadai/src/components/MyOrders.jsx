import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import '../Styles/MyOrders.css';

const MyOrders = ({ currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // API URL Setup
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return; // Login pannalana onnum panna vendam
    }

    // User oda Orders-a fetch pannuvom
    axios.get(`${API_URL}/api/myorders/${currentUser}`)
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching orders", err);
        setLoading(false);
      });
  }, [currentUser]);

  // --- CANCEL ORDER FUNCTION ---
  const cancelOrder = async (orderId) => {
    if(!window.confirm("Unmaiyave indha order-a Cancel pannidava? 😢")) return;

    try {
        const res = await axios.put(`${API_URL}/api/orders/${orderId}/cancel`);
        toast.success(res.data.message);
        
        // Update UI locally (Refresh pannama status maarum)
        setOrders(orders.map(order => 
            order._id === orderId ? { ...order, status: 'Cancelled' } : order
        ));
    } catch (error) {
        toast.error(error.response?.data?.message || "Cancel panna mudiyala!");
    }
  };

  if (!currentUser) return (
    <div style={{textAlign:'center', marginTop:'50px'}}>
        <h2>Please Login to view your orders 🔒</h2>
        <button onClick={() => navigate('/')} style={{padding:'10px 20px', marginTop:'10px', cursor:'pointer'}}>Go Home</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px' }}>
      <Toaster />
      <h1 style={{ borderBottom: '3px solid black', paddingBottom: '10px' }}>📦 My Orders</h1>

      {loading ? <p>Loading Orders...</p> : (
        orders.length === 0 ? (
            <div style={{textAlign:'center', marginTop:'40px'}}>
                <h3>Innum oru order kooda podala mapla! 🛍️</h3>
                <p>Poi edhavadhu vaangu...</p>
                <button onClick={() => navigate('/')} style={{background:'black', color:'white', padding:'10px', border:'none', cursor:'pointer', borderRadius:'5px'}}>Start Shopping</button>
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {orders.map(order => (
                    <div key={order._id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', background: order.status === 'Cancelled' ? '#f9f9f9' : 'white' }}>
                        
                        {/* Order Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#555', margin: 0 }}>Order ID: <strong>{order._id}</strong></p>
                                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{new Date(order.orderDate).toLocaleString()}</p>
                            </div>
                            <div style={{textAlign: 'right'}}>
                                <span style={{ 
                                    padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                                    backgroundColor: order.status === 'Delivered' ? '#d4edda' : (order.status === 'Cancelled' ? '#f8d7da' : '#fff3cd'),
                                    color: order.status === 'Delivered' ? '#155724' : (order.status === 'Cancelled' ? '#721c24' : '#856404')
                                }}>
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div style={{marginBottom: '15px'}}>
                            {order.cartItems.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                    <img 
                                        src={(item.images && item.images.length > 0) ? item.images[0] : (item.image || "https://placehold.co/70")} 
                                        alt={item.name} 
                                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '5px', opacity: order.status === 'Cancelled' ? 0.5 : 1 }} 
                                    />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{item.name}</p>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Size: {item.size} | Qty: {item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer (Total & Cancel Button) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                            <h3 style={{ margin: 0 }}>Total: ₹{order.totalAmount}</h3>
                            
                            {/* Cancel Button Logic: Ordered ah irundha mattum kaattu */}
                            {order.status === 'Ordered' && (
                                <button 
                                    onClick={() => cancelOrder(order._id)}
                                    style={{ 
                                        backgroundColor: '#ff4d4d', color: 'white', border: 'none', 
                                        padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' 
                                    }}
                                >
                                    Cancel Order ❌
                                </button>
                            )}
                            
                            {order.status === 'Cancelled' && <p style={{color: 'red', fontWeight: 'bold'}}>❌ Order Cancelled</p>}
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
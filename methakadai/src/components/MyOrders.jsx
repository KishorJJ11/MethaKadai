import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaSync } from 'react-icons/fa'; // Install react-icons if needed, or remove icon
import '../Styles/MyOrders.css';

const MyOrders = ({ currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Smart API URL
  const API_URL = window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://methakadai.onrender.com";

  // Function to load orders
  const loadOrders = () => {
    if (!currentUser) return;
    setLoading(true);
    axios.get(`${API_URL}/api/myorders/${currentUser}`)
      .then(res => {
        setOrders(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching orders", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser, API_URL]);

  const cancelOrder = async (orderId, currentStatus) => {
    if (currentStatus !== 'Ordered') {
        toast.error("Order cannot be cancelled at this stage.");
        return;
    }
    if(!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
        await axios.put(`${API_URL}/api/orders/${orderId}/cancel`);
        toast.success("Order cancelled successfully");
        // Refresh local state
        setOrders(orders.map(order => order._id === orderId ? { ...order, status: 'Cancelled' } : order));
    } catch (error) {
        toast.error("Failed to cancel order");
    }
  };

  if (!currentUser) return (
    <div style={{textAlign:'center', marginTop:'80px', color: '#555'}}>
        <h2>Please log in to view your order history.</h2>
        <button onClick={() => navigate('/')} style={{padding:'10px 20px', marginTop:'15px', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor:'pointer'}}>Go Home</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px' }}>
      <Toaster />
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '2px solid #eee', paddingBottom: '15px'}}>
          <h1 style={{fontSize: '24px', margin:0}}>Order History</h1>
          <button onClick={loadOrders} style={{background:'none', border:'1px solid #ccc', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
             Refresh ⟳
          </button>
      </div>

      {loading ? <p style={{textAlign: 'center', marginTop: '40px', color:'#777'}}>Loading your orders...</p> : (
        orders.length === 0 ? (
            <div style={{textAlign:'center', marginTop:'50px', color: '#666'}}>
                <h3>No orders found.</h3>
                <p style={{marginBottom: '20px'}}>Looks like you haven't placed any orders yet.</p>
                <button onClick={() => navigate('/')} style={{background:'black', color:'white', padding:'12px 24px', border:'none', cursor:'pointer', borderRadius:'5px', fontSize: '16px'}}>Start Shopping</button>
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {orders.map(order => (
                    <div key={order._id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', backgroundColor: order.status === 'Cancelled' ? '#f9f9f9' : 'white', opacity: order.status === 'Cancelled' ? 0.8 : 1 }}>
                        
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#333', margin: '0 0 5px' }}>Order ID: <strong style={{fontFamily: 'monospace'}}>{order._id.substring(0,8).toUpperCase()}</strong></p>
                                <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{new Date(order.orderDate).toLocaleString()}</p>
                            </div>
                            <div>
                                <span style={{ 
                                    padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase',
                                    backgroundColor: order.status === 'Delivered' ? '#28a745' : (order.status === 'Cancelled' ? '#dc3545' : (order.status === 'Shipped' ? '#17a2b8' : '#ffc107')),
                                    color: 'white'
                                }}>
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        {/* Items */}
                        <div style={{marginBottom: '15px'}}>
                            {order.cartItems.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'center' }}>
                                    <img 
                                        src={(item.images && item.images[0]) || "https://placehold.co/70"} 
                                        alt={item.name} 
                                        onError={(e) => { e.target.src = "https://placehold.co/70"; }}
                                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} 
                                    />
                                    <div>
                                        <p style={{ margin: '0 0 5px', fontWeight: '600', color: '#333' }}>{item.name}</p>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Size: {item.size} | Qty: {item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Total: ₹{order.totalAmount.toLocaleString()}</h3>
                            
                            {order.status === 'Ordered' ? (
                                <button 
                                    onClick={() => cancelOrder(order._id, order.status)}
                                    style={{ backgroundColor: 'white', color: '#dc3545', border: '1px solid #dc3545', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                                    onMouseOver={(e) => {e.target.style.background = '#dc3545'; e.target.style.color = 'white'}}
                                    onMouseOut={(e) => {e.target.style.background = 'white'; e.target.style.color = '#dc3545'}}
                                >
                                    Cancel Order
                                </button>
                            ) : (
                                <span style={{fontSize:'14px', fontWeight:'bold', color: order.status==='Shipped'?'#17a2b8': order.status==='Delivered'?'#28a745':'#dc3545'}}>
                                    {order.status === 'Shipped' && "Out for Delivery 🚚"}
                                    {order.status === 'Delivered' && "Delivered ✅"}
                                    {order.status === 'Cancelled' && "Cancelled ❌"}
                                </span>
                            )}
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
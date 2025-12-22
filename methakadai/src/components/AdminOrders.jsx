import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import '../Styles/AdminOrders.css';

function AdminOrders({ currentUser }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null); // Idhu dhaan Popup state
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser !== 'admin') {
        navigate('/'); 
    } else {
        fetchOrders();
    }
  }, [currentUser]);

  const fetchOrders = async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/orders');
        setOrders(res.data.reverse()); 
    } catch (error) {
        console.error("Orders load aagala");
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
        await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: newStatus });
        toast.success(`Status Updated to: ${newStatus} ✅`);
        fetchOrders(); 
        
        // Popup open la iruntha, angayum status update aaganum
        if (selectedOrder && selectedOrder._id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
    } catch (error) {
        toast.error("Update Failed!");
    }
  };

  const statusOptions = ["Ordered", "Shipped", "Out for Delivery", "Delivered"];

  return (
    <div className="admin-container">
      <h2>👑 Admin Dashboard - Orders</h2>
      
      <div className="table-responsive">
        <table className="orders-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th> {/* View Button Inga Varum */}
                </tr>
            </thead>
            <tbody>
                {orders.map((order) => (
                    <tr key={order._id}>
                        <td className="id-col">#{order._id.slice(-6).toUpperCase()}</td>
                        <td>
                            <b>{order.name}</b><br/>
                            <span className="sub-text">{order.phone}</span>
                        </td>
                        <td className="amount-col">₹{order.totalAmount.toLocaleString()}</td>
                        <td>
                            <span className={`status-badge ${order.status.toLowerCase().replace(/ /g, '-')}`}>
                                {order.status}
                            </span>
                        </td>
                        <td>
                            {/* VIEW BUTTON (EYE ICON) */}
                            <button 
                                className="view-btn" 
                                onClick={() => setSelectedOrder(order)}
                                title="View Full Details"
                            >
                                👁️ View
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- MODAL POPUP (FULL DETAILS) --- */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h3>Order Details <span className="highlight-id">#{selectedOrder._id.slice(-6).toUpperCase()}</span></h3>
                    <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>
                </div>

                <div className="modal-body">
                    
                    {/* SECTION 1: CUSTOMER & ADDRESS (Inga dhaan Full Address Varum) */}
                    <div className="detail-section">
                        <h4>👤 Customer Information</h4>
                        <div className="info-grid">
                            <p><strong>Name:</strong> {selectedOrder.name}</p>
                            <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                            <p><strong>Email:</strong> {selectedOrder.email || "Not Provided"}</p>
                            <div className="full-address-box">
                                <strong>🏠 Delivery Address:</strong>
                                <p>{selectedOrder.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: PAYMENT & STATUS */}
                    <div className="detail-section">
                        <h4>💳 Payment & Status</h4>
                        <p><strong>Method:</strong> {selectedOrder.paymentMethod === 'UPI' ? '📱 UPI Online' : '💵 Cash on Delivery'}</p>
                        {selectedOrder.paymentMethod === 'UPI' && (
                            <p><strong>Transaction ID:</strong> <span className="txn-highlight">{selectedOrder.transactionId}</span></p>
                        )}
                        <p><strong>Total Amount:</strong> <span className="price-highlight">₹{selectedOrder.totalAmount.toLocaleString()}</span></p>
                        
                        {/* Status Change Inside Modal */}
                        <div className="status-control">
                            <strong>Current Status:</strong>
                            <select 
                                value={selectedOrder.status} 
                                onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                            >
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* SECTION 3: PRODUCT LIST */}
                    <div className="detail-section full-width">
                        <h4>🛒 Ordered Items</h4>
                        <div className="item-list-container">
                            {selectedOrder.cartItems.map((item, idx) => (
                                <div key={idx} className="modal-item-row">
                                    <img src={item.image} alt={item.name} />
                                    <div className="modal-item-info">
                                        <h5>{item.name}</h5>
                                        <p>{item.size} | {item.material}</p>
                                        <p>₹{item.price} x {item.quantity} = <b>₹{item.price * item.quantity}</b></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="modal-footer">
                    <button className="close-btn-main" onClick={() => setSelectedOrder(null)}>Close</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default AdminOrders;
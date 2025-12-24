import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/AdminOrders.css'; 

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); 
  
  // Edit State
  const [editId, setEditId] = useState(null);
  
  // 👇 PUTHU STATE: VIEW ORDER DETAILS 
  const [selectedOrder, setSelectedOrder] = useState(null); 

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', size: '', material: '', warranty: '', 
    images: '', description: ''
  });

  const [loading, setLoading] = useState(false);
  
  // Use .env or fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      setOrders(res.data);
    } catch (err) { console.error("Error fetching orders:", err); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data);
    } catch (err) { console.error("Error fetching products:", err); }
  };

  const handleChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const deleteProduct = async (id) => {
    if(!window.confirm("Delete pannidava?")) return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`);
      alert("Product Deleted! 💥");
      fetchProducts(); 
    } catch (err) { alert("Delete fail!"); }
  };

  const handleEdit = (product) => {
    setEditId(product._id); 
    const imagesString = product.images ? product.images.join(', ') : '';
    setNewProduct({
        name: product.name,
        price: product.price,
        size: product.size,
        material: product.material,
        warranty: product.warranty,
        images: imagesString,
        description: product.description
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setNewProduct({ name: '', price: '', size: '', material: '', warranty: '', images: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const imageArray = newProduct.images.split(',').map(url => url.trim()).filter(url => url !== ""); 
    const productToSend = { ...newProduct, images: imageArray }; 

    try {
        if (editId) {
            await axios.put(`${API_URL}/api/products/${editId}`, productToSend);
            alert('Product Updated Successfully! ✨');
            setEditId(null);
        } else {
            await axios.post(`${API_URL}/api/products`, productToSend);
            alert('Product Added! 🔥');
        }
        setNewProduct({ name: '', price: '', size: '', material: '', warranty: '', images: '', description: '' });
        fetchProducts();
    } catch (error) {
        console.error(error);
        alert('Operation Failed');
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/orders/${id}/status`, { status });
      fetchOrders();
    } catch (err) { alert("Status update failed"); }
  };

  return (
    <div className="admin-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <h1>👑 Admin Dashboard</h1>

      {/* --- SECTION 1: ADD / EDIT PRODUCT --- */}
      <div className="add-product-section" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '40px', border: editId ? '2px solid orange' : '1px solid #ddd' }}>
        
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2>{editId ? "✏️ Edit Product" : "➕ Add New Product"}</h2>
            {editId && <button onClick={cancelEdit} style={{background: 'gray', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '5px'}}>Cancel Edit ❌</button>}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <input name="name" placeholder="Name" value={newProduct.name} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="price" type="number" placeholder="Price" value={newProduct.price} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="size" placeholder="Size" value={newProduct.size} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="material" placeholder="Material" value={newProduct.material} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="warranty" placeholder="Warranty" value={newProduct.warranty} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="images" placeholder="Image URLs (Comma separated)" value={newProduct.images} onChange={handleChange} required style={{ padding: '10px' }} />
          <textarea name="description" placeholder="Description" value={newProduct.description} onChange={handleChange} style={{ gridColumn: 'span 2', padding: '10px', height: '80px' }} />
          <button type="submit" disabled={loading} style={{ gridColumn: 'span 2', padding: '15px', background: editId ? 'orange' : '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            {loading ? "Processing..." : (editId ? "Update Product ✨" : "🚀 Add Product Now")}
          </button>
        </form>
      </div>

      {/* --- SECTION 2: PRODUCT LIST --- */}
      <div className="product-list" style={{ marginBottom: '40px' }}>
        <h2>📦 Available Products ({products.length})</h2>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px' }}>
          {products.map(p => (
            <div key={p._id} style={{ border: '1px solid #ddd', padding: '10px', minWidth: '200px', borderRadius: '5px' }}>
              <img 
                src={(p.images && p.images.length > 0) ? p.images[0] : (p.image || "https://placehold.co/400")}
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400"; }}
                alt={p.name} 
                style={{ width: '100%', height: '120px', objectFit: 'cover' }} 
              />
              <p><strong>{p.name}</strong></p>
              <p>₹{p.price}</p>
              <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                  <button onClick={() => handleEdit(p)} style={{ flex: 1, padding: '8px', backgroundColor: 'orange', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Edit ✏️</button>
                  <button onClick={() => deleteProduct(p._id)} style={{ flex: 1, padding: '8px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Delete 🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* --- SECTION 3: ORDERS --- */}
      <div className="orders-section">
        <h2>🚚 Recent Orders</h2>
        {orders.length === 0 ? <p>Innum orders varala mapla...</p> : (
          <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#333', color: 'white', width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <th style={{ padding: '10px' }}>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} style={{ borderBottom: '1px solid #ccc', textAlign: 'center' }}>
                  <td style={{ padding: '10px' }}>{order._id.substring(0, 6)}...</td>
                  <td>{order.name}</td>
                  <td>{order.cartItems.length} Items</td>
                  <td>₹{order.totalAmount}</td>
                  <td style={{ fontWeight: 'bold', color: order.status === 'Delivered' ? 'green' : order.status === 'Cancelled' ? 'red' : order.status === 'Shipped' ? 'purple' : 'orange' }}>{order.status}</td>
                  <td style={{display:'flex', justifyContent:'center', gap:'10px'}}>
                    <select onChange={(e) => updateStatus(order._id, e.target.value)} value={order.status} style={{ padding: '5px' }}>
                      <option value="Ordered">Ordered</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                    
                    {/* 👇 VIEW BUTTON */}
                    <button 
                        onClick={() => setSelectedOrder(order)} 
                        style={{background: '#007bffd0', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer'}}
                    >
                        View 👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* --- MODAL POPUP (DETAILS VIEW) --- */}
      {selectedOrder && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '500px', 
                maxHeight: '80vh', overflowY: 'auto', position: 'relative'
            }}>
                <button 
                    onClick={() => setSelectedOrder(null)} 
                    style={{position: 'absolute', top: '10px', right: '10px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer'}}
                >
                    ×
                </button>
                
                <h2 style={{borderBottom: '2px solid #ddd', paddingBottom: '10px'}}>📦 Order Details</h2>
                
                <div style={{marginTop: '15px'}}>
                    <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                    <p><strong>Customer:</strong> {selectedOrder.name}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                    <p><strong>Address:</strong> {selectedOrder.address}</p>
                    <p><strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
                    <p><strong>Payment:</strong> {selectedOrder.paymentMethod} {selectedOrder.transactionId && `(ID: ${selectedOrder.transactionId})`}</p>
                </div>

                <h3 style={{marginTop: '20px', background: '#eee', padding: '5px'}}>🛒 Purchased Items</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px'}}>
                    {selectedOrder.cartItems.map((item, index) => (
                        <div key={index} style={{display: 'flex', gap: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>
                            <img 
                                src={(item.images && item.images.length > 0) ? item.images[0] : (item.image || "https://placehold.co/70")} 
                                alt={item.name} 
                                style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '5px'}}
                            />
                            <div>
                                <p style={{fontWeight: 'bold', margin: 0}}>{item.name}</p>
                                <p style={{margin: 0, fontSize: '14px', color: '#555'}}>Qty: {item.quantity} | Size: {item.size}</p>
                                <p style={{margin: 0, fontWeight: 'bold', color: 'green'}}>₹{item.price * item.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{marginTop: '20px', textAlign: 'right', borderTop: '2px solid #ddd', paddingTop: '10px'}}>
                    <h3>Total Amount: <span style={{color: 'green'}}>₹{selectedOrder.totalAmount}</span></h3>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
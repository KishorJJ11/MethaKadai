import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; 
import '../Styles/AdminOrders.css'; 

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); 
  
  // Edit State
  const [editId, setEditId] = useState(null);
  
  // View Order Details State
  const [selectedOrder, setSelectedOrder] = useState(null); 

  // State for New Product
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', mrp: '', size: '', material: '', warranty: '', 
    images: '', description: '', category: '' 
  });

  const [loading, setLoading] = useState(false);
  
  // URL Logic
  const API_URL = window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://methakadai.onrender.com";

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  // 🔥 UPDATE: SORTING ORDERS (LATEST FIRST)
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      const data = Array.isArray(res.data) ? res.data : [];
      
      // Sort: Newest Date (b) - Oldest Date (a)
      const sortedData = data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      
      setOrders(sortedData);
    } catch (err) { 
        console.error("Error fetching orders:", err);
        setOrders([]); 
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
        console.error("Error fetching products:", err);
        setProducts([]); 
    }
  };

  // HELPER: Get Unique Categories
  const existingCategories = Array.isArray(products) 
    ? [...new Set(products.map(p => p.category || "General"))] 
    : [];

  const handleChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const deleteCategory = async (categoryName) => {
    if (categoryName === "General") return toast.error("Cannot delete 'General'.");
    if (!window.confirm(`Delete '${categoryName}'?`)) return;
    try {
        await axios.put(`${API_URL}/api/categories/delete`, { categoryName });
        toast.success(`Deleted ${categoryName}`);
        fetchProducts(); 
    } catch (error) { toast.error("Failed to delete category."); }
  };

  const deleteProduct = async (id) => {
    if(!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`);
      toast.success("Deleted");
      fetchProducts(); 
    } catch (err) { toast.error("Failed to delete"); }
  };

  const handleEdit = (product) => {
    setEditId(product._id); 
    const imagesString = product.images ? product.images.join(', ') : '';
    setNewProduct({
        name: product.name,
        price: product.price,
        mrp: product.mrp || product.price, 
        size: product.size,
        material: product.material,
        warranty: product.warranty,
        images: imagesString,
        description: product.description,
        category: product.category || "General" 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setNewProduct({ name: '', price: '', mrp: '', size: '', material: '', warranty: '', images: '', description: '', category: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const imageArray = newProduct.images.split(',').map(url => url.trim()).filter(url => url !== ""); 

    let submitPrice = Number(newProduct.price);
    let submitMrp = Number(newProduct.mrp);

    if (!submitMrp || submitMrp < submitPrice) submitMrp = submitPrice; 

    const productToSend = { 
        ...newProduct, 
        price: submitPrice, 
        mrp: submitMrp, 
        images: imageArray,
        category: newProduct.category || "General" 
    }; 

    try {
        if (editId) {
            await axios.put(`${API_URL}/api/products/${editId}`, productToSend);
            toast.success('Updated successfully');
            setEditId(null);
        } else {
            await axios.post(`${API_URL}/api/products`, productToSend);
            toast.success('Added successfully');
        }
        setNewProduct({ name: '', price: '', mrp: '', size: '', material: '', warranty: '', images: '', description: '', category: '' });
        fetchProducts();
    } catch (error) { toast.error('Operation Failed'); }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try { await axios.put(`${API_URL}/api/orders/${id}/status`, { status }); toast.success("Status Updated"); fetchOrders(); } catch (err) { toast.error("Failed"); }
  };

  return (
    <div className="admin-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Admin Dashboard</h1>
      <p style={{fontSize:'10px', color:'#888', textAlign:'right'}}>Connected to: {API_URL}</p>

      {/* FORM */}
      <div className="add-product-section" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '40px', border: editId ? '2px solid #ffc107' : '1px solid #ddd' }}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <h2>{editId ? "Edit Product" : "Add New Product"}</h2>
            {editId && <button onClick={cancelEdit}>Cancel</button>}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          <div style={{gridColumn: 'span 2', background: '#e9ecef', padding: '10px', borderRadius: '5px'}}>
             <label>Product Category:</label>
             <div style={{display: 'flex', gap: '10px'}}>
                 <select onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} value="" style={{padding: '10px', flex: 1}}>
                     <option value="" disabled>-- Select Existing --</option>
                     {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </select>
                 <input name="category" placeholder="Type Category Name" value={newProduct.category} onChange={handleChange} required style={{ padding: '10px', flex: 1.5 }} />
             </div>
          </div>

          <input name="name" placeholder="Product Name" value={newProduct.name} onChange={handleChange} required style={{ padding: '10px' }} />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
                <label style={{fontSize: '12px', fontWeight: 'bold'}}>MRP</label>
                <input name="mrp" type="number" placeholder="MRP" value={newProduct.mrp} onChange={handleChange} required style={{ padding: '10px', width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{fontSize: '12px', fontWeight: 'bold'}}>Price</label>
                <input name="price" type="number" placeholder="Price" value={newProduct.price} onChange={handleChange} required style={{ padding: '10px', width: '100%' }} />
            </div>
          </div>

          <input name="size" placeholder="Size" value={newProduct.size} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="material" placeholder="Material" value={newProduct.material} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="warranty" placeholder="Warranty" value={newProduct.warranty} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="images" placeholder="Image URLs" value={newProduct.images} onChange={handleChange} required style={{ padding: '10px' }} />
          <textarea name="description" placeholder="Description" value={newProduct.description} onChange={handleChange} style={{ gridColumn: 'span 2', padding: '10px', height: '80px' }} />
          
          <button type="submit" disabled={loading} style={{ gridColumn: 'span 2', padding: '15px', background: editId ? '#ffc107' : '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? "Processing..." : (editId ? "Update Product" : "Add Product")}
          </button>
        </form>
      </div>

      {/* CATEGORIES */}
      <div className="category-manager" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd' }}>
        <h3>Manage Categories</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {existingCategories.map(cat => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e3f2fd', padding: '5px 15px', borderRadius: '20px' }}>
                    <span>{cat}</span>
                    {cat !== "General" && <button onClick={() => deleteCategory(cat)} style={{ color: 'red', border: 'none', cursor: 'pointer' }}>✕</button>}
                </div>
            ))}
        </div>
      </div>

      {/* PRODUCT LIST */}
      <div className="product-list" style={{ marginBottom: '40px' }}>
        <h2>Available Products ({products.length})</h2>
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '10px' }}>
          {Array.isArray(products) && products.length > 0 ? (
            products.map(p => (
                <div key={p._id} style={{ border: '1px solid #ddd', padding: '15px', minWidth: '220px', borderRadius: '8px', background: 'white' }}>
                    <span style={{background: '#6c757d', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '10px'}}>{p.category || "General"}</span>
                    <img src={(p.images && p.images[0]) || "https://placehold.co/400"} alt={p.name} style={{ width: '100%', height: '140px', objectFit: 'cover', marginTop: '5px' }} />
                    <p style={{fontSize: '16px', margin: '5px 0'}}><strong>{p.name}</strong></p>
                    <div style={{marginBottom: '10px'}}>
                        {p.mrp && p.mrp > p.price && <span style={{textDecoration:'line-through', color:'#888', marginRight:'5px'}}>₹{p.mrp}</span>}
                        <span style={{fontWeight:'bold'}}>₹{p.price}</span>
                    </div>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={() => handleEdit(p)} style={{ flex: 1, padding: '5px', background: '#ffc107', border: 'none', borderRadius: '4px' }}>Edit</button>
                        <button onClick={() => deleteProduct(p._id)} style={{ flex: 1, padding: '5px', background: '#dc3545', color:'white', border: 'none', borderRadius: '4px' }}>Delete</button>
                    </div>
                </div>
            ))
          ) : <p>No products available.</p>}
        </div>
      </div>
      
      {/* RECENT ORDERS */}
      <div className="orders-section">
        <h2>Recent Orders</h2>
        
        {!Array.isArray(orders) || orders.length === 0 ? (
            <p style={{color: '#666', fontStyle: 'italic'}}>No orders found.</p>
        ) : (
          <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#343a40', color: 'white' }}>
                <th style={{ padding: '12px' }}>Order ID</th>
                <th style={{ padding: '12px' }}>Customer</th>
                <th style={{ padding: '12px' }}>Items</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>#{order._id.substring(0, 6).toUpperCase()}</td>
                  <td style={{ padding: '12px' }}>{order.name}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{order.cartItems.length}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>₹{order.totalAmount.toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: 'white',
                          background: order.status === 'Delivered' ? '#28a745' : order.status === 'Cancelled' ? '#dc3545' : order.status === 'Shipped' ? '#17a2b8' : '#ffc107' 
                      }}>
                          {order.status}
                      </span>
                  </td>
                  <td style={{ padding: '12px', display:'flex', justifyContent:'center', gap:'10px'}}>
                    <select 
                        onChange={(e) => updateStatus(order._id, e.target.value)} 
                        value={order.status} 
                        style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ced4da' }}
                    >
                      <option value="Ordered">Ordered</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      {/* 🔥 CANCELLED OPTION REMOVED 🔥 */}
                    </select>
                    <button onClick={() => setSelectedOrder(order)} style={{background: '#007bff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'}}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ORDER DETAILS POPUP */}
      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
                <button onClick={() => setSelectedOrder(null)} style={{position: 'absolute', top: '15px', right: '15px', background: 'transparent', color: '#666', border: 'none', fontSize: '24px', cursor: 'pointer'}}>&times;</button>
                <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '15px'}}>Order Details</h2>
                
                <div style={{fontSize: '14px', lineHeight: '1.6'}}>
                    <p><strong>Order ID:</strong> #{selectedOrder._id.toUpperCase()}</p>
                    <p><strong>Customer:</strong> {selectedOrder.name}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                    <p><strong>Address:</strong> {selectedOrder.address}</p>
                    <p><strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
                    <p><strong>Payment:</strong> {selectedOrder.paymentMethod} {selectedOrder.transactionId && `(ID: ${selectedOrder.transactionId})`}</p>
                </div>

                <h3 style={{marginTop: '20px', background: '#f8f9fa', padding: '10px'}}>Items</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px'}}>
                    {selectedOrder.cartItems.map((item, index) => (
                        <div key={index} style={{display: 'flex', gap: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                            <img src={(item.images && item.images[0]) || "https://placehold.co/70"} alt={item.name} style={{width: '50px', height: '50px', objectFit: 'cover'}} />
                            <div style={{flex: 1}}>
                                <p style={{fontWeight: 'bold', margin: 0}}>{item.name}</p>
                                <p style={{margin: 0, fontSize: '13px'}}>Size: {item.size} | Qty: {item.quantity}</p>
                            </div>
                            <p style={{fontWeight: 'bold'}}>₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                <div style={{marginTop: '20px', textAlign: 'right', paddingTop: '15px', borderTop: '2px solid #eee'}}>
                    <h3>Total: <span style={{color: '#28a745'}}>₹{selectedOrder.totalAmount.toLocaleString()}</span></h3>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
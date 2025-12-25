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

  // ✅ STATE UPDATE: Added 'mrp'
  const [newProduct, setNewProduct] = useState({
    name: '', 
    price: '', // Selling Price
    mrp: '',   // MRP (Original Price)
    size: '', material: '', warranty: '', 
    images: '', description: '', category: '' 
  });

  const [loading, setLoading] = useState(false);
  
  // 🔥 URL LOGIC
  const API_URL = window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://methakadai.onrender.com";

  useEffect(() => {
    console.log("Connected to Backend at:", API_URL);
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      setOrders(Array.isArray(res.data) ? res.data : []);
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

  // Delete Category
  const deleteCategory = async (categoryName) => {
    if (categoryName === "General") {
        return toast.error("You cannot delete the 'General' category.");
    }
    if (!window.confirm(`Are you sure you want to delete '${categoryName}'?\n\nAll products in this category will be moved to 'General'.`)) {
        return;
    }
    try {
        await axios.put(`${API_URL}/api/categories/delete`, { categoryName });
        toast.success(`Category '${categoryName}' deleted!`);
        fetchProducts(); 
    } catch (error) {
        toast.error("Failed to delete category.");
    }
  };

  const deleteProduct = async (id) => {
    if(!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`);
      toast.success("Product deleted successfully");
      fetchProducts(); 
    } catch (err) { 
        toast.error("Failed to delete product"); 
    }
  };

  // ✅ EDIT LOGIC: Include MRP
  const handleEdit = (product) => {
    setEditId(product._id); 
    const imagesString = product.images ? product.images.join(', ') : '';
    setNewProduct({
        name: product.name,
        price: product.price,
        mrp: product.mrp || '', // Load MRP if it exists
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

  // ✅ SUBMIT HANDLER: Send MRP & Validate
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const imageArray = newProduct.images.split(',').map(url => url.trim()).filter(url => url !== ""); 

    // Simple Validation: MRP shouldn't be less than Selling Price
    if (Number(newProduct.mrp) > 0 && Number(newProduct.mrp) < Number(newProduct.price)) {
        toast.error("MRP cannot be less than Selling Price!");
        setLoading(false);
        return;
    }

    const productToSend = { 
        ...newProduct, 
        price: Number(newProduct.price), 
        mrp: Number(newProduct.mrp) || Number(newProduct.price), // Default MRP to Price if empty
        images: imageArray,
        category: newProduct.category || "General" 
    }; 

    console.log("Attempting to submit to:", `${API_URL}/api/products`);

    try {
        if (editId) {
            await axios.put(`${API_URL}/api/products/${editId}`, productToSend);
            toast.success('Product updated successfully');
            setEditId(null);
        } else {
            await axios.post(`${API_URL}/api/products`, productToSend);
            toast.success('Product added successfully');
        }
        setNewProduct({ name: '', price: '', mrp: '', size: '', material: '', warranty: '', images: '', description: '', category: '' });
        fetchProducts();
    } catch (error) {
        console.error("Backend Error:", error);
        toast.error(error.response?.data?.message || 'Connection Failed!');
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/orders/${id}/status`, { status });
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (err) { toast.error("Failed to update status"); }
  };

  return (
    <div className="admin-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <h1>Admin Dashboard</h1>
      <p style={{fontSize:'10px', color:'#888', textAlign:'right'}}>Connected to: {API_URL}</p>

      {/* --- SECTION 1: ADD / EDIT PRODUCT --- */}
      <div className="add-product-section" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '40px', border: editId ? '2px solid #ffc107' : '1px solid #ddd' }}>
        
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2>{editId ? "Edit Product" : "Add New Product"}</h2>
            {editId && <button onClick={cancelEdit} style={{background: '#6c757d', color: 'white', border: 'none', padding: '5px 15px', cursor: 'pointer', borderRadius: '5px'}}>Cancel</button>}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          {/* CATEGORY UI */}
          <div style={{gridColumn: 'span 2', background: '#e9ecef', padding: '10px', borderRadius: '5px', border: '1px dashed #ced4da'}}>
             <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057'}}>Product Category:</label>
             <div style={{display: 'flex', gap: '10px'}}>
                 <select 
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    value="" 
                    style={{padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', flex: 1}}
                 >
                     <option value="" disabled>-- Select Existing --</option>
                     {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </select>

                 <input 
                    name="category" 
                    placeholder="Type Category Name (e.g. Pillows)" 
                    value={newProduct.category} 
                    onChange={handleChange} 
                    required 
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', flex: 1.5, fontWeight: 'bold' }} 
                 />
             </div>
             <small style={{color: '#666', marginTop:'5px', display:'block'}}>Selected Category: <strong>{newProduct.category || "None"}</strong></small>
          </div>

          <input name="name" placeholder="Product Name" value={newProduct.name} onChange={handleChange} required style={{ padding: '10px' }} />
          
          {/* 🔥 PRICE INPUTS: MRP & Selling Price 🔥 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
                <label style={{fontSize: '12px', fontWeight: 'bold', color:'#555'}}>MRP (Original)</label>
                <input name="mrp" type="number" placeholder="MRP (₹)" value={newProduct.mrp} onChange={handleChange} required style={{ padding: '10px', width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{fontSize: '12px', fontWeight: 'bold', color:'#555'}}>Selling Price</label>
                <input name="price" type="number" placeholder="Price (₹)" value={newProduct.price} onChange={handleChange} required style={{ padding: '10px', width: '100%' }} />
            </div>
          </div>

          <input name="size" placeholder="Size (e.g., Queen 6x5)" value={newProduct.size} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="material" placeholder="Material (e.g., Memory Foam)" value={newProduct.material} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="warranty" placeholder="Warranty Duration" value={newProduct.warranty} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="images" placeholder="Image URLs (Comma separated)" value={newProduct.images} onChange={handleChange} required style={{ padding: '10px' }} />
          <textarea name="description" placeholder="Product Description" value={newProduct.description} onChange={handleChange} style={{ gridColumn: 'span 2', padding: '10px', height: '80px' }} />
          
          <button type="submit" disabled={loading} style={{ gridColumn: 'span 2', padding: '15px', background: editId ? '#ffc107' : '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', borderRadius: '5px' }}>
            {loading ? "Processing..." : (editId ? "Update Product" : "Add Product")}
          </button>
        </form>
      </div>

      {/* --- SECTION 2: MANAGE CATEGORIES --- */}
      <div className="category-manager" style={{ marginBottom: '30px', background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #ddd' }}>
        <h2>Manage Categories</h2>
        <p style={{fontSize: '13px', color: '#666', marginBottom: '15px'}}>Deleting a category will move its products to "General".</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {existingCategories.map(cat => (
                <div key={cat} style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    background: cat === 'General' ? '#e9ecef' : '#e3f2fd', 
                    padding: '8px 15px', borderRadius: '20px', border: '1px solid #ced4da' 
                }}>
                    <span style={{fontWeight: 'bold', color: '#333'}}>{cat}</span>
                    {cat !== "General" && (
                        <button 
                            onClick={() => deleteCategory(cat)}
                            style={{ 
                                background: '#ff4d4d', color: 'white', border: 'none', 
                                width: '20px', height: '20px', borderRadius: '50%', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                                marginLeft: '5px'
                            }}
                            title="Delete Category"
                        >
                            ✕
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* --- SECTION 3: PRODUCT LIST --- */}
      <div className="product-list" style={{ marginBottom: '40px' }}>
        <h2>Available Products ({products.length})</h2>
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '10px' }}>
          
          {Array.isArray(products) && products.length > 0 ? (
            products.map(p => (
                <div key={p._id} style={{ border: '1px solid #ddd', padding: '15px', minWidth: '220px', borderRadius: '8px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <span style={{background: '#6c757d', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '10px', textTransform: 'uppercase'}}>{p.category || "General"}</span>

                <img 
                    src={(p.images && p.images.length > 0) ? p.images[0] : (p.image || "https://placehold.co/400")}
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400"; }}
                    alt={p.name} 
                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px', marginTop: '5px' }} 
                />
                <p style={{fontSize: '16px', margin: '10px 0 5px'}}><strong>{p.name}</strong></p>
                
                {/* 🔥 DISPLAY BOTH PRICES 🔥 */}
                <div style={{marginBottom: '10px'}}>
                    {/* Show MRP crossed out if it's different/higher than price */}
                    {p.mrp && p.mrp > p.price && (
                        <span style={{textDecoration:'line-through', color:'#888', fontSize:'13px', marginRight:'5px'}}>
                            ₹{p.mrp.toLocaleString()}
                        </span>
                    )}
                    <span style={{color: '#000', fontWeight:'bold'}}>₹{p.price.toLocaleString()}</span>
                </div>
                
                <div style={{display: 'flex', gap: '10px'}}>
                    <button onClick={() => handleEdit(p)} style={{ flex: 1, padding: '8px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                    <button onClick={() => deleteProduct(p._id)} style={{ flex: 1, padding: '8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                </div>
                </div>
            ))
          ) : (
            <p>No products available.</p>
          )}

        </div>
      </div>
      
      {/* --- SECTION 4: ORDERS --- */}
      <div className="orders-section">
        <h2>Recent Orders</h2>
        
        {!Array.isArray(orders) || orders.length === 0 ? (
            <p style={{color: '#666', fontStyle: 'italic'}}>No orders found.</p>
        ) : (
          <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#343a40', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Order ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Items</th>
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
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'white',
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
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    
                    <button 
                        onClick={() => setSelectedOrder(order)} 
                        style={{background: '#007bff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'}}
                    >
                        View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* --- MODAL POPUP --- */}
      {selectedOrder && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px', 
                maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <button 
                    onClick={() => setSelectedOrder(null)} 
                    style={{position: 'absolute', top: '15px', right: '15px', background: 'transparent', color: '#666', border: 'none', fontSize: '24px', cursor: 'pointer'}}
                >
                    &times;
                </button>
                
                <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '15px', margin: '0 0 15px'}}>Order Details</h2>
                
                <div style={{fontSize: '14px', lineHeight: '1.6'}}>
                    <p><strong>Order ID:</strong> #{selectedOrder._id.toUpperCase()}</p>
                    <p><strong>Customer Name:</strong> {selectedOrder.name}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                    <p><strong>Address:</strong> {selectedOrder.address}</p>
                    <p><strong>Ordered Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
                    <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod} {selectedOrder.transactionId && `(ID: ${selectedOrder.transactionId})`}</p>
                </div>

                <h3 style={{marginTop: '20px', background: '#f8f9fa', padding: '10px', fontSize: '16px', borderLeft: '4px solid #007bff'}}>Purchased Items</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
                    {selectedOrder.cartItems.map((item, index) => (
                        <div key={index} style={{display: 'flex', gap: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                            <img 
                                src={(item.images && item.images.length > 0) ? item.images[0] : (item.image || "https://placehold.co/70")} 
                                alt={item.name} 
                                style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee'}}
                            />
                            <div style={{flex: 1}}>
                                <p style={{fontWeight: 'bold', margin: '0 0 5px'}}>{item.name}</p>
                                <p style={{margin: 0, fontSize: '13px', color: '#666'}}>
                                    Size: {item.size} | Qty: {item.quantity}
                                </p>
                            </div>
                            <div style={{textAlign: 'right'}}>
                                <p style={{margin: 0, fontWeight: 'bold'}}>₹{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{marginTop: '20px', textAlign: 'right', borderTop: '2px solid #eee', paddingTop: '15px'}}>
                    <h3 style={{margin: 0}}>Total: <span style={{color: '#28a745'}}>₹{selectedOrder.totalAmount.toLocaleString()}</span></h3>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
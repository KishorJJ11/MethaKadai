import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/AdminOrders.css'; // Idhukku styling venum na create pannikkalam

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); // Products list
  
  // Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    size: '',
    material: '',
    warranty: '',
    image: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);

  // API URL (Auto detect: Local or Vercel)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Handle Input Change
  const handleChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };


  // Delete Product Function
  const deleteProduct = async (id) => {
    if(!window.confirm("Unmaiyave indha product-a delete pannidava? 🗑️")) return;

    try {
      await axios.delete(`${API_URL}/api/products/${id}`);
      alert("Product Deleted! 💥");
      fetchProducts(); // List-a refresh pannu
    } catch (err) {
      console.error(err);
      alert("Delete panna mudiyala mapla!");
    }
  };

  // Handle Form Submit (Add Product)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 👇 Comma va vechu pirichu Array aakkurathu
    const imageArray = newProduct.images.split(',').map(url => url.trim()); 

    const productToSend = { ...newProduct, images: imageArray }; // Array va anuppurom

    try {
        await axios.post(`${API_URL}/api/products`, productToSend);
        alert('Product Added! 🔥');
        setNewProduct({ name: '', price: '', size: '', material: '', warranty: '', images: '', description: '' });
        fetchProducts();
        } catch (error) {
            console.error(error);
            alert('Failed to add');
        }
        setLoading(false);
    };

  // Order Status Update
  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/orders/${id}/status`, { status });
      fetchOrders();
    } catch (err) {
      alert("Status update failed");
    }
  };

  return (
    <div className="admin-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>👑 Admin Dashboard</h1>

      {/* --- SECTION 1: ADD NEW PRODUCT --- */}
      <div className="add-product-section" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '40px', border: '1px solid #ddd' }}>
        <h2>➕ Add New Product (Puthu Sarakku)</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <input name="name" placeholder="Product Name (Ex: Luxury Metha)" value={newProduct.name} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="price" type="number" placeholder="Price (Ex: 5000)" value={newProduct.price} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="size" placeholder="Size (Ex: King Size)" value={newProduct.size} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="material" placeholder="Material (Ex: Cotton, Foam)" value={newProduct.material} onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="warranty" placeholder="Warranty (Ex: 5 Years)" value={newProduct.warranty} onChange={handleChange} required style={{ padding: '10px' }} />
          <input 
                name="images" 
                placeholder="Image URLs (Comma , pottu pirichu podu)" 
                value={newProduct.images} 
                onChange={handleChange} 
                required 
                style={{ padding: '10px' }} 
            />
            <small style={{gridColumn: 'span 2', color: '#666'}}>
                Tip: To add more than one images (,) use comma at the end of the previous image URL. Ex: link1.jpg, link2.jpg
            </small>
          <textarea name="description" placeholder="Description" value={newProduct.description} onChange={handleChange} style={{ gridColumn: 'span 2', padding: '10px', height: '80px' }} />
          
          <button type="submit" disabled={loading} style={{ gridColumn: 'span 2', padding: '15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
            {loading ? "Adding..." : "🚀 Add Product Now"}
          </button>
        </form>
      </div>

      {/* --- SECTION 2: PRODUCT LIST (Verify) --- */}
      <div className="product-list" style={{ marginBottom: '40px' }}>
        <h2>📦 Available Products ({products.length})</h2>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px' }}>
          {products.map(p => (
            <div key={p._id} style={{ border: '1px solid #ddd', padding: '10px', minWidth: '200px', borderRadius: '5px' }}>
              <img 
                src={p.images && p.images.length > 0 ? p.images[0] : "https://via.placeholder.com/150"} 
                alt={p.name} 
                style={{ width: '100%', height: '120px', objectFit: 'cover' }} 
              />
              <p><strong>{p.name}</strong></p>
              <p>₹{p.price}</p>
              <button 
                    onClick={() => deleteProduct(p._id)} 
                    style={{ 
                        marginTop: '10px', 
                        width: '100%', 
                        padding: '8px', 
                        backgroundColor: '#ff4d4d', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Delete 🗑️
                </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- SECTION 3: ORDERS --- */}
      <div className="orders-section">
        <h2>🚚 Recent Orders</h2>
        {orders.length === 0 ? <p>Innum orders varala mapla...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#333', color: 'white' }}>
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
                  <td>{order.name}<br/><small>{order.phone}</small></td>
                  <td>{order.cartItems.length} Items</td>
                  <td>₹{order.totalAmount}</td>
                  <td style={{ fontWeight: 'bold', color: order.status === 'Delivered' ? 'green' : 'orange' }}>{order.status}</td>
                  <td>
                    <select onChange={(e) => updateStatus(order._id, e.target.value)} value={order.status} style={{ padding: '5px' }}>
                      <option value="Ordered">Ordered</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
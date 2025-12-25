import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import '../Styles/ProductDetails.css';

const ProductDetails = ({ addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(""); 
  const [error, setError] = useState(false);
  
  const API_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://methakadai.onrender.com";

  useEffect(() => {
    axios.get(`${API_URL}/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        if(res.data.images && res.data.images.length > 0) setMainImage(res.data.images[0]); 
        else if (res.data.image) setMainImage(res.data.image); 
        else setMainImage("https://placehold.co/400"); 
      })
      .catch(err => { setError(true); });
  }, [id]);

  if (error) return <div style={{textAlign:'center', marginTop:'80px'}}><h2>Product Not Found</h2><button onClick={() => navigate('/')}>Back Home</button></div>;
  if (!product) return <div style={{textAlign:'center', marginTop:'80px'}}>Loading...</div>;

  // --- 🔥 PRICE LOGIC (Thelivaana Calculation) 🔥 ---
  const sellingPrice = Number(product.price);
  // Old products la MRP illana, Price eh eduthuko.
  const mrp = (product.mrp && Number(product.mrp) > sellingPrice) ? Number(product.mrp) : sellingPrice;
  
  const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const savings = mrp - sellingPrice;

  return (
    <div className="product-details-container" style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
      <Toaster />
      
      <div className="image-section" style={{ flex: '1', minWidth: '350px' }}>
        <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
            <img src={mainImage} alt={product.name} onError={(e) => { e.target.src = "https://placehold.co/400"; }} style={{ width: '100%', height: '450px', objectFit: 'cover' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {product.images?.map((img, index) => (
                <img key={index} src={img} onClick={() => setMainImage(img)} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: mainImage === img ? '2px solid black' : '1px solid #ddd' }} />
            ))}
        </div>
      </div>

      <div className="details-section" style={{ flex: '1', minWidth: '350px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{product.name}</h1>
        
        {/* 🔥 PRICE DISPLAY SECTION 🔥 */}
        <div className="price-container" style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {mrp > sellingPrice && (
                <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '1.3rem' }}>₹{mrp.toLocaleString()}</span>
            )}
            <span style={{ fontSize: '2rem', color: '#000', fontWeight: 'bold' }}>₹{sellingPrice.toLocaleString()}</span>
            {discount > 0 && (
                <span style={{ background: '#e5f9e8', color: '#2ecc71', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>{discount}% OFF</span>
            )}
        </div>

        {/* You Save */}
        {savings > 0 && <div style={{ marginBottom: '20px', color: '#27ae60', fontSize: '1rem', fontWeight: '600' }}>You save: ₹{savings.toLocaleString()}!</div>}
        
        <div style={{ margin: '20px 0', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <p><strong>Size:</strong> {product.size}</p>
            <p><strong>Material:</strong> {product.material}</p>
            <p><strong>Warranty:</strong> {product.warranty}</p>
            <p style={{ marginTop: '15px' }}>{product.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button onClick={() => addToCart(product)} style={{ flex: 2, padding: '15px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>ADD TO CART</button>
            <button onClick={() => toast.success("Added to Wishlist")} style={{ flex: 1, padding: '15px', background: 'white', border: '1px solid black', cursor: 'pointer', fontWeight: 'bold' }}>WISHLIST</button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
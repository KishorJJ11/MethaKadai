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
  
  // 🔥 SMART URL LOGIC
  const API_URL = window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://methakadai.onrender.com";

  useEffect(() => {
    axios.get(`${API_URL}/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        
        // Handle Main Image Logic
        if(res.data.images && res.data.images.length > 0) {
            setMainImage(res.data.images[0]); 
        } else if (res.data.image) {
            setMainImage(res.data.image); 
        } else {
            setMainImage("https://placehold.co/400"); 
        }
      })
      .catch(err => {
        console.error("Error fetching product details:", err);
        setError(true);
      });
  }, [id]);

  if (error) return (
      <div style={{textAlign:'center', marginTop:'80px', color: '#555'}}>
          <h2 style={{fontSize: '2rem', marginBottom: '10px'}}>Product Not Found</h2>
          <button onClick={() => navigate('/')} style={{background: 'black', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Back to Home</button>
      </div>
  );

  if (!product) return <div style={{textAlign:'center', marginTop:'80px', fontSize: '1.2rem', color: '#666'}}>Loading...</div>;

  // --- 🔥 PRICE & SAVINGS CALCULATION 🔥 ---
  const sellingPrice = Number(product.price);
  // MRP DB la irundha edu, illana Selling Price eh MRP ah vechikko
  const mrp = product.mrp ? Number(product.mrp) : sellingPrice; 
  
  // Calculate Discount %
  const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  
  // Calculate Savings Amount (Evlo rooba micham)
  const savings = mrp - sellingPrice;

  return (
    <div className="product-details-container" style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
      <Toaster />
      
      {/* --- LEFT: IMAGES --- */}
      <div className="image-section" style={{ flex: '1', minWidth: '350px' }}>
        <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
            <img src={mainImage} alt={product.name} onError={(e) => { e.target.src = "https://placehold.co/400"; }} style={{ width: '100%', height: '450px', objectFit: 'cover' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            {product.images?.map((img, index) => (
                <img key={index} src={img} onClick={() => setMainImage(img)} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: mainImage === img ? '2px solid black' : '1px solid #e0e0e0', opacity: mainImage === img ? 1 : 0.7 }} />
            ))}
        </div>
      </div>

      {/* --- RIGHT: DETAILS --- */}
      <div className="details-section" style={{ flex: '1', minWidth: '350px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{product.name}</h1>
        
        {/* 🔥 PRICE DISPLAY SECTION 🔥 */}
        <div className="price-container" style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Show MRP (Crossed) only if it is greater than Selling Price */}
            {mrp > sellingPrice && (
                <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '1.3rem' }}>
                    ₹{mrp.toLocaleString()}
                </span>
            )}

            {/* Selling Price */}
            <span style={{ fontSize: '2rem', color: '#000', fontWeight: 'bold' }}>
                ₹{sellingPrice.toLocaleString()}
            </span>

            {/* Discount Badge */}
            {discount > 0 && (
                <span style={{ background: '#e5f9e8', color: '#2ecc71', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {discount}% OFF
                </span>
            )}
        </div>

        {/* 🔥 YOU SAVE SECTION (Pudhu Addition) 🔥 */}
        {savings > 0 && (
            <div style={{ marginBottom: '20px', color: '#27ae60', fontSize: '1rem', fontWeight: '600' }}>
                You save: ₹{savings.toLocaleString()}!
            </div>
        )}
        
        <div style={{ margin: '20px 0', lineHeight: '1.8', color: '#555', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '20px 0' }}>
            <p><strong>Size:</strong> {product.size}</p>
            <p><strong>Material:</strong> {product.material}</p>
            <p><strong>Warranty:</strong> {product.warranty}</p>
            <p style={{ marginTop: '15px' }}>{product.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button onClick={() => addToCart(product)} style={{ flex: 2, padding: '15px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1rem', borderRadius: '4px', fontWeight: 'bold' }}>ADD TO CART</button>
            <button onClick={() => toast.success("Added to Wishlist")} style={{ flex: 1, padding: '15px', background: 'white', color: 'black', border: '1px solid black', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>WISHLIST</button>
        </div>
        
        <div style={{marginTop: '20px', fontSize: '0.9rem', color: '#777'}}>
            <p>✓ Free Delivery available</p>
            <p>✓ 7 Days Return Policy</p>
            <p>✓ Cash on Delivery available</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
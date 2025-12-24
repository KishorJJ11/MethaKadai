import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import '../Styles/ProductDetails.css';

const ProductDetails = ({ addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(""); 
  const [error, setError] = useState(false);
  
  // Smart API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    axios.get(`${API_URL}/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        
        // Handle Main Image Logic
        if(res.data.images && res.data.images.length > 0) {
            setMainImage(res.data.images[0]); 
        } else if (res.data.image) {
            setMainImage(res.data.image); // Fallback for legacy data
        } else {
            setMainImage("https://placehold.co/400"); 
        }
      })
      .catch(err => {
        console.error("Error fetching product details:", err);
        setError(true);
      });
  }, [id, API_URL]);

  if (error) return (
      <div style={{textAlign:'center', marginTop:'80px', color: '#555'}}>
          <h2 style={{fontSize: '2rem', marginBottom: '10px'}}>Product Not Found</h2>
          <p style={{marginBottom: '20px'}}>This product may have been removed or is currently unavailable.</p>
          <button 
            onClick={() => navigate('/')} 
            style={{background: 'black', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          >
            Back to Home
          </button>
      </div>
  );

  if (!product) return (
    <div style={{textAlign:'center', marginTop:'80px', fontSize: '1.2rem', color: '#666'}}>
        Loading product details...
    </div>
  );

  return (
    <div className="product-details-container" style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
      <Toaster />
      
      {/* --- LEFT SIDE: IMAGE GALLERY --- */}
      <div className="image-section" style={{ flex: '1', minWidth: '350px' }}>
        
        {/* Main Image */}
        <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
            <img 
                src={mainImage} 
                alt={product.name} 
                onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = "https://placehold.co/400"; 
                }}
                style={{ width: '100%', height: '450px', objectFit: 'cover' }} 
            />
        </div>

        {/* Thumbnails */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            {product.images && product.images.length > 0 ? (
                product.images.map((img, index) => (
                    <img 
                        key={index} 
                        src={img} 
                        alt={`thumbnail-${index}`} 
                        onClick={() => setMainImage(img)} 
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/70"; }}
                        style={{ 
                            width: '80px', 
                            height: '80px', 
                            objectFit: 'cover', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            border: mainImage === img ? '2px solid black' : '1px solid #e0e0e0',
                            opacity: mainImage === img ? 1 : 0.7,
                            transition: 'all 0.2s'
                        }} 
                        onMouseOver={(e) => e.target.style.opacity = 1}
                        onMouseOut={(e) => e.target.style.opacity = mainImage === img ? 1 : 0.7}
                    />
                ))
            ) : (
                <img src={mainImage} alt="thumbnail" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e0e0e0' }} />
            )}
        </div>
      </div>

      {/* --- RIGHT SIDE: DETAILS --- */}
      <div className="details-section" style={{ flex: '1', minWidth: '350px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '15px', lineHeight: '1.2' }}>{product.name}</h1>
        <p style={{ fontSize: '1.8rem', color: '#333', fontWeight: 'bold', marginBottom: '20px' }}>₹{product.price.toLocaleString()}</p>
        
        <div style={{ margin: '20px 0', lineHeight: '1.8', color: '#555', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '20px 0' }}>
            <p><strong>Size:</strong> {product.size}</p>
            <p><strong>Material:</strong> {product.material}</p>
            <p><strong>Warranty:</strong> {product.warranty}</p>
            <p style={{ marginTop: '15px' }}>{product.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button 
                onClick={() => addToCart(product)} 
                style={{ 
                    flex: 2,
                    padding: '15px', 
                    background: 'black', 
                    color: 'white', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '1rem', 
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                Add to Cart
            </button>
            <button 
                style={{ 
                    flex: 1,
                    padding: '15px', 
                    background: 'white', 
                    color: 'black',
                    border: '1px solid black', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}
                onClick={() => toast.success("Added to Wishlist")}
            >
                Wishlist
            </button>
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
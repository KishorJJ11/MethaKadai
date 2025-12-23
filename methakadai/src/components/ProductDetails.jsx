import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import '../Styles/ProductDetails.css';

const ProductDetails = ({ addToCart }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(""); 
  const [error, setError] = useState(false);
  
  // API URL logic
  const API_URL = import.meta.env.VITE_API_URL || 'https://methakadai.onrender.com';

  useEffect(() => {
    axios.get(`${API_URL}/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        // Data vandha udane, Mudhal photo-va main image ah set panrom
        if(res.data.images && res.data.images.length > 0) {
            setMainImage(res.data.images[0]); 
        } else if (res.data.image) {
            setMainImage(res.data.image); // Pazhaya data support
        } else {
            // 👇 CHANGE 1: URL Maathiyachu
            setMainImage("https://placehold.co/400"); 
        }
      })
      .catch(err => 
        {console.error(err);
      setError(true);
      });
}, [id]);

  // Loading ku mela idhai podu
  if (error) return (
      <div style={{textAlign:'center', marginTop:'50px'}}>
          <h2>Ayyo! Indha Sarakku Ippo Illa! 😕</h2>
          <p>Product delete aagirukkalam allathu stock illama poyirukkalam.</p>
          <a href="/" style={{color: 'blue'}}>🏠 Go Home</a>
      </div>
  );

  if (!product) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading Sarakku... 🔄</div>;

  return (
    <div className="product-details-container" style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
      <Toaster />
      
      {/* --- LEFT SIDE: IMAGE GALLERY 🖼️ --- */}
      <div className="image-section" style={{ flex: '1', minWidth: '300px' }}>
        
        {/* Main Image (Perusa theriyum) */}
        <div style={{ border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
            <img 
                src={mainImage} 
                alt={product.name} 
                // 👇 CHANGE 2: Loop Stop logic + Puthu URL
                onError={(e) => { 
                    e.target.onerror = null; // 🛑 STOP LOOP
                    e.target.src = "https://placehold.co/400"; // Backup Image
                }}
                style={{ width: '100%', height: '400px', objectFit: 'cover' }} 
            />
        </div>

        {/* Small Images (Keela chinna box la varum) */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {product.images && product.images.length > 0 ? (
                product.images.map((img, index) => (
                    <img 
                        key={index} 
                        src={img} 
                        alt={`thumb-${index}`} 
                        onClick={() => setMainImage(img)} // Click panna Main Image maarum
                        // 👇 CHANGE 3: Thumbnails kum safety add pannidalam
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/70"; }}
                        style={{ 
                            width: '70px', 
                            height: '70px', 
                            objectFit: 'cover', 
                            borderRadius: '5px', 
                            cursor: 'pointer',
                            border: mainImage === img ? '2px solid green' : '1px solid #ccc' 
                        }} 
                    />
                ))
            ) : (
                // Images illana oru dummy thumbnail kaattu
                <img src={mainImage} alt="thumb" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #ccc' }} />
            )}
        </div>
      </div>

      {/* --- RIGHT SIDE: DETAILS 📝 --- */}
      <div className="details-section" style={{ flex: '1', minWidth: '300px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{product.name}</h1>
        <p style={{ fontSize: '1.5rem', color: '#28a745', fontWeight: 'bold' }}>₹{product.price.toLocaleString()}</p>
        
        <div style={{ margin: '20px 0', lineHeight: '1.6', color: '#555' }}>
            <p><strong>Size:</strong> {product.size}</p>
            <p><strong>Material:</strong> {product.material}</p>
            <p><strong>Warranty:</strong> {product.warranty}</p>
            <p style={{ marginTop: '10px' }}>{product.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
            <button 
                onClick={() => addToCart(product)} 
                style={{ padding: '15px 30px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.1rem', borderRadius: '5px' }}>
                Add to Cart 🛒
            </button>
            <button style={{ padding: '15px', background: 'white', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer', fontSize: '1.2rem' }}>❤️</button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
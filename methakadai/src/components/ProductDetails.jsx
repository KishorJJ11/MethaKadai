import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

const ProductDetails = ({ addToCart }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(""); // 👈 Periya Image State

  useEffect(() => {
    axios.get(`https://methakadai.onrender.com/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        if(res.data.images && res.data.images.length > 0) {
            setMainImage(res.data.images[0]); // First image ah default ah vei
        }
      })
      .catch(err => console.error(err));
  }, [id]);

  if (!product) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading Sarakku... 🔄</div>;

  return (
    <div className="product-details-container" style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
      <Toaster />
      
      {/* --- LEFT SIDE: IMAGE GALLERY 🖼️ --- */}
      <div className="image-section" style={{ flex: '1', minWidth: '300px' }}>
        
        {/* Main Image */}
        <div style={{ border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
            <img src={mainImage} alt={product.name} style={{ width: '100%', height: '400px', objectFit: 'cover' }} />
        </div>

        {/* Thumbnails (Chitti Images) */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {product.images && product.images.map((img, index) => (
                <img 
                    key={index} 
                    src={img} 
                    alt={`thumb-${index}`} 
                    onClick={() => setMainImage(img)} // Click panna Main Image maarum
                    style={{ 
                        width: '70px', 
                        height: '70px', 
                        objectFit: 'cover', 
                        borderRadius: '5px', 
                        cursor: 'pointer',
                        border: mainImage === img ? '2px solid green' : '1px solid #ccc' 
                    }} 
                />
            ))}
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
            <button style={{ padding: '15px', background: 'white', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}>❤️</button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
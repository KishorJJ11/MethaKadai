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
  
  // Selected Thickness State (Initially null or first option if available)
  const [selectedThickness, setSelectedThickness] = useState(null);

  const API_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://methakadai.onrender.com";

  useEffect(() => {
    axios.get(`${API_URL}/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        if(res.data.images && res.data.images.length > 0) setMainImage(res.data.images[0]); 
        else if (res.data.image) setMainImage(res.data.image); 
        else setMainImage("https://placehold.co/400");

        // 🔥 Auto-select first thickness if available
        if (res.data.thickness && res.data.thickness.length > 0) {
            setSelectedThickness(res.data.thickness[0]);
        }
      })
      .catch(err => { setError(true); });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check if thickness is required but not selected (Safety check)
    if (product.thickness && product.thickness.length > 0 && !selectedThickness) {
        toast.error("Please select a thickness");
        return;
    }

    const productWithThickness = {
        ...product,
        selectedThickness: selectedThickness // Sending chosen thickness to cart
    };
    addToCart(productWithThickness);
  };

  if (error) return <div style={{textAlign:'center', marginTop:'80px'}}><h2>Product Not Found</h2><button onClick={() => navigate('/')}>Back Home</button></div>;
  if (!product) return <div style={{textAlign:'center', marginTop:'80px'}}>Loading...</div>;

  const sellingPrice = Number(product.price);
  const mrp = (product.mrp && Number(product.mrp) > sellingPrice) ? Number(product.mrp) : sellingPrice;
  const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const savings = mrp - sellingPrice;

  // 🔥 Get Thickness Options from DB
  const thicknessOptions = Array.isArray(product.thickness) ? product.thickness : [];

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
        
        <div className="price-container" style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {mrp > sellingPrice && <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '1.3rem' }}>₹{mrp.toLocaleString()}</span>}
            <span style={{ fontSize: '2rem', color: '#000', fontWeight: 'bold' }}>₹{sellingPrice.toLocaleString()}</span>
            {discount > 0 && <span style={{ background: '#e5f9e8', color: '#2ecc71', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>{discount}% OFF</span>}
        </div>

        {savings > 0 && <div style={{ marginBottom: '20px', color: '#27ae60', fontSize: '1rem', fontWeight: '600' }}>You save: ₹{savings.toLocaleString()}!</div>}
        
        {/* 🔥 DYNAMIC THICKNESS SELECTOR 🔥 */}
        {thicknessOptions.length > 0 && (
            <div style={{ marginBottom: '25px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '1rem', color:'#333' }}>Select Thickness:</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {thicknessOptions.map((opt) => (
                        <button 
                            key={opt}
                            onClick={() => setSelectedThickness(opt)}
                            style={{
                                padding: '10px 18px',
                                border: selectedThickness === opt ? '2px solid black' : '1px solid #ccc',
                                background: selectedThickness === opt ? 'black' : 'white',
                                color: selectedThickness === opt ? 'white' : 'black',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div style={{ margin: '20px 0', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <p><strong>Size:</strong> {product.size}</p>
            <p><strong>Material:</strong> {product.material}</p>
            <p><strong>Warranty:</strong> {product.warranty}</p>
            <p style={{ marginTop: '15px' }}>{product.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button onClick={handleAddToCart} style={{ flex: 2, padding: '15px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1rem', borderRadius: '4px', fontWeight: 'bold' }}>ADD TO CART</button>
            <button onClick={() => toast.success("Added to Wishlist")} style={{ flex: 1, padding: '15px', background: 'white', border: '1px solid black', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>WISHLIST</button>
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
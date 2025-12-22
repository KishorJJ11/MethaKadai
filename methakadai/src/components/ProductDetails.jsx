import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ID edukka useParams
import axios from 'axios';
import '../Styles/ProductDetails.css';

function ProductDetails({ addToCart }) {
  const { id } = useParams(); // URL la irunthu ID edukkurom
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Backend kitta irunthu antha oru product data va vangurathu
    axios.get(`https://methakadai.onrender.com/api/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(err => console.error("Error:", err));
  }, [id]);

  if (!product) return <div className="loading">Loading... ⏳</div>;

  return (
    <div className="details-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Pinnadi Po</button>
      
      <div className="details-content">
        {/* Left Side: Image */}
        <div className="details-image">
            <img src={product.image} alt={product.name} />
        </div>

        {/* Right Side: Info */}
        <div className="details-info">
            <h1>{product.name}</h1>
            <p className="details-price">₹{product.price.toLocaleString()}</p>
            
            <div className="specs">
                <p><strong>Size:</strong> {product.size}</p>
                <p><strong>Material:</strong> {product.material}</p>
                <p><strong>Warranty:</strong> {product.warranty}</p>
            </div>

            <p className="description">
                <strong>Description:</strong><br/>
                {product.description || "Idhu romba nalla methai. Nalla thookam varum. Ippove vaangunga!"}
            </p>

            <div className="details-buttons">
                <button className="cart-btn-large" onClick={() => addToCart(product)}>
                    Add to Cart 🛒
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
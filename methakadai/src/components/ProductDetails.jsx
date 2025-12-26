import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import '../Styles/ProductDetails.css'; // Make sure path is correct

const ProductDetails = ({ addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(""); 
  const [error, setError] = useState(false);
  
  const [selectedThickness, setSelectedThickness] = useState(null);

  const API_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://methakadai.onrender.com";

  useEffect(() => {
    axios.get(`${API_URL}/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        if(res.data.images?.length > 0) setMainImage(res.data.images[0]); 
        else if (res.data.image) setMainImage(res.data.image); 
        else setMainImage("https://placehold.co/400");

        if (res.data.thicknessOptions && res.data.thicknessOptions.length > 0) {
            setSelectedThickness(res.data.thicknessOptions[0]);
        }
      })
      .catch(err => { setError(true); });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.thicknessOptions?.length > 0 && !selectedThickness) {
        toast.error("Please select a thickness");
        return;
    }

    const finalPrice = selectedThickness ? selectedThickness.price : product.price;

    const productWithVariant = {
        ...product,
        price: finalPrice, 
        selectedThickness: selectedThickness 
    };
    addToCart(productWithVariant);
  };

  if (error) return <div className="error-container"><h2>Product Not Found</h2><button onClick={() => navigate('/')}>Back Home</button></div>;
  if (!product) return <div className="loading-container">Loading...</div>;

  const currentSellingPrice = selectedThickness ? selectedThickness.price : Number(product.price);
  const currentMrp = selectedThickness ? selectedThickness.mrp : Number(product.mrp);
  const discount = currentMrp > currentSellingPrice ? Math.round(((currentMrp - currentSellingPrice) / currentMrp) * 100) : 0;
  const savings = currentMrp - currentSellingPrice;
  const thicknessOptions = product.thicknessOptions || [];

  return (
    <div className="product-details-container">
      <Toaster />
      
      {/* LEFT: IMAGES */}
      <div className="image-section">
        <div className="main-image-wrapper">
            <img 
                src={mainImage} 
                alt={product.name} 
                className="main-image"
                onError={(e) => { e.target.src = "https://placehold.co/400"; }} 
            />
        </div>
        <div className="thumbnail-container">
            {product.images?.map((img, index) => (
                <img 
                    key={index} 
                    src={img} 
                    onClick={() => setMainImage(img)} 
                    className={`thumbnail ${mainImage === img ? 'active' : ''}`}
                    alt={`thumbnail-${index}`}
                />
            ))}
        </div>
      </div>

      {/* RIGHT: DETAILS */}
      <div className="details-section">
        <h1 className="product-title">{product.name}</h1>
        
        {/* Price Display */}
        <div className="price-container">
            {currentMrp > currentSellingPrice && (
                <span className="mrp-price">₹{currentMrp.toLocaleString()}</span>
            )}
            <span className="selling-price">₹{currentSellingPrice.toLocaleString()}</span>
            {discount > 0 && <span className="discount-badge">{discount}% OFF</span>}
        </div>

        {savings > 0 && <div className="savings-text">You save: ₹{savings.toLocaleString()}!</div>}
        
        {/* Thickness Selector */}
        {thicknessOptions.length > 0 && (
            <div className="thickness-section">
                <p className="thickness-label">Select Thickness:</p>
                <div className="thickness-options">
                    {thicknessOptions.map((opt, index) => (
                        <button 
                            key={index}
                            onClick={() => setSelectedThickness(opt)}
                            className={`thickness-btn ${selectedThickness?.name === opt.name ? 'selected' : ''}`}
                        >
                            {opt.name}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Product Info */}
        <div className="product-info">
            <p><strong>Size:</strong> {product.size}</p>
            <p><strong>Material:</strong> {product.material}</p>
            <p><strong>Warranty:</strong> {product.warranty}</p>
            <p className="description-text">{product.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
            <button onClick={handleAddToCart} className="btn-add-cart">ADD TO CART</button>
            <button onClick={() => toast.success("Added to Wishlist")} className="btn-wishlist">WISHLIST</button>
        </div>
        
        <div className="product-features">
            <p>✓ Free Delivery available</p>
            <p>✓ 7 Days Return Policy is Applicable only for defective products - Contact our customer support for more details</p>
            <p>✓ Cash on Delivery available</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
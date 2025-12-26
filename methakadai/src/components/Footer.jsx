import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import '../Styles/Footer.css';
import logo from '../assets/MClogo.jpeg'; // Make sure this path is correct

const Footer = () => {
  const navigate = useNavigate();
  const [showDevModal, setShowDevModal] = useState(false);

  return (
    <>
      <footer className="footer-container">
        <div className="footer-content">
          
          {/* Column 1: Brand Info */}
          <div className="footer-section brand">
            <h3>MethaKadai</h3>
            <p>
              Premium quality mattresses delivered directly to your doorstep in Tamilnadu. 
              Sleep better, live healthier.
            </p>
            <div className="social-icons">
              <span className="icon"><FaInstagram /></span>
              <span className="icon"><FaWhatsapp /></span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-section links">
            <h4>Quick Links</h4>
            <ul>
              <li onClick={() => navigate('/')}>Home</li>
              <li onClick={() => navigate('/')}>Shop Collections</li>
              <li onClick={() => navigate('/cart')}>My Cart</li>
              <li onClick={() => navigate('/myorders')}>Order History</li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="footer-section contact">
            <h4>Contact Us</h4>
            <p><FaMapMarkerAlt /> Coimbatore, Tamil Nadu, India</p>
            <p><FaPhoneAlt /> +91 98765 43210</p>
            <p><FaEnvelope /> support@methakadai.com</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>&copy; 2019 MethaKadai. All rights reserved.</p>
          <p className="developer-credit" onClick={() => setShowDevModal(true)}>
            Developed by <span>Middle Class Developers</span>
          </p>
        </div>
      </footer>

      {/* --- DEVELOPER INFO MODAL --- */}
      {showDevModal && (
        <div className="dev-modal-overlay" onClick={() => setShowDevModal(false)}>
          <div className="dev-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowDevModal(false)}>×</button>
            
            <div className="dev-logo-container">
              {/* Using the same logo or a specific Dev Logo if you have one */}
              <img src={logo} alt="MCD Logo" className="dev-logo" />
            </div>

            <h2>Middle Class Developers</h2>
            <p className="tagline">Turning Coffee into Code <span className='tagline-emoji'>☕</span></p>

            <div className="dev-profile">
                <div className="role-badge">Owner & Lead Developer</div>
                <h3 className="dev-name">Kishor J J</h3>
            </div>

            <a 
                href="https://instagram.com/middleclass.devs" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="insta-btn"
            >
                <FaInstagram /> Follow on Instagram
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
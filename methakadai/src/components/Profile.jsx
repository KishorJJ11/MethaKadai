import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { MdEdit } from 'react-icons/md'; // Pencil Icon
import '../Styles/Profile.css';

function Profile({ currentUser, setCurrentUser }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null); 

  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '', phone: '', address: '', profilePic: ''
  });

  const API_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://methakadai.onrender.com";

  useEffect(() => {
    if (!currentUser) {
        navigate('/'); 
    } else {
        fetchUserData();
    }
  }, [currentUser, navigate]);

  const fetchUserData = () => {
    axios.get(`${API_URL}/api/users/${currentUser}`)
        .then(res => {
            setUserData(res.data);
            setFormData({
                username: res.data.username,
                phone: res.data.phone || '',
                address: res.data.address || '',
                profilePic: res.data.profilePic || ''
            });
        })
        .catch(err => {
            console.error("Error fetching user data:", err);
            if(currentUser === 'admin') {
                toast.error("Administrator account not found in database.");
            }
        });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        // Limit file size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File is too large. Please select an image under 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onloadend = () => {
            setFormData({ ...formData, profilePic: reader.result }); 
        };
    }
  };

  const triggerFileInput = () => {
    if (isEditing) {
        fileInputRef.current.click();
    }
  };

  const handleSave = async () => {
    try {
        const res = await axios.put(`${API_URL}/api/users/${currentUser}`, formData);
        toast.success("Profile updated successfully");
        
        // 🔥 CRITICAL FIX: Update LocalStorage if username changes
        if (formData.username !== currentUser) {
            localStorage.setItem("methaUser", JSON.stringify(formData.username)); // Fixes session issue
            setCurrentUser(formData.username);
        }
        
        setIsEditing(false);
        setUserData(res.data); 
    } catch (error) {
        console.error("Save Error:", error);
        toast.error("Failed to update. Check Server/Image Size.");
    }
  };

  if (!userData) return <div className="loading">Loading Profile Details...</div>;

  return (
    <div className="profile-container">
      <h2 className='profile-title'>{currentUser === 'admin' ? 'Administrator Profile' : 'My Profile'}</h2>
      
      <div className="profile-card">
        
        {/* --- 1. HEADER SECTION (Corrected Layout) --- */}
        <div className="profile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '25px', marginBottom: '30px' }}>
            
            {/* Image Wrapper */}
            <div 
                className="avatar-wrapper" 
                onClick={triggerFileInput} 
                style={{ 
                    position: 'relative', 
                    width: '110px', 
                    height: '110px', 
                    cursor: isEditing ? 'pointer' : 'default' 
                }}
            >
                {/* Profile Image */}
                {formData.profilePic ? (
                    <img 
                        src={formData.profilePic} 
                        alt="Profile" 
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f4bf2fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '45px', fontWeight: 'bold', color: '#000', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        {currentUser === 'admin' ? 'A' : formData.username.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* 🔥 PENCIL ICON (Merged on Image) */}
                {isEditing && (
                    <div style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '0',
                        background: 'white',
                        borderRadius: '50%',
                        padding: '8px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid #eee'
                    }}>
                        <MdEdit size={18} color="#000" />
                    </div>
                )}
            </div>

            {/* 🔥 DULL TEXT (Right Side) */}
            {isEditing && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#b2bec3', fontSize: '13px', fontStyle: 'italic', marginTop: '4px' }}>
                        Click pencil to edit photo
                    </span>
                </div>
            )}

            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>

        {/* --- 2. DETAILS SECTION --- */}
        <div className="profile-details">
            
            {/* USERNAME */}
            <div className="detail-row">
                <span className="label">Username:</span>
                {isEditing ? (
                    <input 
                        type="text" name="username" value={formData.username} 
                        onChange={handleChange} className="edit-input"
                        disabled={currentUser === 'admin'} 
                    />
                ) : (
                    <span className="value" style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{userData.username}</span>
                )}
            </div>

            {/* EMAIL */}
            <div className="detail-row">
                <span className="label">Email Address:</span>
                <span className="value" style={{color: '#555'}}>{userData.email}</span>
            </div>
            
            {/* PHONE */}
            <div className="detail-row">
                <span className="label">Phone Number:</span>
                {isEditing ? (
                    <input 
                        type="text" name="phone" value={formData.phone} 
                        onChange={handleChange} className="edit-input"
                    />
                ) : (
                    <span className="value">{userData.phone || "Not Provided"}</span>
                )}
            </div>

            {/* ADDRESS */}
            <div className="detail-row">
                <span className="label">Delivery Address:</span>
                {isEditing ? (
                    <textarea 
                        name="address" value={formData.address} 
                        onChange={handleChange} className="edit-input"
                        style={{ height: '80px', resize: 'none' }}
                    />
                ) : (
                    <span className="value">{userData.address || "No address saved"}</span>
                )}
            </div>
        </div>

        {/* --- 3. ACTIONS --- */}
        <div className="profile-actions">
            {isEditing ? (
                <>
                    <button className="save-btn" onClick={handleSave}>Save Changes</button>
                    <button className="cancel-btn" onClick={() => {
                        setIsEditing(false);
                        setFormData({...formData, profilePic: userData.profilePic}); 
                    }}>Cancel</button>
                </>
            ) : (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
            )}
            
            {currentUser === 'admin' && !isEditing && (
                <button className="edit-btn" onClick={() => navigate('/admin')} style={{backgroundColor: '#d63031', marginTop: '10px'}}>
                    Access Admin Dashboard
                </button>
            )}
        </div>

        <button className="back-home-btn" onClick={() => navigate('/')}>← Back to Shopping</button>
      </div>
    </div>
  );
}

export default Profile;
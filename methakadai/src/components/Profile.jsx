import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import '../Styles/Profile.css';

function Profile({ currentUser, setCurrentUser }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null); 

  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '', phone: '', address: '', profilePic: ''
  });

  // Smart API URL switching logic
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
        
        if (formData.username !== currentUser) {
            setCurrentUser(formData.username);
        }
        
        setIsEditing(false);
        setUserData(res.data); 
    } catch (error) {
        toast.error("Failed to update profile. Please try again.");
    }
  };

  if (!userData) return <div className="loading">Loading Profile Details...</div>;

  return (
    <div className="profile-container">
      <h2>{currentUser === 'admin' ? 'Administrator Profile' : 'My Profile'}</h2>
      
      <div className="profile-card">
        <div className="profile-header">
            
            <div className="avatar-container" onClick={triggerFileInput} style={{ cursor: isEditing ? 'pointer' : 'default' }}>
                {formData.profilePic ? (
                    <img src={formData.profilePic} alt="Profile" className="profile-img-circle" />
                ) : (
                    <div className="avatar">
                        {currentUser === 'admin' ? 'A' : formData.username.charAt(0).toUpperCase()}
                    </div>
                )}
                
                {isEditing && (
                    <div className="camera-overlay">Edit Photo</div>
                )}
            </div>

            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleImageUpload}
            />

            {isEditing ? (
                 <div className="edit-section">
                    <label>Username:</label>
                    <input 
                        type="text" name="username" value={formData.username} 
                        onChange={handleChange} className="edit-input"
                        disabled={currentUser === 'admin'} 
                    />
                    <small style={{color: '#636e72'}}>Click photo to update</small>
                 </div>
            ) : (
                <>
                    <h3>{userData.username}</h3>
                    <p className="role">{currentUser === 'admin' ? 'System Administrator' : 'Verified Customer'}</p>
                </>
            )}
        </div>

        <div className="profile-details">
            <div className="detail-row">
                <span className="label">Email Address:</span>
                <span className="value">{userData.email}</span>
            </div>
            
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

            <div className="detail-row">
                <span className="label">Delivery Address:</span>
                {isEditing ? (
                    <textarea 
                        name="address" value={formData.address} 
                        onChange={handleChange} className="edit-input"
                    />
                ) : (
                    <span className="value">{userData.address || "No address saved"}</span>
                )}
            </div>
        </div>

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
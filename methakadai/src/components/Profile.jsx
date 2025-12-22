import React, { useEffect, useState, useRef } from 'react';
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

  useEffect(() => {
    if (!currentUser) {
        navigate('/'); 
    } else {
        // Ippo Admin-kkum Database la irunthu dhaan data varum!
        fetchUserData();
    }
  }, [currentUser, navigate]);

  const fetchUserData = () => {
    // Admin ah irundhalum DB call pogum (So namma Signup panna data varum)
    axios.get(`http://localhost:5000/api/users/${currentUser}`)
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
            console.error("Error:", err);
            // Incase Admin signup pannama login pannirundha, error varaama irukka:
            if(currentUser === 'admin') {
                toast.error("Mapla! First 'admin' username la Signup pannu!");
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
        const res = await axios.put(`http://localhost:5000/api/users/${currentUser}`, formData);
        toast.success("Profile Update Panniyachu! ✅");
        if (formData.username !== currentUser) {
            // Admin username ah maatha vittura koodadhu, but safe side ku irukkattum
            setCurrentUser(formData.username);
        }
        setIsEditing(false);
        setUserData(res.data); 
    } catch (error) {
        toast.error("Update aagala mapla. Admin account Create panniya?");
    }
  };

  if (!userData) return <div className="loading">Loading Profile... 👤</div>;

  return (
    <div className="profile-container">
      <h2>{currentUser === 'admin' ? '👑 Admin Profile' : '👤 My Profile'}</h2>
      
      <div className="profile-card">
        <div className="profile-header">
            
            <div className="avatar-container" onClick={triggerFileInput}>
                {formData.profilePic ? (
                    <img src={formData.profilePic} alt="Profile" className="profile-img-circle" />
                ) : (
                    <div className="avatar">
                        {currentUser === 'admin' && !formData.profilePic ? 'A' : formData.username.charAt(0).toUpperCase()}
                    </div>
                )}
                
                {isEditing && (
                    <div className="camera-overlay">📷</div>
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
                        disabled={currentUser === 'admin'} // Admin username maatha koodathu (Safety)
                    />
                    <small style={{color: '#dfe6e9'}}>Click photo to change 👇</small>
                 </div>
            ) : (
                <>
                    <h3>{userData.username}</h3>
                    <p className="role">{currentUser === 'admin' ? 'Website Owner & Admin' : 'MethaKadai Customer'}</p>
                </>
            )}
        </div>

        <div className="profile-details">
            <div className="detail-row">
                <span className="label">📧 Email:</span>
                <span className="value">{userData.email}</span>
            </div>
            
            <div className="detail-row">
                <span className="label">📞 Phone:</span>
                {isEditing ? (
                    <input 
                        type="text" name="phone" value={formData.phone} 
                        onChange={handleChange} className="edit-input"
                    />
                ) : (
                    <span className="value">{userData.phone || "Not Added"}</span>
                )}
            </div>

            <div className="detail-row">
                <span className="label">🏠 Address:</span>
                {isEditing ? (
                    <textarea 
                        name="address" value={formData.address} 
                        onChange={handleChange} className="edit-input"
                    />
                ) : (
                    <span className="value">{userData.address || "No Address Saved"}</span>
                )}
            </div>
        </div>

        <div className="profile-actions">
            {isEditing ? (
                <>
                    <button className="save-btn" onClick={handleSave}>Save ✅</button>
                    <button className="cancel-btn" onClick={() => {
                        setIsEditing(false);
                        setFormData({...formData, profilePic: userData.profilePic}); 
                    }}>Cancel ❌</button>
                </>
            ) : (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile ✏️</button>
            )}
            
            {/* Admin Dashboard Link */}
            {currentUser === 'admin' && !isEditing && (
                <button className="edit-btn" onClick={() => navigate('/admin')} style={{backgroundColor: '#e74c3c', marginTop: '10px'}}>
                    Go to Admin Dashboard 👑
                </button>
            )}
        </div>

        <button className="back-home-btn" onClick={() => navigate('/')}>← Back to Shopping</button>
      </div>
    </div>
  );
}

export default Profile;
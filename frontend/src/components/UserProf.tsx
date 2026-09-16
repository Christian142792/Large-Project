import React, { useState, useEffect } from 'react';
import '../css/UserProfile.css';
import '../css/WhereImGoing.css';

function UserProf() {
    const stored = localStorage.getItem('user_data');
    const ud = stored ? JSON.parse(stored) : {};

    const [userData, setUserData] = useState({
        name: ud.firstName || '',
        username: ud.username || '',
        email: ud.email || '',
        profileimage: ud.profileimage || '',
    });

    useEffect(() => {
        localStorage.setItem('user_data', JSON.stringify({
            firstName: userData.name,
            username: userData.username,
            email: userData.email,
            profileimage: userData.profileimage,
        }));
    }, [userData]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProfileImage, setNewProfileImage] = useState('');
    const [imageError, setImageError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Unable to read image.'));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('Unable to load image.'));
                img.onload = () => {
                    const maxDimension = 512;
                    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(img.width * scale));
                    canvas.height = Math.max(1, Math.round(img.height * scale));
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Unable to process image.'));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.82));
                };
                img.src = String(reader.result);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setImageError('');
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setImageError('Please select an image file.');
            return;
        }
        try {
            const resized = await resizeImage(file);
            setNewProfileImage(resized);
        } catch (error: any) {
            setImageError(error.message || 'Unable to process image.');
        }
    };

    const saveProfileImage = async () => {
        if (!newProfileImage) {
            setImageError('Choose an image first.');
            return;
        }

        setIsSaving(true);
        setImageError('');
        try {
            const response = await fetch(`/api/updateprofileimage/${encodeURIComponent(userData.username)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileimage: newProfileImage }),
            });
            const result = await response.json().catch(() => ({ status: 'Unable to save profile image' }));
            if (!response.ok || result.status !== 'Success') {
                throw new Error(result.status || 'Unable to save profile image');
            }

            setUserData(prev => ({ ...prev, profileimage: result.profileimage || newProfileImage }));
            setIsModalOpen(false);
            setNewProfileImage('');
        } catch (error: any) {
            setImageError(error.message || 'Unable to save profile image.');
        } finally {
            setIsSaving(false);
        }
    };

    const openModal = () => {
        setImageError('');
        setNewProfileImage('');
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    return (
        <div className="profile-card">
            <div className="profile-label">Profile Details</div>
            <div className="profile-content">
                <div className="profile-avatar">
                    <div
                        className="avatar-placeholder"
                        style={{
                            background: userData.profileimage
                                ? `#ccc url(${userData.profileimage}) center/cover no-repeat`
                                : '#ccc',
                        }}
                    />
                </div>

                <div className="profile-details">
                    <div className="profile-field"><span className="field-label">Name:</span><span className="field-value">{userData.name}</span></div>
                    <div className="profile-field"><span className="field-label">Username:</span><span className="field-value">{userData.username}</span></div>
                    <div className="profile-field"><span className="field-label">Email:</span><span className="field-value">{userData.email}</span></div>
                    <div>
                        <button className="edit" onClick={openModal}>Edit Profile Image</button>
                        <a href="/">
                            <button
                                className="logout-button"
                                onClick={() => {
                                    fetch('/api/logout', { method: 'POST' }).catch(() => {});
                                    localStorage.clear();
                                }}
                            >
                                Logout
                            </button>
                        </a>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={closeModal}>&times;</span>
                        <form>
                            <h2>Edit Profile Image</h2>
                            <label>
                                Upload New Image:
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                            </label>
                            {newProfileImage && (
                                <div style={{ marginTop: '12px' }}>
                                    <img src={newProfileImage} alt="Profile preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%' }} />
                                </div>
                            )}
                            {imageError && <p id="error">{imageError}</p>}
                            <br />
                            <button type="button" className="edit" onClick={saveProfileImage} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" className="logout-button" onClick={closeModal} disabled={isSaving}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserProf;

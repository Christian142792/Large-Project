import React, { useState, useEffect } from 'react';
import '../css/UserProfile.css';
import '../css/WhereImGoing.css'; // Reuse modal styles from WhereImGoing.css

function UserProf() {
    let _ud: any = localStorage.getItem('user_data');
    let ud = JSON.parse(_ud);

    const [userData, setUserData] = useState({
        name: ud.firstName,
        username: ud.username,
        email: ud.email,
        profileimage: ud.profileimage,
    });

    useEffect(() => {
        if (userData && Object.keys(userData).length > 0) {
          localStorage.setItem('user_data', JSON.stringify(userData));
          console.log("Saved to localStorage:", userData);
        }
      }, [userData]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProfileImage, setNewProfileImage] = useState('');

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();

            // reader.onload = () => {
            //     if (reader.result) {
            //         setNewProfileImage(reader.result.toString());
            //     }
            // };

            reader.onload = () => {
                if (reader.result) {
                    setNewProfileImage(reader.result.toString());
                }
            };

            reader.readAsDataURL(file);
        }
    };

    const saveProfileImage = async () => {
        const response = await fetch(`/api/updateprofileimage/${userData.username}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({profileimage: newProfileImage}),
        });

        console.log(newProfileImage);
        await setUserData((prevData) => ({
            ...prevData,
            profileimage: newProfileImage,
        }));
        console.log(userData.profileimage);
        localStorage.setItem('user_data', JSON.stringify(userData));

        setIsModalOpen(false);

        // Refresh the page so nav bar updates
        window.location.reload();
    };

    const openModal = () => setIsModalOpen(true);
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
                                ? `#ccc url(${userData.profileimage}) center/160% no-repeat`
                                : `#ccc`,
                        }}
                    />
                </div>

                <div className="profile-details">
                    <div className="profile-field">
                        <span className="field-label">Name:</span>
                        <span className="field-value">{userData.name}</span>
                    </div>
                    <div className="profile-field">
                        <span className="field-label">Username:</span>
                        <span className="field-value">{userData.username}</span>
                    </div>
                    <div className="profile-field">
                        <span className="field-label">Email:</span>
                        <span className="field-value">{userData.email}</span>
                    </div>
                    <div>
                        <button className="edit" onClick={openModal}>
                            Edit Profile Image
                        </button>
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
                        <span className="close-button" onClick={closeModal}>
                            &times;
                        </span>
                        <form>
                            <h2>Edit Profile Image</h2>
                            <label>
                                Upload New Image:
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </label>
                            <br />
                            <button
                                type="button"
                                className="edit"
                                onClick={saveProfileImage}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                className="logout-button"
                                onClick={closeModal}
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserProf;

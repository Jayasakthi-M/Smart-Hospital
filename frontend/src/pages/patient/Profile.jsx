import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, updateUserProfile } from "../../services/authService";

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        name: "",
        email: "", // We still keep it for display-only
        phone: "",
        address: "",
        dob: "",
        gender: "",
        bloodGroup: "",
        profilePic: "",
        age: "",
        height: "",
        weight: ""
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        if (user && user.id) {
            fetchProfile();
        }
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await getUserProfile(user.id);
            setProfile({
                ...profile,
                ...res.data
            });
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Image size should be less than 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile({ ...profile, profilePic: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeProfilePic = () => {
        setProfile({ ...profile, profilePic: "" });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Check for session more robustly
        if (!user || (!user.id && !user._id)) {
            alert("Session details not found. Please logout and login again.");
            return;
        }

        const userId = user.id || user._id;

        setSaving(true);
        try {
            // Destructure to ensure we only send what's needed
            const { name, phone, address, dob, gender, bloodGroup, profilePic, age, height, weight } = profile;
            const updatePayload = { name, phone, address, dob, gender, bloodGroup, profilePic, age, height, weight };

            const res = await updateUserProfile(userId, updatePayload);

            if (res.data && res.data.user) {
                setProfile({ ...profile, ...res.data.user });
                setIsEditing(false);
                alert("Profile updated successfully!");

                // Update local storage with new name
                const updatedUser = {
                    ...user,
                    name: res.data.user.name
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                // Refresh the page to sync all components
                window.location.reload();
            }
        } catch (error) {
            console.error("Profile update error:", error);
            const serverMessage = error.response?.data?.message;
            alert(serverMessage || "Failed to update profile. Please try logging out and in again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    return (
        <div className="container-fluid pb-5">
            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                        {/* Header Banner */}
                        <div className="bg-primary py-4 px-4 text-center">
                            <h2 className="text-white fw-bold mb-0">My Patient Profile</h2>
                            <p className="text-white text-opacity-75 mb-0">Manage your personal and medical information</p>
                        </div>

                        <div className="card-body p-4 p-md-5">
                            <div className="row g-5">
                                {/* Left Side: Photo & Quick Stats */}
                                <div className="col-md-4 text-center border-md-end">
                                    <div className="position-relative d-inline-block mb-4">
                                        <div className="bg-white p-2 rounded-circle shadow-sm border" style={{ width: '200px', height: '200px' }}>
                                            {profile.profilePic ? (
                                                <img
                                                    src={profile.profilePic}
                                                    alt="Profile"
                                                    className="rounded-circle object-fit-cover w-100 h-100"
                                                />
                                            ) : (
                                                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center w-100 h-100">
                                                    <span style={{ fontSize: '90px' }}>👤</span>
                                                </div>
                                            )}
                                        </div>
                                        {isEditing && (
                                            <div className="position-absolute bottom-0 end-0 mb-2 me-2 d-flex gap-2">
                                                <label htmlFor="profilePic" className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '45px', height: '45px', cursor: 'pointer' }}>
                                                    📷
                                                    <input type="file" id="profilePic" hidden onChange={handleImageChange} accept="image/*" />
                                                </label>
                                                {profile.profilePic && (
                                                    <button onClick={removeProfilePic} className="btn btn-danger rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '45px', height: '45px' }}>
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="fw-bold mb-1 text-dark">{profile.name}</h3>
                                    <p className="text-muted mb-4">{profile.email}</p>

                                    <div className="bg-light rounded-4 p-3 d-flex justify-content-around text-center mt-2">
                                        <div>
                                            <div className="small text-secondary">Blood</div>
                                            <div className="fw-bold text-danger">{profile.bloodGroup || '--'}</div>
                                        </div>
                                        <div className="border-start"></div>
                                        <div>
                                            <div className="small text-secondary">Gender</div>
                                            <div className="fw-bold text-primary">{profile.gender || '--'}</div>
                                        </div>
                                    </div>

                                    {/* Added Stats Display */}
                                    <div className="bg-light rounded-4 p-3 d-flex justify-content-around text-center mt-3">
                                        <div>
                                            <div className="small text-secondary">Age</div>
                                            <div className="fw-bold text-dark">{profile.age || '--'}</div>
                                        </div>
                                        <div className="border-start"></div>
                                        <div>
                                            <div className="small text-secondary">Height</div>
                                            <div className="fw-bold text-dark">{profile.height ? `${profile.height} cm` : '--'}</div>
                                        </div>
                                        <div className="border-start"></div>
                                        <div>
                                            <div className="small text-secondary">Weight</div>
                                            <div className="fw-bold text-dark">{profile.weight ? `${profile.weight} kg` : '--'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Detailed Form */}
                                <div className="col-md-8">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h4 className="fw-bold text-dark mb-0">Personal Details</h4>
                                        {!isEditing ? (
                                            <button onClick={() => setIsEditing(true)} className="btn btn-primary px-4 rounded-pill fw-bold shadow-sm">
                                                Edit Profile
                                            </button>
                                        ) : (
                                            <div className="d-flex gap-2">
                                                <button onClick={() => setIsEditing(false)} className="btn btn-light px-4 rounded-pill fw-bold border">
                                                    Cancel
                                                </button>
                                                <button onClick={handleSave} disabled={saving} className="btn btn-success px-4 rounded-pill fw-bold shadow-sm">
                                                    {saving ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <form onSubmit={handleSave} className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Full Name</label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="name"
                                                value={profile.name}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                required
                                            />
                                        </div>
                                        {/* Removed Email field to avoid conflicts */}
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Phone Number</label>
                                            <input
                                                type="tel"
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="phone"
                                                placeholder="e.g. +91 9876543210"
                                                value={profile.phone}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Date of Birth</label>
                                            <input
                                                type="date"
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="dob"
                                                value={profile.dob}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Gender</label>
                                            <select
                                                className={`form-select form-select-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="gender"
                                                value={profile.gender}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Blood Group</label>
                                            <select
                                                className={`form-select form-select-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="bloodGroup"
                                                value={profile.bloodGroup}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            >
                                                <option value="">Select Blood Group</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                        </div>

                                        {/* Added Age, Height, Weight Fields */}
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Age</label>
                                            <input
                                                type="number"
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="age"
                                                placeholder="Enter age"
                                                value={profile.age}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Height (cm)</label>
                                            <input
                                                type="number"
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="height"
                                                placeholder="Height in cm"
                                                value={profile.height}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Weight (kg)</label>
                                            <input
                                                type="number"
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="weight"
                                                placeholder="Weight in kg"
                                                value={profile.weight}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Complete Address</label>
                                            <textarea
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="address"
                                                rows="3"
                                                placeholder="Enter your current residential address"
                                                value={profile.address}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            ></textarea>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                @media (min-width: 768px) {
                    .border-md-end {
                        border-right: 1px solid #dee2e6 !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default Profile;

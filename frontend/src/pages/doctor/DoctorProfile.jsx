import { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "../../services/authService";

const DoctorProfile = () => {
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        gender: "",
        age: "",
        specialization: "",
        experience: "",
        consultationFee: "",
        profilePic: ""
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
            console.log("DoctorProfile: Fetched raw data:", res.data);

            // Explicitly map all fields to ensure they are captured in state
            const serverData = res.data;
            setProfile({
                name: serverData.name || "",
                email: serverData.email || "",
                phone: serverData.phone || "",
                address: serverData.address || "",
                gender: serverData.gender || "",
                age: serverData.age || "",
                specialization: serverData.specialization || "",
                experience: serverData.experience || "",
                consultationFee: serverData.consultationFee || "",
                profilePic: serverData.profilePic || ""
            });
            console.log("DoctorProfile: State updated from server.");
        } catch (error) {
            console.error("DoctorProfile: Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Image size should be less than 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, profilePic: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeProfilePic = () => {
        if (window.confirm("Are you sure you want to remove your profile photo?")) {
            setProfile(prev => ({ ...prev, profilePic: "" }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!user || (!user.id && !user._id)) {
            alert("No user session. Please logout and login again.");
            return;
        }

        const userId = user.id || user._id;
        setSaving(true);

        try {
            // Include EVERY field explicitly in the payload
            const updatePayload = {
                name: profile.name,
                phone: profile.phone,
                address: profile.address,
                gender: profile.gender,
                age: profile.age,
                specialization: profile.specialization,
                experience: profile.experience,
                consultationFee: profile.consultationFee,
                profilePic: profile.profilePic
            };

            console.log("DoctorProfile: Sending update payload:", updatePayload);

            const res = await updateUserProfile(userId, updatePayload);
            console.log("DoctorProfile: Server response:", res.data);

            if (res.data && res.data.user) {
                // Merge the returned data back into state
                const updated = res.data.user;
                setProfile(prev => ({
                    ...prev,
                    ...updated
                }));

                setIsEditing(false);
                alert("Profile changes saved successfully!");

                // Sync local storage name if it changed
                const storedUser = JSON.parse(localStorage.getItem("user"));
                localStorage.setItem("user", JSON.stringify({
                    ...storedUser,
                    name: updated.name
                }));

                // Reload to sync all components
                window.location.reload();
            }
        } catch (error) {
            console.error("DoctorProfile: Update error:", error);
            const msg = error.response?.data?.message || "Error saving profile. Try again.";
            alert(msg);
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
                        <div className="bg-primary py-4 px-4 text-center">
                            <h2 className="text-white fw-bold mb-0">My Doctor Profile</h2>
                            <p className="text-white text-opacity-75 mb-0">Update your professional details</p>
                        </div>

                        <div className="card-body p-4 p-md-5">
                            <div className="row g-5">
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
                                                    <span style={{ fontSize: '90px' }}>👨‍⚕️</span>
                                                </div>
                                            )}
                                        </div>
                                        {isEditing && (
                                            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2 d-flex gap-2">
                                                <label htmlFor="profilePic" className="btn btn-primary rounded-pill d-flex align-items-center gap-2 shadow-sm px-3" style={{ cursor: 'pointer' }}>
                                                    📷 <span>Change</span>
                                                    <input type="file" id="profilePic" hidden onChange={handleImageChange} accept="image/*" />
                                                </label>
                                                {profile.profilePic && (
                                                    <button onClick={removeProfilePic} className="btn btn-danger rounded-pill d-flex align-items-center gap-2 shadow-sm px-3">
                                                        🗑️ <span>Remove</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                    <h3 className="fw-bold mb-1 text-dark">{profile.name}</h3>
                                    <p className="text-muted mb-4">{profile.email}</p>

                                    <div className="bg-light rounded-4 p-3 d-flex justify-content-around text-center mt-2">
                                        <div>
                                            <div className="small text-secondary">Exp</div>
                                            <div className="fw-bold text-success">{profile.experience || '--'}</div>
                                        </div>
                                        <div className="border-start"></div>
                                        <div>
                                            <div className="small text-secondary">Fee</div>
                                            <div className="fw-bold text-primary">₹{profile.consultationFee || '--'}</div>
                                        </div>
                                    </div>

                                    <div className="bg-light rounded-4 p-3 d-flex justify-content-around text-center mt-3">
                                        <div>
                                            <div className="small text-secondary">Age</div>
                                            <div className="fw-bold text-dark">{profile.age || '--'}</div>
                                        </div>
                                        <div className="border-start"></div>
                                        <div>
                                            <div className="small text-secondary">Gender</div>
                                            <div className="fw-bold text-dark">{profile.gender || '--'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-8">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h4 className="fw-bold text-dark mb-0">Professional Details</h4>
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
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Specialization</label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="specialization"
                                                placeholder="e.g. Cardiologist"
                                                value={profile.specialization}
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
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Age</label>
                                            <input
                                                type="number"
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="age"
                                                value={profile.age}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Experiences</label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="experience"
                                                placeholder="e.g. 10+ Years"
                                                value={profile.experience}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Consultation Fee (₹)</label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="consultationFee"
                                                placeholder="e.g. 500"
                                                value={profile.consultationFee}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Clinic/Hospital Address</label>
                                            <textarea
                                                className={`form-control form-control-lg ${!isEditing ? 'bg-light border-0' : ''}`}
                                                name="address"
                                                rows="3"
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

export default DoctorProfile;

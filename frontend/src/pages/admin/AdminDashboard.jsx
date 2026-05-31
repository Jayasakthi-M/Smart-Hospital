import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from "../../assets/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import { getDashboardCounts, getAllDoctors, registerUser, updateUserProfile, deleteUser, getPatientsWithAppointments, getUserProfile } from "../../services/authService";
import { getAllAppointments, updateAppointmentStatus } from "../../services/appointmentService";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("token");
        navigate("/login");
    };

    const [stats, setStats] = useState({
        totalDoctors: 0,
        totalPatients: 0,
        todayAppointments: 0,
        pendingApprovals: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusData, setStatusData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);

    // Doctor Management States
    const [doctors, setDoctors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [doctorForm, setDoctorForm] = useState({
        name: '',
        email: '',
        password: '',
        specialization: '',
        experience: '',
        consultationFee: '',
        about: ''
    });

    // Patient Management States
    const [patientsWithAppointments, setPatientsWithAppointments] = useState([]);
    const [selectedPatientFull, setSelectedPatientFull] = useState(null);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

    const COLORS = {
        Pending: "#facc15",
        Approved: "#22c55e",
        Cancelled: "#ef4444",
        Completed: "#3b82f6"
    };

    const fetchDashboardData = async () => {
        try {
            const res = await getDashboardCounts();
            setStats({
                totalDoctors: res.data.doctors,
                totalPatients: res.data.patients,
                todayAppointments: res.data.todayAppointments || 0,
                pendingApprovals: res.data.pending
            });
            const statusRes = await axios.get("http://localhost:5000/api/admin/analytics/status");
            setStatusData(statusRes.data);

            const monthlyRes = await axios.get("http://localhost:5000/api/admin/analytics/monthly");
            setMonthlyData(monthlyRes.data);

            setError(null);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            // Don't set error on auto-refresh failures to avoid blinking alerts
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await getAllDoctors();
            setDoctors(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching doctors:", err);
        }
    };

    const fetchPatientsWithApp = async () => {
        try {
            const res = await getPatientsWithAppointments();
            const filteredPatients = (Array.isArray(res.data) ? res.data : [])
                .filter(p => p.patientName && p.patientName !== "Unknown Patient");
            setPatientsWithAppointments(filteredPatients);
        } catch (err) {
            console.error("Error fetching patients:", err);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab === 'Doctors') {
            fetchDoctors();
        } else if (activeTab === 'Patients') {
            fetchPatientsWithApp();
        }
    }, [activeTab]);

    const openPatientModal = async (patient) => {
        try {
            const res = await getUserProfile(patient.patientId);
            setSelectedPatientFull(res.data);
            setIsPatientModalOpen(true);
        } catch (err) {
            alert("Failed to fetch patient details");
        }
    };

    const handleDoctorFormChange = (e) => {
        setDoctorForm({ ...doctorForm, [e.target.name]: e.target.value });
    };

    const handleAddEditDoctor = async (e) => {
        e.preventDefault();
        try {
            if (editingDoctor) {
                // Update
                await updateUserProfile(editingDoctor._id, doctorForm);
                alert("Doctor updated successfully");
            } else {
                // Add
                const res = await registerUser({ ...doctorForm, role: 'doctor' });
                alert(res.data.message);
            }
            setIsModalOpen(false);
            setEditingDoctor(null);
            setDoctorForm({ name: '', email: '', password: '', specialization: '', experience: '', consultationFee: '', about: '' });
            fetchDoctors();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed");
        }
    };

    const handleDeleteDoctor = async (id) => {
        if (window.confirm("Are you sure you want to delete this doctor? This will also remove their appointments.")) {
            try {
                await deleteUser(id);
                alert("Doctor deleted successfully");
                fetchDoctors();
            } catch (err) {
                alert("Failed to delete doctor");
            }
        }
    };

    const openModal = (doctor = null) => {
        if (doctor) {
            setEditingDoctor(doctor);
            setDoctorForm({
                name: doctor.name || '',
                email: doctor.email || '',
                password: '', // Don't show password on edit
                specialization: doctor.specialization || '',
                experience: doctor.experience || '',
                consultationFee: doctor.consultationFee || '',
                about: doctor.about || ''
            });
        } else {
            setEditingDoctor(null);
            setDoctorForm({ name: '', email: '', password: '', specialization: '', experience: '', consultationFee: '', about: '' });
        }
        setIsModalOpen(true);
    };

    return (
        <div className="d-flex vh-100 bg-light admin-dashboard">
            <style>
                {`
                    .admin-dashboard .hover-scale { transition: transform 0.3s ease, box-shadow 0.3s ease; }
                    .admin-dashboard .hover-scale:hover { transform: scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.15) !important; }
                    .admin-dashboard .sidebar-item { transition: all 0.3s ease; }
                    .admin-dashboard .sidebar-item:hover { background-color: #f8f9fa; color: #0d6efd !important; transform: translateX(5px); }
                    .admin-dashboard .btn-hover { transition: all 0.3s ease; }
                    .admin-dashboard .btn-hover:hover { background-color: #dc3545 !important; color: white !important; box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4); }
                    .admin-dashboard .cursor-pointer { cursor: pointer; }
                    .admin-dashboard .z-1050 { z-index: 1050; }
                    .admin-dashboard .modal-backdrop { background-color: rgba(0,0,0,0.5); }
                `}
            </style>

            {/* Left Sidebar */}
            <div 
                className={`d-flex flex-column bg-white shadow-sm transition-all ${isSidebarOpen ? "w-250px" : "w-80px"}`}
                style={{ width: isSidebarOpen ? '260px' : '80px', transition: 'width 0.3s', zIndex: 1000 }}
            >
                <div className="d-flex align-items-center justify-content-center py-4 border-bottom h-75px">
                    <img src={logo} alt="Logo" style={{ width: '40px' }} />
                    {isSidebarOpen && <span className="ms-2 fw-bold text-primary h5 mb-0" onClick={() => setActiveTab('Dashboard')} style={{cursor: 'pointer'}}>Smart Hospital</span>}
                </div>

                <div className="flex-grow-1 py-4 d-flex flex-column gap-2 px-3">
                    <SidebarItem icon="📊" label="Dashboard" onClick={() => setActiveTab('Dashboard')} isOpen={isSidebarOpen} active={activeTab === 'Dashboard'} />
                    <SidebarItem icon="👨‍⚕️" label="Doctors" onClick={() => setActiveTab('Doctors')} isOpen={isSidebarOpen} active={activeTab === 'Doctors'} />
                    <SidebarItem icon="👥" label="Patients" onClick={() => setActiveTab('Patients')} isOpen={isSidebarOpen} active={activeTab === 'Patients'} />
                    <SidebarItem icon="📅" label="Appointments" onClick={() => setActiveTab('Appointments')} isOpen={isSidebarOpen} active={activeTab === 'Appointments'} />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                <header className="bg-white shadow-sm py-3 px-4 d-flex justify-content-between align-items-center z-index-10">
                    <button className="btn btn-light border-0" onClick={() => setIsSidebarOpen(!isSidebarOpen)}> <span className="h4">☰</span></button>
                    <div className="d-flex align-items-center gap-4">
                        <div className="d-flex align-items-center gap-2">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '35px', height: '35px' }}><span className="fw-bold">A</span></div>
                            <span className="fw-semibold d-none d-md-block">Admin</span>
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-4 py-2 fw-bold btn-hover">Logout</button>
                    </div>
                </header>

                <main className="flex-grow-1 overflow-auto p-4 bg-light">
                    {activeTab === 'Dashboard' && (
                        <div className="bg-light w-100 h-100 p-2">
                            <div className="mb-4">
                                <h2 className="fw-bold text-dark">Welcome Admin!</h2>
                                <p className="text-secondary">Here’s what’s happening today</p>
                            </div>
                            
                            {error && <div className="alert alert-danger">{error}</div>}

                            <div className="row g-4 mt-2">
                                <DashboardCard title="Total Doctors" value={stats.totalDoctors} icon="👨‍⚕️" gradient="linear-gradient(135deg, #4e73df 0%, #224abe 100%)" loading={loading} />
                                <DashboardCard title="Total Patients" value={stats.totalPatients} icon="👥" gradient="linear-gradient(135deg, #1cc88a 0%, #13855c 100%)" loading={loading} />
                                <DashboardCard title="Today Appointments" value={stats.todayAppointments} icon="📅" gradient="linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)" loading={loading} />
                                <DashboardCard title="Pending Approvals" value={stats.pendingApprovals} icon="⏳" gradient="linear-gradient(135deg, #ff9800 0%, #f57c00 100%)" loading={loading} />
                            </div>


                        </div>
                    )}

                    {activeTab === 'Doctors' && (
                        <div className="container-fluid animate-slide-in">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="fw-bold text-dark">Doctor Management</h2>
                                <button className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm" onClick={() => openModal()}>+ Add New Doctor</button>
                            </div>

                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3">Doctor</th>
                                                <th className="px-4 py-3">Specialization</th>
                                                <th className="px-4 py-3">Experience</th>
                                                <th className="px-4 py-3">Fees</th>
                                                <th className="px-4 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {doctors.map(doc => (
                                                <tr key={doc._id}>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded-circle p-2 me-3">👨‍⚕️</div>
                                                            <div>
                                                                <div className="fw-bold">{doc.name}</div>
                                                                <div className="text-muted small">{doc.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">{doc.specialization || 'N/A'}</td>
                                                    <td className="px-4 py-3">{doc.experience || 'N/A'}</td>
                                                    <td className="px-4 py-3">₹{doc.consultationFee || '0'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button className="btn btn-sm btn-outline-primary me-2 rounded-pill px-3" onClick={() => openModal(doc)}>Edit</button>
                                                        <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleDeleteDoctor(doc._id)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {doctors.length === 0 && (
                                                <tr><td colSpan="5" className="text-center py-5 text-muted">No doctors found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Patients' && (
                        <div className="container-fluid animate-slide-in">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="fw-bold text-dark">Patient Management</h2>
                                <p className="text-secondary small mb-0">List of patients who have booked appointments</p>
                            </div>

                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light border-0">
                                            <tr>
                                                <th className="px-4 py-3 text-secondary small fw-bold">PATIENT NAME</th>
                                                <th className="px-4 py-3 text-secondary small fw-bold">PHONE</th>
                                                <th className="px-4 py-3 text-secondary small fw-bold">APPOINTMENTS</th>
                                                <th className="px-4 py-3 text-secondary small fw-bold">LAST VISIT</th>
                                                <th className="px-4 py-3 text-center text-secondary small fw-bold">DETAILS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="border-0">
                                            {(patientsWithAppointments || []).map(patient => (
                                                <tr key={patient.patientId} className="border-bottom-0">
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded-circle p-2 me-3" style={{width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>👤</div>
                                                            <div className="fw-bold text-dark">{patient.patientName}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-secondary">{patient.phone || "N/A"}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-2 fw-medium border border-primary-subtle" style={{fontSize: '0.75rem'}}>
                                                            {patient.appointmentCount} Bookings
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-dark fw-medium">
                                                        {new Date(patient.lastVisitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button 
                                                            className="btn btn-sm btn-light border rounded-pill px-3 fw-bold text-primary"
                                                            onClick={() => openPatientModal(patient)}
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!patientsWithAppointments || patientsWithAppointments.length === 0) && (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-5">
                                                        <div className="text-muted opacity-50 mb-2">No patient records found</div>
                                                        <span className="small text-secondary">Patients who book appointments will appear here.</span>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Appointments' && (
                        <AdminAppointments />
                    )}
                </main>
            </div>

            {/* Doctor Modal */}
            {isModalOpen && (
                <div className="modal d-block z-1050 modal-backdrop transition-all">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-primary text-white border-0 py-3">
                                <h5 className="modal-title fw-bold">{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setIsModalOpen(false)}></button>
                            </div>
                            <form onSubmit={handleAddEditDoctor}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">FULL NAME</label>
                                            <input type="text" className="form-control" name="name" value={doctorForm.name} onChange={handleDoctorFormChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">EMAIL</label>
                                            <input type="email" className="form-control" name="email" value={doctorForm.email} onChange={handleDoctorFormChange} required />
                                        </div>
                                        {!editingDoctor && (
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">PASSWORD</label>
                                                <input type="password" className="form-control" name="password" value={doctorForm.password} onChange={handleDoctorFormChange} required />
                                            </div>
                                        )}
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">SPECIALIZATION</label>
                                            <input type="text" className="form-control" name="specialization" value={doctorForm.specialization} onChange={handleDoctorFormChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">EXPERIENCE (e.g. 5+ years)</label>
                                            <input type="text" className="form-control" name="experience" value={doctorForm.experience} onChange={handleDoctorFormChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">CONSULTATION FEES (₹)</label>
                                            <input type="number" className="form-control" name="consultationFee" value={doctorForm.consultationFee} onChange={handleDoctorFormChange} required />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-secondary">DESCRIPTION / ABOUT</label>
                                            <textarea className="form-control" name="about" rows="3" value={doctorForm.about} onChange={handleDoctorFormChange} placeholder="Write something about the doctor..."></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold">{editingDoctor ? 'Update Doctor' : 'Save Doctor'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Patient Details Modal */}
            {isPatientModalOpen && selectedPatientFull && (
                <div className="modal d-block z-1050 modal-backdrop transition-all">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-success text-white border-0 py-3">
                                <h5 className="modal-title fw-bold">Patient Details</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setIsPatientModalOpen(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="text-center mb-4">
                                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px', fontSize: '2rem'}}>👤</div>
                                    <h4 className="fw-bold mb-0">{selectedPatientFull.name}</h4>
                                    <p className="text-secondary">{selectedPatientFull.email}</p>
                                </div>
                                <hr className="opacity-10" />
                                <div className="row g-3">
                                    <DetailItem label="Phone" value={selectedPatientFull.phone || 'N/A'} />
                                    <DetailItem label="Age" value={selectedPatientFull.age || 'N/A'} />
                                    <DetailItem label="Gender" value={selectedPatientFull.gender || 'N/A'} />
                                    <DetailItem label="Blood Group" value={selectedPatientFull.bloodGroup || 'N/A'} />
                                    <DetailItem label="Address" value={selectedPatientFull.address || 'N/A'} col="12" />
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button type="button" className="btn btn-dark w-100 rounded-pill py-2 fw-bold" onClick={() => setIsPatientModalOpen(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ label, value, col = "6" }) => (
    <div className={`col-${col}`}>
        <label className="form-label small fw-bold text-secondary mb-0 text-uppercase" style={{fontSize: '0.65rem'}}>{label}</label>
        <p className="mb-0 text-dark fw-medium">{value}</p>
    </div>
);

const SidebarItem = ({ icon, label, onClick, isOpen, active }) => (
    <div 
        onClick={onClick}
        className={`d-flex align-items-center p-3 rounded-3 sidebar-item cursor-pointer ${active ? 'bg-primary text-white shadow-sm' : 'text-secondary'}`}
    >
        <span className="fs-5">{icon}</span>
        {isOpen && <span className="ms-3 fw-medium">{label}</span>}
    </div>
);

const DashboardCard = ({ title, value, icon, gradient, loading }) => (
    <div className="col-md-3">
        <div className="card border-0 shadow-sm p-4 text-white rounded-4 hover-scale cursor-pointer" style={{ background: gradient }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 fw-medium opacity-75">{title}</h6>
                <span className="fs-3 opacity-50">{icon}</span>
            </div>
            <h2 className="mb-0 fw-bold display-6">
                {loading ? <div className="spinner-border spinner-border-sm"><span className="visually-hidden">Loading...</span></div> : value}
            </h2>
        </div>
    </div>
);

const AnalyticsChart = ({ title, type, data, colors }) => (
    <div className="col-md-6">
        <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <h5 className="fw-bold mb-4">{title}</h5>
            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                    {type === 'pie' ? (
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[entry.name] || "#8884d8"} />)}
                            </Pie>
                            <Tooltip /><Legend />
                        </PieChart>
                    ) : (
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
                            <Line type="monotone" dataKey="count" stroke="#0d6efd" strokeWidth={3} />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;
    const [filter, setFilter] = useState('All');
    const [openDropdownId, setOpenDropdownId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:5000/appointments");
            console.log("Backend Response (Admin Appointments):", res.data);
            
            const data = Array.isArray(res.data) ? res.data : [];
            
            // AGGRESSIVE DEDUPLICATION: Use a Set of stringified content as a secondary check
            // this catches both ID duplicates AND identical records with different IDs
            const seen = new Set();
            const uniqueAppointments = data.filter(item => {
                if (!item || !item._id) return false;
                
                // Content fingerprint: Patient + Doctor + Date + Time
                const fingerprint = `${item.patientName}-${item.doctorName}-${item.date}-${item.time}`;
                
                if (seen.has(item._id) || seen.has(fingerprint)) {
                    return false;
                }
                
                seen.add(item._id);
                seen.add(fingerprint);
                return true;
            });

            setAppointments(uniqueAppointments);
        } catch (err) {
            console.error("Error fetching appointments from API:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateAppointmentStatus(id, status);
            fetchAppointments();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        console.log("Deleting appointment ID:", id);
        if (window.confirm("Are you sure you want to delete this appointment?")) {
            try {
                const res = await axios.delete(`http://localhost:5000/appointments/${id}`);
                console.log("Delete API Response:", res);
                
                if (res.status === 200) {
                    alert("Appointment deleted successfully");
                    // Update UI immediately by filtering and then refreshing
                    setAppointments(prev => prev.filter(app => app._id !== id));
                    fetchAppointments();
                } else {
                    alert(`Failed to delete: ${res.data?.message || 'Unknown error'}`);
                }
            } catch (err) {
                console.error("Error deleting appointment:", err);
                const errorMsg = err.response?.data?.message || "Failed to delete appointment";
                alert(errorMsg);
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return 'bg-warning text-dark';
            case 'Approved': return 'bg-success text-white';
            case 'Cancelled': return 'bg-danger text-white';
            case 'Completed': return 'bg-info text-white';
            default: return 'bg-secondary text-white';
        }
    };

    const filteredAppointments = (appointments || []).filter(app => {
        return filter === 'All' || app.status === filter;
    });

    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredAppointments.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredAppointments.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const tabs = ['All', 'Pending', 'Approved', 'Completed', 'Cancelled'];

    return (
        <div className="container-fluid p-0">
            <h2 className="mb-4 fw-bold text-dark">Appointment Management</h2>

            {/* Status Filter Tabs */}
            <div className="d-flex gap-2 mb-4 overflow-auto pb-2 scrollbar-hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setFilter(tab); setCurrentPage(1); }}
                        className={`btn rounded-pill px-4 py-2 fw-semibold transition-all border-0 ${filter === tab
                            ? 'btn-primary shadow-sm'
                            : 'btn-outline-secondary bg-light text-muted'
                        }`}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {tab}
                        {filter === tab && (
                            <span className="ms-2 badge bg-white text-primary rounded-pill">
                                {filteredAppointments.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 px-4 border-0">Patient Name</th>
                                <th className="py-3 px-4 border-0">Doctor Name</th>
                                <th className="py-3 px-4 border-0">Date</th>
                                <th className="py-3 px-4 border-0">Time</th>
                                <th className="py-3 px-4 border-0 text-center">Status</th>
                                <th className="py-3 px-4 border-0 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted">Loading appointments...</td>
                                </tr>
                            ) : currentRecords.length > 0 ? (
                                currentRecords.map((app) => (
                                    <tr key={app._id}>
                                        <td className="px-4 py-3">
                                            <div className="fw-semibold text-dark">{app.patientName || "Unknown"}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted">{app.doctorName || "Unknown"}</td>
                                        <td className="px-4 py-3 text-muted">{app.date}</td>
                                        <td className="px-4 py-3 text-muted">{app.time}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`badge rounded-pill fw-normal px-3 py-2 ${getStatusBadge(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="position-relative action-dropdown-container d-inline-block">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                                                    style={{ minWidth: '110px' }}
                                                    onClick={() => setOpenDropdownId(openDropdownId === app._id ? null : app._id)}
                                                >
                                                    Actions <span style={{ fontSize: '0.8rem' }}>▼</span>
                                                </button>
                                                
                                                {openDropdownId === app._id && (
                                                    <div className="position-absolute end-0 mt-2 bg-white shadow-lg rounded-3 border py-2 text-start" style={{ minWidth: '180px', zIndex: 1050 }}>
                                                        {app.status === 'Approved' && (
                                                            <button
                                                                className="btn btn-link text-decoration-none text-info w-100 text-start px-3 py-2 fw-medium hover-bg-light"
                                                                style={{ fontSize: '0.9rem' }}
                                                                onClick={() => { handleStatusUpdate(app._id, 'Completed'); setOpenDropdownId(null); }}
                                                            >
                                                                ✔ Mark as Completed
                                                            </button>
                                                        )}
                                                        {(app.status === 'Pending' || app.status === 'Approved') && (
                                                            <button
                                                                className="btn btn-link text-decoration-none text-danger w-100 text-start px-3 py-2 fw-medium hover-bg-light"
                                                                style={{ fontSize: '0.9rem' }}
                                                                onClick={() => { handleStatusUpdate(app._id, 'Cancelled'); setOpenDropdownId(null); }}
                                                            >
                                                                ✖ Cancel
                                                            </button>
                                                        )}
                                                        <hr className="my-1 border-secondary opacity-25" />
                                                        <button
                                                            className="btn btn-link text-decoration-none text-danger w-100 text-start px-3 py-2 fw-medium hover-bg-light"
                                                            style={{ fontSize: '0.9rem' }}
                                                            onClick={() => { handleDelete(app._id); setOpenDropdownId(null); }}
                                                        >
                                                            🗑 Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted italic">
                                        No appointments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination UI - Using Doctor-style button refinement */}
            {filteredAppointments.length > recordsPerPage && (
                <div className="d-flex align-items-center justify-content-center gap-2 mt-4">
                    <button 
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`btn btn-sm rounded-pill px-3 transition-all ${currentPage === 1 ? 'btn-light text-muted disabled' : 'btn-outline-primary hover-bg-primary'}`}
                    >
                        Prev
                    </button>
                    
                    <div className="d-flex gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => paginate(i + 1)}
                                className={`btn btn-sm rounded-pill px-3 transition-all ${currentPage === i+1 ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`btn btn-sm rounded-pill px-3 transition-all ${currentPage === totalPages ? 'btn-light text-muted disabled' : 'btn-outline-primary hover-bg-primary'}`}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

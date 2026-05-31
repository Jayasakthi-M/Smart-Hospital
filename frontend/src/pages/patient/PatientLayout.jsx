import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { getUserProfile } from "../../services/authService";
import { getUserAppointments } from "../../services/appointmentService";
import logo from "../../assets/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import { timeAgo } from "../../utils/timeUtils";

const PatientLayout = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [profile, setProfile] = useState(null);
    const user = JSON.parse(localStorage.getItem("user")) || { name: "Patient" };

    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Profile
                const profileRes = await getUserProfile(user.id);
                setProfile(profileRes.data);

                // Fetch Appointments to generate notifications
                const appRes = await getUserAppointments(user.id);
                const appointments = appRes.data || [];

                const notifs = [];
                const today = new Date().toISOString().split('T')[0];

                appointments.forEach(app => {
                    const docName = app.doctorName || "Doctor";
                    // Reminder if today
                    if (app.date === today && app.status !== 'Cancelled') {
                        notifs.push({
                            id: `rem-${app._id}`,
                            message: `Your appointment with ${docName} is today at ${app.time} (Reminder)`,
                            type: 'reminder',
                            createdAt: app.createdAt
                        });
                    }
                    // Status updates
                    if (app.status === 'Approved') {
                        notifs.push({
                            id: `app-${app._id}`,
                            message: `Your appointment with ${docName} has been Approved.`,
                            type: 'approved',
                            createdAt: app.createdAt
                        });
                    } else if (app.status === 'Cancelled') {
                        notifs.push({
                            id: `can-${app._id}`,
                            message: `Your appointment with ${docName} has been Cancelled.`,
                            type: 'cancelled',
                            createdAt: app.createdAt
                        });
                    } else if (app.status === 'Completed') {
                        notifs.push({
                            id: `com-${app._id}`,
                            message: `Your appointment with ${docName} is marked as Completed.`,
                            type: 'completed',
                            createdAt: app.createdAt
                        });
                    }
                });

                // Filter out deleted notifications
                const deletedIds = JSON.parse(localStorage.getItem(`deletedNotifs_${user.id}`) || "[]");
                const finalNotifs = notifs.filter(n => !deletedIds.includes(n.id));

                // Sort notifications by createdAt (newest first)
                finalNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(finalNotifs);

                // Persistent unread count logic
                const seenIds = JSON.parse(localStorage.getItem(`seenNotifs_${user.id}`) || "[]");
                const unread = finalNotifs.filter(n => !seenIds.includes(n.id));
                setUnreadCount(unread.length);

            } catch (err) {
                console.error("Error fetching patient layout data:", err);
            }
        };
        if (user.id) fetchData();
    }, [user.id]);

    const deleteNotification = (id) => {
        const deletedIds = JSON.parse(localStorage.getItem(`deletedNotifs_${user.id}`) || "[]");
        if (!deletedIds.includes(id)) {
            deletedIds.push(id);
            localStorage.setItem(`deletedNotifs_${user.id}`, JSON.stringify(deletedIds));
        }
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        const allIds = notifications.map(n => n.id);
        const deletedIds = JSON.parse(localStorage.getItem(`deletedNotifs_${user.id}`) || "[]");
        const newDeletedIds = [...new Set([...deletedIds, ...allIds])];
        localStorage.setItem(`deletedNotifs_${user.id}`, JSON.stringify(newDeletedIds));
        setNotifications([]);
        setUnreadCount(0);
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="d-flex vh-100 bg-light">
            {/* Left Sidebar */}
            <div
                className={`d-flex flex-column bg-white shadow-sm transition-all ${isSidebarOpen ? "w-250px" : "w-80px"}`}
                style={{ width: isSidebarOpen ? '260px' : '80px', transition: 'width 0.3s', zIndex: 1000 }}
            >
                <div className="d-flex align-items-center justify-content-center py-4 border-bottom h-75px">
                    <img src={logo} alt="Logo" style={{ width: '40px' }} />
                    {isSidebarOpen && <span className="ms-2 fw-bold text-primary h5 mb-0">Smart Hospital</span>}
                </div>

                <div className="flex-grow-1 py-4 d-flex flex-column gap-2 px-3">
                    <SidebarItem icon="🏠" label="Dashboard" to="/patient" isOpen={isSidebarOpen} />
                    <SidebarItem icon="📅" label="Book Appointment" to="/patient/book-appointment" isOpen={isSidebarOpen} />
                    <SidebarItem icon="📂" label="My Appointments" to="/patient/my-appointments" isOpen={isSidebarOpen} />
                    <SidebarItem icon="👨‍⚕️" label="Doctors" to="/patient/doctors" isOpen={isSidebarOpen} />
                    <SidebarItem icon="👤" label="Profile" to="/patient/profile" isOpen={isSidebarOpen} />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                {/* Top Navbar */}
                <header className="bg-white shadow-sm py-3 px-4 d-flex justify-content-between align-items-center z-index-10">
                    <button className="btn btn-light border-0" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <span className="h4">☰</span>
                    </button>

                    <div className="d-flex align-items-center gap-4">
                        <div className="position-relative cursor-pointer" onClick={() => {
                            setShowNotif(!showNotif);
                            if (!showNotif) {
                                setUnreadCount(0);
                                const allIds = notifications.map(n => n.id);
                                localStorage.setItem(`seenNotifs_${user.id}`, JSON.stringify(allIds));
                            }
                        }}>
                            <span className="fs-5">🔔</span>
                            {unreadCount > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                    {unreadCount}
                                </span>
                            )}

                            {/* Notifications Dropdown */}
                            {showNotif && (
                                <div className="position-absolute end-0 mt-3 bg-white shadow-lg rounded-4 border-0 overflow-hidden" style={{ width: '320px', zIndex: 1100, top: '100%' }}>
                                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-primary text-white">
                                        <div className="d-flex align-items-center gap-2">
                                            <h6 className="mb-0 fw-bold">Notifications</h6>
                                            {unreadCount > 0 && <span className="badge bg-white text-primary rounded-pill" style={{ fontSize: '0.7rem' }}>{unreadCount} New</span>}
                                        </div>
                                        {notifications.length > 0 && (
                                            <button
                                                className="btn btn-link text-white text-decoration-none p-0 small"
                                                style={{ fontSize: '0.75rem', opacity: 0.8 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearAll();
                                                }}
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                                        {notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div key={n.id} className="p-3 border-bottom hover-bg-light transition-all cursor-default position-relative group">
                                                    <div className="d-flex gap-3 pr-4">
                                                        <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: '35px', height: '35px', backgroundColor: n.type === 'reminder' ? '#fff3cd' : n.type === 'approved' ? '#d1e7dd' : n.type === 'cancelled' ? '#f8d7da' : '#cfe2ff' }}>
                                                            <span>{n.type === 'reminder' ? '⏰' : n.type === 'approved' ? '✅' : n.type === 'cancelled' ? '❌' : '🏥'}</span>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <p className="small mb-0 text-dark" style={{ paddingRight: '20px' }}>{n.message}</p>
                                                                <button
                                                                    className="btn-close"
                                                                    style={{ fontSize: '0.6rem', position: 'absolute', right: '15px', top: '15px' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteNotification(n.id);
                                                                    }}
                                                                ></button>
                                                            </div>
                                                            <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{timeAgo(n.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-muted">
                                                <p className="mb-0">No new notifications</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate('/patient/profile')}>
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '35px', height: '35px' }}>
                                {profile?.profilePic ? (
                                    <img src={profile.profilePic} alt="Profile" className="w-100 h-100 object-fit-cover" />
                                ) : (
                                    <span>{user.name.charAt(0)}</span>
                                )}
                            </div>
                            <span className="fw-semibold d-none d-md-block">{(profile?.name || user.name)}</span>
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3">
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-grow-1 overflow-auto p-4 bg-light">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon, label, to, isOpen }) => {
    return (
        <Link to={to} className="d-flex align-items-center text-decoration-none text-secondary p-3 rounded-3 hover-bg-light transition-all">
            <span className="fs-5">{icon}</span>
            {isOpen && <span className="ms-3 fw-medium">{label}</span>}
        </Link>
    );
};

export default PatientLayout;

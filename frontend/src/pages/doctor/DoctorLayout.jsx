import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { getUserProfile } from "../../services/authService";
import { getDoctorNotifications, markNotificationAsRead, deleteNotification, clearAllNotifications } from "../../services/notificationService";
import { timeAgo } from "../../utils/timeUtils";
import logo from "../../assets/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";

const DoctorLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [profile, setProfile] = useState(null);
    const user = JSON.parse(localStorage.getItem("user")) || { name: "Doctor" };

    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await getDoctorNotifications(user.id);
            const notifs = res.data || [];
            setNotifications(notifs);
            
            // Count unread (not marked as read)
            const unread = notifs.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    useEffect(() => {
        const fetchNavProfile = async () => {
            try {
                const res = await getUserProfile(user.id);
                setProfile(res.data);
            } catch (err) {
                console.error("Error fetching doctor profile:", err);
            }
        };

        if (user.id) {
            fetchNavProfile();
            fetchNotifications();

            // Real-time updates: Poll every 5 seconds
            const interval = setInterval(fetchNotifications, 5000);
            return () => clearInterval(interval);
        }
    }, [user.id]);

    const handleMarkAllAsRead = async () => {
        try {
            // For now just update UI to hide badge when showing dropdown
            // or we could have a mark-all-read API
            setUnreadCount(0);
            
            // Optionally update each in backend
            const unreadNotifs = notifications.filter(n => !n.isRead);
            for (const n of unreadNotifs) {
                await markNotificationAsRead(n._id);
            }
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    const handleDeleteNotification = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            // Update unread count if it was unread
            const deleted = notifications.find(n => n._id === id);
            if (deleted && !deleted.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    const handleClearAll = async () => {
        try {
            await clearAllNotifications(user.id);
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error("Error clearing notifications:", err);
        }
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
                    <SidebarItem icon="📊" label="Dashboard" to="/doctor" isOpen={isSidebarOpen} currentPath={location.pathname} />
                    <SidebarItem icon="📅" label="Appointments" to="/doctor/appointments" isOpen={isSidebarOpen} currentPath={location.pathname} />
                    <SidebarItem icon="👥" label="Patients" to="/doctor/patients" isOpen={isSidebarOpen} currentPath={location.pathname} />
                    <SidebarItem icon="⏰" label="Schedule / Availability" to="/doctor/schedule" isOpen={isSidebarOpen} currentPath={location.pathname} />
                    <SidebarItem icon="👤" label="Profile" to="/doctor/profile" isOpen={isSidebarOpen} currentPath={location.pathname} />
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
                                handleMarkAllAsRead();
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
                                        </div>
                                        {notifications.length > 0 && (
                                            <button
                                                className="btn btn-link text-white text-decoration-none p-0 small"
                                                style={{ fontSize: '0.75rem', opacity: 0.8 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClearAll();
                                                }}
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                                        {notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div 
                                                    key={n._id} 
                                                    className="p-3 border-bottom hover-bg-light transition-all cursor-default position-relative"
                                                >
                                                    <div className="d-flex gap-3">
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-success-subtle" style={{ width: '35px', height: '35px' }}>
                                                            <span>🏥</span>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <p className="small mb-0 text-dark fw-medium" style={{ paddingRight: '20px' }}>{n.message}</p>
                                                                <button
                                                                    className="btn-close"
                                                                    style={{ fontSize: '0.6rem', position: 'absolute', right: '15px', top: '15px' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteNotification(n._id);
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
                        <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate('/doctor/profile')}>
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

const SidebarItem = ({ icon, label, to, isOpen, currentPath }) => {
    // Check if the current route matches 'to' exactly, or if it's the dashboard home ('/doctor')
    const isActive = currentPath === to || (to === '/doctor' && currentPath === '/doctor/');

    return (
        <Link 
            to={to} 
            className={`d-flex align-items-center text-decoration-none p-3 rounded-3 transition-all ${
                isActive 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-secondary hover-bg-light'
            }`}
        >
            <span className="fs-5">{icon}</span>
            {isOpen && <span className="ms-3 fw-medium">{label}</span>}
        </Link>
    );
};

export default DoctorLayout;

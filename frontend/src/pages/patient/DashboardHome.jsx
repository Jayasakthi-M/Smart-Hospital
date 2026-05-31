import { useState, useEffect } from "react";
import { getUserAppointments } from "../../services/appointmentService";

const DashboardHome = () => {
    const [stats, setStats] = useState({
        upcoming: 0,
        pending: 0,
        approved: 0,
        cancelled: 0,
        lastDate: "Loading..."
    });

    useEffect(() => {
        const fetchStats = async () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                console.log("No user in localStorage");
                return;
            }

            const user = JSON.parse(userStr);
            if (!user || !user.id) {
                console.log("Invalid user object", user);
                return;
            }

            try {
                const res = await fetch(`http://localhost:5000/api/patient/dashboard/${user.id || user._id}`);
                const data = await res.json();
                
                let lastDateStr = "No past visits";
                if (data.lastAppointment) {
                    lastDateStr = new Date(data.lastAppointment).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }

                setStats({ 
                    upcoming: data.upcoming || 0,
                    pending: data.pending || 0,
                    approved: data.approved || 0,
                    cancelled: data.cancelled || 0,
                    lastDate: lastDateStr
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
                setStats(prev => ({ ...prev, lastDate: "No data" }));
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="container-fluid">
            <h2 className="mb-4 fw-bold text-dark">Welcome 👋</h2>

            {/* Summary Cards */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <SummaryCard
                        title="Upcoming Appointments"
                        value={stats.upcoming}
                        icon="🗓️"
                        color="primary" // Blue
                    />
                </div>
                <div className="col-md-3">
                    <SummaryCard
                        title="Pending Approvals"
                        value={stats.pending}
                        icon="⏳"
                        color="warning" // Yellow
                    />
                </div>
                <div className="col-md-3">
                    <SummaryCard
                        title="Approved Appointments"
                        value={stats.approved}
                        icon="✅"
                        color="success" // Green
                    />
                </div>
                <div className="col-md-3">
                    <SummaryCard
                        title="Cancelled Appointments"
                        value={stats.cancelled}
                        icon="❌"
                        color="danger" // Red
                    />
                </div>
            </div>

            {/* Last Appointment Detail */}
            <div className="p-3 bg-white shadow-sm rounded-4 border-0 d-inline-block">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-info bg-opacity-10 p-3 rounded-circle text-info">
                        <span className="fs-5">🕒</span>
                    </div>
                    <div>
                        <p className="text-muted fw-bold text-uppercase small mb-1">Last Appointment</p>
                        <h5 className="fw-bold text-dark mb-0">{stats.lastDate}</h5>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, icon, color }) => {
    return (
        <div className={`card border-0 shadow-sm p-4 rounded-4 h-100 position-relative overflow-hidden`}>
            <div className="d-flex justify-content-between align-items-start">
                <div>
                    <p className="text-muted fw-bold text-uppercase small mb-2">{title}</p>
                    <h3 className={`fw-bold text-${color} mb-0`}>{value}</h3>
                </div>
                <div className={`bg-${color} bg-opacity-10 p-3 rounded-circle text-${color}`}>
                    <span className="fs-4">{icon}</span>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;


import React, { useState, useEffect } from 'react';
import { getDoctorAppointments } from '../../services/appointmentService';

const DoctorDashboardHome = () => {
    const [stats, setStats] = useState({
        todayAppointments: 0,
        totalPatients: 0,
        pendingReviews: 0
    });
    const [loading, setLoading] = useState(true);

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : { name: "Doctor" };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const doctorId = user.id || user._id;
                console.log("Dashboard: Fetching for doctor ID:", doctorId);
                const res = await getDoctorAppointments(doctorId);
                console.log("Dashboard: API Response:", res.data);
                const appointments = Array.isArray(res.data) ? res.data : [];

                const today = new Date().toISOString().split('T')[0];
                const todayApps = appointments.filter(app => app.date === today).length;

                const uniquePatients = new Set(
                    appointments.map(app => (app.patientId || app.userId)?.toString()).filter(Boolean)
                ).size;

                setStats({
                    todayAppointments: todayApps,
                    totalPatients: uniquePatients,
                    pendingReviews: appointments.filter(app => app.status === 'Pending').length,
                    totalAppointments: appointments.length
                });
            } catch (error) {
                console.error("Dashboard: Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user.id, user._id]);

    return (
        <div className="bg-light w-100 h-100 p-2" style={{ borderRadius: '12px' }}>
            <div className="mb-4">
                <h2 className="fw-bold text-dark">Welcome back, {user.name}!</h2>
                <p className="text-secondary">Here's what's happening today...</p>
            </div>

            <div className="row g-4 mt-2">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-4 text-white rounded-4" style={{ background: 'linear-gradient(135deg, #4e73df 0%, #224abe 100%)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0 fw-medium opacity-75">Today's Appts</h6>
                            <span className="fs-3 opacity-50">📅</span>
                        </div>
                        <h2 className="mb-0 fw-bold display-6">{loading ? '...' : stats.todayAppointments}</h2>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-4 text-white rounded-4" style={{ background: 'linear-gradient(135deg, #1cc88a 0%, #13855c 100%)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0 fw-medium opacity-75">Total Patients</h6>
                            <span className="fs-3 opacity-50">👥</span>
                        </div>
                        <h2 className="mb-0 fw-bold display-6">{loading ? '...' : stats.totalPatients}</h2>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-4 text-white rounded-4" style={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0 fw-medium opacity-75">Pending Reviews</h6>
                            <span className="fs-3 opacity-50">⏳</span>
                        </div>
                        <h2 className="mb-0 fw-bold display-6">{loading ? '...' : stats.pendingReviews}</h2>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-4 text-white rounded-4" style={{ background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0 fw-medium opacity-75">All Appts</h6>
                            <span className="fs-3 opacity-50">📋</span>
                        </div>
                        <h2 className="mb-0 fw-bold display-6">{loading ? '...' : (stats.totalAppointments || 0)}</h2>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboardHome;

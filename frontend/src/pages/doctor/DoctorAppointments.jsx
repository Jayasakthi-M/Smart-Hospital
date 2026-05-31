import React, { useState, useEffect } from 'react';
import { getDoctorAppointments, updateAppointmentStatus, deleteAppointment } from '../../services/appointmentService';

const DoctorAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : { name: "Doctor" };

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
            const doctorId = user.id || user._id;
            if (!doctorId) return;
            
            setLoading(true);
            const res = await getDoctorAppointments(doctorId);
            setAppointments(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user.id, user._id]);

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateAppointmentStatus(id, status);
            alert(`Appointment ${status} successfully`);
            fetchAppointments(); // Refresh list
        } catch (error) {
            console.error(`Error updating status to ${status}:`, error);
            // Show exact error message if available
            const errorMsg = error.response?.data?.message || error.message || "Unknown error";
            alert(`Failed to ${status} appointment: ${errorMsg}`);
        }
    };

    const handleDelete = async (id) => {
        console.log("Attempting to delete appointment with ID:", id);
        if (window.confirm("Are you sure you want to delete this appointment?")) {
            try {
                await deleteAppointment(id);
                alert("Appointment deleted successfully");
                fetchAppointments(); // Refresh list
            } catch (error) {
                console.error("Error deleting appointment:", error);
                const errorMsg = error.response?.data?.message || error.message || "Unknown error";
                alert(`Failed to delete appointment: ${errorMsg}`);
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

    const filteredAppointments = filter === 'All'
        ? appointments
        : appointments.filter(app => app.status === filter);

    const tabs = ['All', 'Pending', 'Approved', 'Completed', 'Cancelled'];

    return (
        <div className="container-fluid">
            <h2 className="mb-4 fw-bold">My Appointments</h2>

            {/* Status Filter Tabs */}
            <div className="d-flex gap-2 mb-4 overflow-auto pb-2 scrollbar-hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
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

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 px-4 border-0">Patient Name</th>
                                <th className="py-3 px-4 border-0">Date</th>
                                <th className="py-3 px-4 border-0">Time</th>
                                <th className="py-3 px-4 border-0">Status</th>
                                <th className="py-3 px-4 border-0 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-muted">Loading appointments...</td>
                                </tr>
                            ) : filteredAppointments.length > 0 ? (
                                filteredAppointments.map(app => (
                                    <tr key={app._id}>
                                        <td className="px-4 py-3">
                                            <div className="fw-semibold text-dark">{app.patientName || app.userName || app.userId}</div>
                                        </td>
                                        <td className="px-4 py-3">{app.date}</td>
                                        <td className="px-4 py-3">{app.time}</td>
                                        <td className="px-4 py-3">
                                            <span className={`badge rounded-pill fw-normal px-3 py-2 ${getStatusBadge(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="position-relative action-dropdown-container d-inline-block">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                                                    style={{ minWidth: '110px' }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setOpenDropdownId(openDropdownId === app._id ? null : app._id);
                                                    }}
                                                >
                                                    Actions <span style={{ fontSize: '0.8rem' }}>▼</span>
                                                </button>
                                                
                                                {openDropdownId === app._id && (
                                                    <div className="position-absolute end-0 mt-2 bg-white shadow-lg rounded-3 border py-2 text-start" style={{ minWidth: '180px', zIndex: 1050 }}>
                                                        {app.status === 'Pending' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-link text-decoration-none text-success w-100 text-start px-3 py-2 fw-medium hover-bg-light"
                                                                    style={{ fontSize: '0.9rem' }}
                                                                    onClick={() => {
                                                                        handleStatusUpdate(app._id, 'Approved');
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                >
                                                                    ✔ Approve
                                                                </button>
                                                                <button
                                                                    className="btn btn-link text-decoration-none text-danger w-100 text-start px-3 py-2 fw-medium hover-bg-light"
                                                                    style={{ fontSize: '0.9rem' }}
                                                                    onClick={() => {
                                                                        handleStatusUpdate(app._id, 'Cancelled');
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                >
                                                                    ✖ Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {app.status === 'Approved' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-link text-decoration-none text-info w-100 text-start px-3 py-2 fw-medium hover-bg-light"
                                                                    style={{ fontSize: '0.9rem' }}
                                                                    onClick={() => {
                                                                        handleStatusUpdate(app._id, 'Completed');
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                >
                                                                    ✔ Mark as Completed
                                                                </button>
                                                                <button
                                                                    className="btn btn-link text-decoration-none text-warning w-100 text-start px-3 py-2 fw-medium hover-bg-light"
                                                                    style={{ fontSize: '0.9rem' }}
                                                                    onClick={() => {
                                                                        handleStatusUpdate(app._id, 'Cancelled');
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                >
                                                                    ✖ Cancel
                                                                </button>
                                                            </>
                                                        )}
                                                        
                                                        {/* Optional separator if actions are present above */}
                                                        {(app.status === 'Pending' || app.status === 'Approved') && (
                                                            <hr className="my-1 border-secondary opacity-25" />
                                                        )}
                                                        
                                                        <button
                                                            className="btn btn-link text-decoration-none text-danger w-100 text-start px-3 py-2 fw-medium hover-bg-light"
                                                            style={{ fontSize: '0.9rem' }}
                                                            onClick={() => {
                                                                handleDelete(app._id);
                                                                setOpenDropdownId(null);
                                                            }}
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
                                    <td colSpan="5" className="text-center py-5 text-muted">
                                        No {filter !== 'All' ? filter.toLowerCase() : ''} appointments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DoctorAppointments;

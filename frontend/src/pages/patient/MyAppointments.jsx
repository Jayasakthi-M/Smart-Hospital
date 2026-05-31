import { useState, useEffect } from "react";
import { getUserAppointments, cancelAppointment } from "../../services/appointmentService";

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        if (user && user.id) {
            fetchAppointments();
        } else {
            console.log("MyAppointments: No valid user id found", user);
            setLoading(false);
        }
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await getUserAppointments(user.id);
            setAppointments(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            try {
                await cancelAppointment(id);
                // Refresh list
                fetchAppointments();
            } catch (error) {
                alert("Failed to cancel appointment");
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return 'bg-warning text-dark';
            case 'Approved': return 'bg-success text-white';
            case 'Cancelled': return 'bg-danger text-white';
            default: return 'bg-secondary text-white';
        }
    };

    const filteredAppointments = appointments.filter(app => {
        const docName = app.doctorName || app.doctor || "";
        return docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (app.department && app.department.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredAppointments.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredAppointments.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">My Appointments</h2>
                <div className="search-group" style={{ width: '300px' }}>
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                            🔍
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0 rounded-end-pill ps-0"
                            placeholder="Search appointments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 px-4 border-0">Doctor</th>
                                <th className="py-3 px-4 border-0">Date</th>
                                <th className="py-3 px-4 border-0">Time</th>
                                <th className="py-3 px-4 border-0">Status</th>
                                <th className="py-3 px-4 border-0 text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-muted">Loading appointments...</td>
                                </tr>
                            ) : currentRecords.length > 0 ? (
                                currentRecords.map(app => (
                                    <tr key={app._id}>
                                        <td className="px-4 py-3 fw-bold">{app.doctorName || app.doctor}</td>
                                        <td className="px-4 py-3">{app.date}</td>
                                        <td className="px-4 py-3">{app.time}</td>
                                        <td className="px-4 py-3">
                                            <span className={`badge rounded-pill fw-normal px-3 py-2 ${getStatusBadge(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            {app.status === 'Pending' && (
                                                <button
                                                    className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                                    onClick={() => handleCancel(app._id)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-muted">No appointments found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {filteredAppointments.length > recordsPerPage && (
                <div className="d-flex justify-content-center align-items-center mt-4 gap-2">
                    <button
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        Prev
                    </button>

                    <span className="mx-2 text-muted fw-bold small">
                        Page {currentPage} of {totalPages}
                    </span>

                    <div className="d-flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`btn btn-sm rounded-circle ${currentPage === page ? 'btn-primary' : 'btn-outline-primary'}`}
                                style={{ width: '32px', height: '32px', padding: '0' }}
                                onClick={() => paginate(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyAppointments;

import React, { useState, useEffect } from 'react';
import { getDoctorPatients, updateAppointmentStatus } from '../../services/appointmentService';

const DoctorPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : { name: "Doctor" };

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const doctorId = user.id || user._id;
            console.log("Fetching approved patients for doc ID:", doctorId);
            const res = await getDoctorPatients(doctorId);
            console.log("Patients API Response:", res.data);
            setPatients(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching doctor patients:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [user.id, user._id]);

    const handleComplete = async (appointmentId) => {
        try {
            if (!appointmentId) {
                alert("Missing Appointment ID");
                return;
            }
            console.log("MARKING AS COMPLETED - ID:", appointmentId);
            const res = await updateAppointmentStatus(appointmentId, 'Completed');
            console.log("RESPONSE FROM SERVER:", res.data);
            alert('Patient record marked as Completed');
            fetchPatients(); // Refresh list
        } catch (error) {
            console.error("Error updating patient status:", error);
            const errorMsg = error.response?.data?.message || error.message || "Unknown error";
            alert(`Failed to update status: ${errorMsg}`);
        }
    };

    return (
        <div className="container-fluid">
            <h2 className="mb-4 fw-bold">My Patients</h2>
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 px-4 border-0">Patient Name</th>
                                <th className="py-3 px-4 border-0">Age</th>
                                <th className="py-3 px-4 border-0">Phone No</th>
                                <th className="py-3 px-4 border-0">Address</th>
                                <th className="py-3 px-4 border-0">Appt Date</th>
                                <th className="py-3 px-4 border-0">Time</th>
                                <th className="py-3 px-4 border-0">Status</th>
                                <th className="py-3 px-4 border-0 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5 text-muted">
                                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                        Fetching patient records...
                                    </td>
                                </tr>
                            ) : patients.length > 0 ? (
                                patients.map((patient, index) => (
                                    <tr key={patient.appointmentId || index}>
                                        <td className="px-4 py-3 fw-semibold text-dark">{patient.patientName}</td>
                                        <td className="px-4 py-3">{patient.age || 'N/A'}</td>
                                        <td className="px-4 py-3 text-muted">{patient.phone || 'N/A'}</td>
                                        <td className="px-4 py-3 text-muted">
                                            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={patient.address}>
                                                {patient.address || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{patient.date}</td>
                                        <td className="px-4 py-3">{patient.time}</td>
                                        <td className="px-4 py-3">
                                            <span className={`badge px-3 py-2 rounded-pill fw-normal ${patient.status === 'Completed' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'
                                                }`}>
                                                {patient.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {patient.status === 'Approved' ? (
                                                <button
                                                    className="btn btn-sm btn-success rounded-pill px-3"
                                                    onClick={() => handleComplete(patient.appointmentId)}
                                                >
                                                    Completed
                                                </button>
                                            ) : (
                                                <span className="text-muted small">Checked</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-5 text-muted">
                                        <div className="mb-2">📋</div>
                                        No approved patient records found.
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

export default DoctorPatients;

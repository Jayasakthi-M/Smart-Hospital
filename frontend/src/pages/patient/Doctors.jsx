import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllDoctors } from "../../services/authService";

const Doctors = () => {
    const navigate = useNavigate();
    const [allDoctors, setAllDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await getAllDoctors();
                setAllDoctors(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Error fetching doctors:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    const filteredDoctors = allDoctors.filter(doc =>
        (doc.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.specialization || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid pb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Our Doctors</h2>
                <div className="col-md-4">
                    <div className="input-group shadow-sm rounded-pill overflow-hidden border">
                        <span className="input-group-text bg-white border-0 ps-3">🔍</span>
                        <input
                            type="text"
                            className="form-control border-0 py-2 ps-1"
                            placeholder="Search by name or specialty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {loading ? (
                    <div className="col-12 text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-2 text-muted">Loading doctors...</p>
                    </div>
                ) : filteredDoctors.length > 0 ? (
                    filteredDoctors.map(doctor => (
                        <div key={doctor._id} className="col-sm-6 col-md-4 col-lg-3">
                            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden doctor-card transition-all hover-shadow">
                                <div className="position-relative">
                                    <div className="bg-primary bg-opacity-10 d-flex align-items-center justify-content-center py-4" style={{ height: '200px' }}>
                                        <span style={{ fontSize: '80px' }}>👨‍⚕️</span>
                                    </div>
                                    <span className={`position-absolute top-0 end-0 m-3 badge rounded-pill ${doctor.isAvailable !== false ? 'bg-success' : 'bg-secondary'}`}>
                                        {doctor.isAvailable !== false ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>

                                <div className="card-body p-4">
                                    <h5 className="fw-bold mb-1">{doctor.name}</h5>
                                    <p className="text-primary small fw-semibold mb-3">{doctor.specialization || 'Doctor'}</p>

                                    <div className="d-flex align-items-center gap-2 mb-3 text-muted small">
                                        <span className="bg-light px-2 py-1 rounded">🎓 {doctor.experience || 'N/A'} Exp </span>
                                        <span className="bg-light px-2 py-1 rounded">💰 ₹{doctor.consultationFee || 'N/A'}</span>
                                    </div>

                                    <p className="card-text text-muted small mb-4" style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {doctor.about || `Experienced ${doctor.specialization || 'doctor'} dedicated to patient care.`}
                                    </p>

                                    <button
                                        className="btn btn-outline-primary w-100 rounded-pill fw-bold"
                                        onClick={() => navigate('/patient/book-appointment')}
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <div className="text-muted fs-4">No doctors found matching your search.</div>
                    </div>
                )}
            </div>

            <style>
                {`
                .doctor-card:hover {
                    transform: translateY(-8px);
                }
                .hover-shadow:hover {
                    box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important;
                }
                `}
            </style>
        </div>
    );
};

export default Doctors;


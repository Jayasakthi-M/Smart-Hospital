import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { bookAppointment, getDoctorAppointments, getUserAppointments } from "../../services/appointmentService";
import { getUserProfile, getAllDoctors } from "../../services/authService";

const BookAppointment = () => {
    // Departments
    const departments = [
        { id: 'gen', name: 'General Physician', icon: '🩺' },
        { id: 'cardio', name: 'Cardiology', icon: '❤️' },
        { id: 'derma', name: 'Dermatology', icon: '🧴' },
        { id: 'neuro', name: 'Neurology', icon: '🧠' },
        { id: 'pedio', name: 'Pediatrics', icon: '👶' }
    ];

    const [doctorsData, setDoctorsData] = useState({});
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [selectedDept, setSelectedDept] = useState(departments[0].id);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [bookedByDoctor, setBookedByDoctor] = useState([]);
    const [bookedByPatient, setBookedByPatient] = useState([]);
    const [doctorSchedule, setDoctorSchedule] = useState(null);
    const navigate = useNavigate();

    // Fetch All Doctors and Group them
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await getAllDoctors();
                const allDocs = Array.isArray(res.data) ? res.data : [];
                
                const grouped = {
                    'gen': [],
                    'cardio': [],
                    'derma': [],
                    'neuro': [],
                    'pedio': []
                };

                const mapping = {
                    'gen': ['general', 'physician', 'internal'],
                    'cardio': ['cardio', 'heart'],
                    'derma': ['derm', 'skin'],
                    'neuro': ['neuro', 'brain'],
                    'pedio': ['pediat', 'child']
                };

                allDocs.forEach(doc => {
                    const spec = (doc.specialization || "").toLowerCase();
                    
                    let deptId = 'gen';
                    for (const [key, keywords] of Object.entries(mapping)) {
                        if (keywords.some(k => spec.includes(k))) {
                            deptId = key;
                            break;
                        }
                    }
                    
                    grouped[deptId].push({
                        id: doc._id,
                        name: doc.name,
                        spec: doc.specialization || "Doctor",
                        exp: doc.experience || "N/A",
                        fee: doc.consultationFee ? `₹${doc.consultationFee}` : "N/A",
                        available: doc.isAvailable ?? true,
                        about: doc.about || `Experienced ${doc.specialization || 'doctor'} dedicated to patient care.`
                    });
                });
                setDoctorsData(grouped);
            } catch (err) {
                console.error("Error fetching doctors:", err);
            } finally {
                setLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, []);

    // Fetch Schedule for selected doctor
    useEffect(() => {
        const fetchSchedule = async () => {
            if (selectedDoctor && selectedDoctor.id) {
                try {
                    const res = await getUserProfile(selectedDoctor.id);
                    setDoctorSchedule(res.data);
                } catch (err) {
                    console.error("Error fetching doctor schedule:", err);
                    setDoctorSchedule(null);
                }
            } else {
                setDoctorSchedule(null);
            }
        };
        fetchSchedule();
    }, [selectedDoctor]);

    useEffect(() => {
        const fetchBookedSlots = async () => {
            if (!selectedDoctor || !selectedDate) return;

            const userStr = localStorage.getItem("user");
            const user = userStr ? JSON.parse(userStr) : null;

            try {
                // Fetch doctor's appointments
                const docRes = await getDoctorAppointments(selectedDoctor.id);
                const docAppointments = Array.isArray(docRes.data) ? docRes.data : [];
                const docBooked = docAppointments
                    .filter(app => app.date === selectedDate && (app.status === 'Pending' || app.status === 'Approved'))
                    .map(app => app.time);
                setBookedByDoctor(docBooked);

                // Fetch patient's own appointments for that date
                if (user?.id || user?._id) {
                    const userId = user.id || user._id;
                    const patRes = await getUserAppointments(userId);
                    const patAppointments = Array.isArray(patRes.data) ? patRes.data : [];
                    const patBooked = patAppointments
                        .filter(app => app.date === selectedDate && (app.status === 'Pending' || app.status === 'Approved'))
                        .map(app => app.time);
                    setBookedByPatient(patBooked);
                }
            } catch (err) {
                console.error("Error fetching booked slots:", err);
            }
        };

        fetchBookedSlots();
    }, [selectedDoctor, selectedDate]);

    // Default Slots Fallback
    const timeSlots = ["09:00 AM", "09:30 AM", "10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM"];


    const handleConfirm = async () => {
        if (!selectedDoctor || !selectedDate || !selectedSlot) {
            alert("Please complete all selections.");
            return;
        }

        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user || (!user.id && !user._id)) {
            alert("Please login again to book appointments.");
            navigate("/login");
            return;
        }

        try {
            const appointmentData = {
                patientId: user.id || user._id,
                patientName: user.name,
                doctorId: selectedDoctor.id,
                date: selectedDate,
                time: selectedSlot,
                status: "Pending"
            };

            await bookAppointment(appointmentData);
            alert(`Appointment Confirmed with ${selectedDoctor.name} on ${selectedDate} at ${selectedSlot}`);
            navigate("/patient/my-appointments");
        } catch (error) {
            console.error("Booking error:", error);
            alert(error.response?.data?.message || "Failed to book appointment. Please try again.");
        }
    };

    return (
        <div className="container-fluid pb-5">
            <h2 className="mb-4 fw-bold">Book an Appointment</h2>

            {/* Step 1: Select Department */}
            <div className="mb-5">
                <h5 className="mb-3 text-secondary">Step 1: Select Department</h5>
                <div className="d-flex gap-3 overflow-auto pb-2">
                    {departments.map(dept => (
                        <div
                            key={dept.id}
                            onClick={() => { setSelectedDept(dept.id); setSelectedDoctor(null); }}
                            className={`card p-3 shadow-sm border-0 cursor-pointer text-center min-w-150px transition-all ${selectedDept === dept.id ? 'bg-primary text-white scale-105' : 'bg-white hover-shadow'}`}
                            style={{ minWidth: '160px', borderRadius: '15px' }}
                        >
                            <span className="fs-1 d-block mb-2">{dept.icon}</span>
                            <span className="fw-bold small">{dept.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 2: Doctor List */}
            <div className="mb-5">
                <h5 className="mb-3 text-secondary">Step 2: Select Doctor</h5>
                <div className="row g-4">
                    {loadingDoctors ? (
                        <div className="col-12 text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted">Searching for available doctors...</p>
                        </div>
                    ) : doctorsData[selectedDept]?.length > 0 ? (
                        doctorsData[selectedDept].map(doctor => (
                            <div key={doctor.id || doctor.name} className="col-md-6 col-lg-4">
                                <div className={`card border-0 shadow-sm rounded-4 overflow-hidden ${selectedDoctor?.id === doctor.id ? 'ring-2 ring-primary' : ''}`}>
                                    <div className="card-body p-4">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="bg-light rounded-circle p-3 me-3">
                                                <span className="fs-3">👨‍⚕️</span>
                                            </div>
                                            <div>
                                                <h5 className="fw-bold mb-0">{doctor.name}</h5>
                                                <p className="text-muted small mb-0">{doctor.spec}</p>
                                                {!doctor.available && (
                                                    <p className="text-danger small mb-0 fw-bold mt-1">🔴 Currently Unavailable</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3 small">
                                            <span className="bg-light px-2 py-1 rounded text-dark">Exp: {doctor.exp}</span>
                                            <span className="fw-bold text-primary">{doctor.fee}</span>
                                        </div>
                                        <button
                                            className={`btn w-100 fw-bold ${selectedDoctor?.id === doctor.id ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setSelectedDoctor(selectedDoctor?.id === doctor.id ? null : doctor)}
                                        >
                                            {selectedDoctor?.id === doctor.id ? 'Selected' : 'View Details'}
                                        </button>
                                    </div>

                                    {/* Step 3: Doctor Details (Expandable) */}
                                    {selectedDoctor?.id === doctor.id && (
                                        <div className="bg-light p-4 border-top animate-slide-down">
                                            <h6 className="fw-bold">About Dr. {doctor.name.split(' ').pop()}</h6>
                                            <p className="small text-muted mb-3">{doctor.about}</p>

                                            {!doctor.available ? (
                                                <div className="alert alert-danger w-100 p-3 mt-3 mb-2 shadow-sm rounded-3">
                                                    <h6 className="fw-bold mb-1">
                                                        {doctor.name} is currently unavailable.
                                                    </h6>
                                                    <span className="small">Please choose another doctor or check again later.</span>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Step 4: Slot Selection */}
                                                    <h6 className="fw-bold mt-4 mb-2">Select Date & Time</h6>
                                                    <input
                                                        type="date"
                                                        className="form-control mb-3"
                                                        min={new Date().toLocaleDateString('en-CA')}
                                                        onChange={(e) => setSelectedDate(e.target.value)}
                                                    />

                                                    <div className="d-flex flex-wrap gap-2 mb-4">
                                                        {selectedDate && doctorSchedule?.leaves?.includes(selectedDate) ? (
                                                            <div className="alert alert-danger w-100 py-2 small fw-bold mb-0">
                                                                ⚠️ Dr. {selectedDoctor.name.split(' ').pop()} is on leave on this date.
                                                            </div>
                                                        ) : selectedDate && doctorSchedule?.workingDays?.length > 0 && !doctorSchedule.workingDays.includes(new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })) ? (
                                                            <div className="alert alert-warning w-100 py-2 small fw-bold mb-0">
                                                                ⚠️ Dr. {selectedDoctor.name.split(' ').pop()} does not work on this day ({new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}).
                                                            </div>
                                                        ) : (doctorSchedule?.selectedSlots && doctorSchedule.selectedSlots.length > 0 ? doctorSchedule.selectedSlots : timeSlots).map((slot, idx) => {
                                                            const isBookedDoc = bookedByDoctor.includes(slot);
                                                            const isBookedPat = bookedByPatient.includes(slot);
                                                            const isUnavailable = isBookedDoc || isBookedPat;

                                                            return (
                                                                <button
                                                                    key={idx}
                                                                    disabled={isUnavailable || !selectedDate}
                                                                    className={`btn btn-sm ${selectedSlot === slot ? 'btn-success text-white' : isUnavailable ? 'btn-light text-muted' : 'btn-outline-secondary'}`}
                                                                    onClick={() => setSelectedSlot(slot)}
                                                                    title={isBookedDoc ? "Doctor is busy" : isBookedPat ? "You have another appointment" : ""}
                                                                >
                                                                    {slot}
                                                                    {isUnavailable && <span className="ms-1 small">🚫</span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <button 
                                                        className="btn btn-dark w-100 py-2 rounded-3" 
                                                        onClick={handleConfirm}
                                                        disabled={!selectedSlot || doctorSchedule?.leaves?.includes(selectedDate)}
                                                    >
                                                        Confirm Appointment
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted">No doctors available in this department.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookAppointment;

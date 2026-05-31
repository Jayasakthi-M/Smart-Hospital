import { Link } from "react-router-dom";
import hospitalBg from "../assets/hospital_bg.png";
import doctors from "../assets/doctors.png";
import logo from "../assets/logo.png";

function Home() {
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="w-100 text-white"
            style={{
                minHeight: '100vh',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,20,60,0.9)), url(${hospitalBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                overflowX: 'hidden'
            }}
        >
            {/* Navbar */}
            <nav className="d-flex justify-content-between align-items-center p-4 w-100 position-fixed top-0 start-0"
                style={{ zIndex: 100, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
                {/* Left Logo */}
                <div className="d-flex align-items-center">
                    <img src={logo} alt="Logo" style={{ width: '40px', height: '40px' }} className="me-2" />
                    <span className="h4 mb-0 fw-bold" style={{ letterSpacing: '1px' }}>Smart Hospital</span>
                </div>

                {/* Right Links */}
                <div className="d-flex gap-4">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn btn-link text-white text-decoration-none fw-bold" style={{ fontSize: '1.1rem' }}>Home</button>
                    <button onClick={() => scrollToSection('about')} className="btn btn-link text-white text-decoration-none fw-bold" style={{ fontSize: '1.1rem' }}>About</button>
                    <button onClick={() => scrollToSection('contact')} className="btn btn-link text-white text-decoration-none fw-bold" style={{ fontSize: '1.1rem' }}>Contact</button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="container d-flex flex-column align-items-center justify-content-center text-center"
                style={{ minHeight: '100vh', paddingTop: '80px' }}>
                <h1 className="display-3 fw-bold mb-2">Smart Hospital</h1>
                <p className="h4 mb-2 text-light opacity-90">Appointment Management System</p>
                <p className="lead mb-4 text-info fst-italic">A smarter way to manage hospital appointments efficiently</p>

                {/* Doctors Image */}
                <div className="mb-5 position-relative d-inline-block">
                    <div className="position-absolute align-items-center justify-content-center rounded-circle bg-primary bg-opacity-25"
                        style={{ width: '350px', height: '350px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) blur(50px)', zIndex: -1 }}>
                    </div>
                    <img
                        src={doctors}
                        alt="Doctors Team"
                        className="img-fluid floating-img"
                        style={{
                            maxHeight: '380px',
                            borderRadius: '20px',
                            boxShadow: '0 10px 30px rgba(255, 255, 255, 0.15)'
                        }}
                    />
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-center gap-3 mb-5">
                    <Link to="/login" className="btn btn-primary btn-lg px-5 fw-bold shadow-lg rounded-pill btn-glow"
                        style={{ background: 'linear-gradient(45deg, #007bff, #0056b3)', border: 'none' }}>
                        Login
                    </Link>
                    <Link to="/register" className="btn btn-outline-light btn-lg px-5 fw-bold shadow-lg rounded-pill btn-glow-white"
                        style={{ backdropFilter: 'blur(5px)' }}>
                        Register
                    </Link>
                </div>
            </div>

            {/* About Us Section */}
            <div id="about" className="container py-5 my-5 text-center bg-white text-dark rounded-4 shadow-lg"
                style={{ maxWidth: '900px', opacity: 0.95 }}>
                <h2 className="display-5 fw-bold mb-4 text-primary">About Us</h2>
                <div className="d-flex justify-content-center">
                    <div style={{ width: '80px', height: '4px', background: '#007bff', borderRadius: '2px' }} className="mb-4"></div>
                </div>
                <p className="lead fs-4 px-4">
                    Smart Hospital Appointment Management System is designed to reduce waiting time and simplify appointment booking using a secure, role-based approach.
                </p>
                <div className="row mt-5 g-4">
                    <div className="col-md-4">
                        <div className="p-3 border rounded-3 bg-light h-100">
                            <h4 className="fw-bold text-secondary">Simple</h4>
                            <p>Easy 3-step booking process</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="p-3 border rounded-3 bg-light h-100">
                            <h4 className="fw-bold text-secondary">Secure</h4>
                            <p>Role-based access control</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="p-3 border rounded-3 bg-light h-100">
                            <h4 className="fw-bold text-secondary">Fast</h4>
                            <p>Real-time updates</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Section */}
            <div id="contact" className="w-100 py-5 mt-5" style={{ background: 'rgba(0,0,0,0.8)' }}>
                <div className="container text-center">
                    <h2 className="display-5 fw-bold mb-5 text-info">Contact Us</h2>

                    <div className="row justify-content-center gap-4 text-start d-inline-flex flex-wrap">
                        <div className="col-auto d-flex align-items-center gap-3 bg-white bg-opacity-10 p-4 rounded-4 border border-secondary border-opacity-25">
                            <div className="fs-1">📧</div>
                            <div>
                                <h5 className="mb-1 text-light opacity-75">Email</h5>
                                <p className="mb-0 fs-5 fw-bold">smarthospital@gamil.com</p>
                            </div>
                        </div>

                        <div className="col-auto d-flex align-items-center gap-3 bg-white bg-opacity-10 p-4 rounded-4 border border-secondary border-opacity-25">
                            <div className="fs-1">📞</div>
                            <div>
                                <h5 className="mb-1 text-light opacity-75">Phone</h5>
                                <p className="mb-0 fs-5 fw-bold">1234567890</p>
                            </div>
                        </div>

                        <div className="col-auto d-flex align-items-center gap-3 bg-white bg-opacity-10 p-4 rounded-4 border border-secondary border-opacity-25">
                            <div className="fs-1">📍</div>
                            <div>
                                <h5 className="mb-1 text-light opacity-75">Location</h5>
                                <p className="mb-0 fs-5 fw-bold">Trichy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="w-100 text-center py-4 bg-black text-white-50 small mt-auto">
                &copy; 2026 Smart Hospital Management System
            </footer>
        </div>
    );
}

export default Home;


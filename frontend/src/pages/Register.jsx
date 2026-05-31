import { useState } from "react";
import { registerUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "patient" });
  const navigate = useNavigate();

  // Reuse the floating background animation from Login to maintain theme
  const [backgroundLogos] = useState(() =>
    [...Array(20)].map((_, i) => ({
      id: i,
      size: Math.random() * 30 + 20,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 4
    }))
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(form);
      alert(res.data.message);
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative py-5"
      style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>

      {/* Top Left Logo - Consistent with Login */}
      <div className="position-absolute top-0 start-0 p-4 d-flex align-items-center" style={{ zIndex: 10 }}>
        <Link to="/" className="d-flex align-items-center text-decoration-none">
          <img src={logo} alt="Logo" style={{ width: '40px' }} className="me-2" />
          <span className="h4 mb-0 text-white fw-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Smart Hospital</span>
        </Link>
      </div>

      {/* Background Floating Logos */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0, pointerEvents: 'none' }}>
        {backgroundLogos.map((item) => (
          <img
            key={item.id}
            src={logo}
            alt=""
            className="position-absolute floating-img"
            style={{
              width: `${item.size}px`,
              left: `${item.left}%`,
              top: `${item.top}%`,
              opacity: '0.15',
              filter: 'brightness(0) invert(1)',
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`
            }}
          />
        ))}
      </div>

      {/* Register Card */}
      <div className="card p-4 p-md-5 shadow-lg border-0 rounded-4 position-relative" style={{ maxWidth: '420px', width: '100%', zIndex: 1 }}>
        <h2 className="text-center fw-bold mb-2">Create Account</h2>
        <p className="text-center text-muted mb-4">Register to Smart Hospital</p>

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="mb-3">
            <select
              className="form-select form-select-lg bg-white"
              style={{ borderRadius: '10px', border: '1px solid #ced4da', cursor: 'pointer' }}
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          {/* Name Field */}
          <div className="mb-3">
            <input
              className="form-control form-control-lg bg-white"
              style={{ borderRadius: '10px', border: '1px solid #ced4da' }}
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email Field */}
          <div className="mb-3">
            <input
              className="form-control form-control-lg bg-white"
              style={{ borderRadius: '10px', border: '1px solid #ced4da' }}
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <input
              className="form-control form-control-lg bg-white"
              style={{ borderRadius: '10px', border: '1px solid #ced4da' }}
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn btn-primary w-100 btn-lg mb-3 shadow-sm fw-bold btn-glow"
            style={{ background: 'linear-gradient(90deg, #007bff, #0056b3)', border: 'none', borderRadius: '10px' }}>
            Register
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center mt-2">
          <p className="mb-3 text-muted small">
            Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none">Login</Link>
          </p>

          <Link to="/" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
            <span className="me-1">←</span> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;

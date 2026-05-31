import { useState } from "react";
import { loginUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  // Generate random positions for background logos once
  const [backgroundLogos] = useState(() =>
    [...Array(20)].map((_, i) => ({
      id: i,
      size: Math.random() * 30 + 20, // 20px to 50px
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 4
    }))
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Bypass role validation for Admin credentials
    if (form.email === "admin@gmail.com" && form.password === "123456") {
      const adminUser = {
        id: "admin-id",
        name: "Admin",
        email: "admin@gmail.com",
      };
      localStorage.setItem("user", JSON.stringify(adminUser));
      localStorage.setItem("role", "admin");
      navigate('/admin-dashboard');
      return;
    }

    // Role validation for Patient and Doctor
    if (!role) {
      alert("Please select role");
      return;
    }

    try {
      // Include role in login request
      const res = await loginUser({ ...form, role });
      alert(res.data.message);

      const userData = res.data.user;
      const userToStore = {
        id: userData._id || userData.id,
        name: userData.name,
        email: userData.email
      };

      // Store user data and role centrally
      localStorage.setItem("user", JSON.stringify(userToStore));
      localStorage.setItem("role", role);

      // Role-specific redirection
      if (role === 'patient') {
        navigate('/patient');
      } else if (role === 'doctor') {
        navigate('/doctor');
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error during login");
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative py-5"
      style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>

      {/* Top Left Logo */}
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

      <div className="card p-4 p-md-5 shadow-lg border-0 rounded-4 position-relative" style={{ maxWidth: '420px', width: '100%', zIndex: 1 }}>
        <h2 className="text-center fw-bold mb-2">Welcome Back</h2>
        <p className="text-center text-muted mb-4">Please login to your account</p>

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary">Select Role</label>
            <select
              className="form-select form-select-lg bg-light border-0"
              value={role}
              onChange={handleRoleChange}
              style={{ cursor: 'pointer' }}
            >
              <option value="" disabled>Select Role</option>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          {/* Inputs */}
          <div className="mb-3">
            <input
              className="form-control form-control-lg bg-light border-0"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <input
              className="form-control form-control-lg bg-light border-0"
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button className="btn btn-primary w-100 btn-lg mb-3 shadow-sm fw-bold"
            style={{ background: 'linear-gradient(90deg, #007bff, #0056b3)', border: 'none' }}>
            Login
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center mt-2">
          {role !== 'admin' && (
            <p className="mb-3 text-muted small">
              Don't have an account? <Link to="/register" className="text-primary fw-bold text-decoration-none">Register</Link>
            </p>
          )}

          <Link to="/" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
            <span className="me-1">←</span> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

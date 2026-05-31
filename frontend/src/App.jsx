import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientLayout from "./pages/patient/PatientLayout";
import DashboardHome from "./pages/patient/DashboardHome";
import BookAppointment from "./pages/patient/BookAppointment";
import MyAppointments from "./pages/patient/MyAppointments";
import Doctors from "./pages/patient/Doctors";
import Profile from "./pages/patient/Profile";

// Doctor Imports
import DoctorLayout from "./pages/doctor/DoctorLayout";
import DoctorDashboardHome from "./pages/doctor/DoctorDashboardHome";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";
import DoctorProfile from "./pages/doctor/DoctorProfile";

// Admin Imports
import AdminDashboard from "./pages/admin/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Patient Routes */}
      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="book-appointment" element={<BookAppointment />} />
        <Route path="my-appointments" element={<MyAppointments />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Doctor Routes */}
      <Route path="/doctor" element={<DoctorLayout />}>
        <Route index element={<DoctorDashboardHome />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Admin Route */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;

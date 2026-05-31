const express = require("express");
const User = require("../models/user");   // models/user.js
const Appointment = require("../models/appointment"); // models/appointment.js
const router = express.Router();
const bcrypt = require("bcryptjs");


// =======================
// REGISTER API
// =======================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Role check - Prevent manual admin registration
    if (role === "admin") {
      return res.status(403).json({ message: "Admin registration is not allowed" });
    }

    // check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user dynamically based on role rules
    let userPayload = {
      name,
      email,
      password: hashedPassword,
      role: role || "patient"
    };

    if (userPayload.role === "patient") {
      const allowedPatientFields = ["phone", "address", "dob", "gender", "bloodGroup", "age", "height", "weight"];
      allowedPatientFields.forEach(field => {
        if (req.body[field] !== undefined) userPayload[field] = req.body[field];
      });
    } else if (userPayload.role === "doctor") {
      const allowedDoctorFields = ["phone", "address", "dob", "gender", "bloodGroup", "age", "height", "weight", "specialization", "experience", "consultationFee", "isAvailable", "workingDays", "startTime", "endTime", "slotDuration", "breakStartTime", "breakEndTime"];
      allowedDoctorFields.forEach(field => {
        if (req.body[field] !== undefined) userPayload[field] = req.body[field];
      });
    } else {
      Object.keys(req.body).forEach(field => {
        if (!["name", "email", "password", "role"].includes(field)) {
          userPayload[field] = req.body[field];
        }
      });
    }

    const newUser = new User(userPayload);
    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.log("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// =======================
// LOGIN API
// =======================
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // validation
    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields required (Email, Password, Role)" });
    }

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Role Verification
    if (user.role !== role) {
      return res.status(400).json({ message: "Role mismatch for this account" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // success
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.log("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// =======================
// GET PROFILE API
// =======================
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.id || req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// UPDATE PROFILE API
// =======================
router.put("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      console.log(`[Backend] User ${userId} not found.`);
      return res.status(404).json({ message: "User account not found." });
    }

    const updateData = {};
    const unsetData = {};

    if (existingUser.role === "patient") {
      const patientFields = ["name", "phone", "address", "dob", "gender", "bloodGroup", "age", "height", "weight"];
      patientFields.forEach(field => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      });

      // Remove unwanted doctor-specific fields if they exist in DB
      const doctorFields = ["isAvailable", "workingDays", "startTime", "endTime", "slotDuration", "breakStartTime", "breakEndTime", "specialization", "experience", "consultationFee"];
      doctorFields.forEach(field => {
        if (existingUser[field] !== undefined) unsetData[field] = 1;
      });
    } else if (existingUser.role === "doctor") {
      const allowedDoctorFields = ["name", "phone", "address", "dob", "gender", "bloodGroup", "age", "height", "weight", "specialization", "experience", "consultationFee", "isAvailable", "workingDays", "startTime", "endTime", "slotDuration", "breakStartTime", "breakEndTime"];
      allowedDoctorFields.forEach(field => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      });
    } else {
      // For any other roles
      Object.keys(req.body).forEach(key => {
        if (!["email", "_id", "password", "role"].includes(key)) {
          updateData[key] = req.body[key];
        }
      });
    }

    console.log(`[Backend] Update Data Received for ${existingUser.role}:`, updateData);
    if (Object.keys(unsetData).length > 0) {
      console.log(`[Backend] Unsetting unwanted fields:`, unsetData);
    }

    console.log(`[Backend] Attempting update for User: ${userId}`);

    const updatePayload = { $set: updateData };
    if (Object.keys(unsetData).length > 0) {
      updatePayload.$unset = unsetData;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updatePayload,
      { new: true, runValidators: true }
    ).select("-password");

    console.log(`[Backend] Update successful for ${userId}`);
    res.json({ message: "Profile updated successfully", user: updatedUser });

  } catch (error) {
    console.error("[Backend] Profile Update Error:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message
    });
  }
});

// =======================
// GET ALL DOCTORS API
// =======================
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("-password");
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



// =======================
// GET ADMIN DASHBOARD COUNTS API
// =======================
router.get("/dashboard-counts", async (req, res) => {
  try {
    const doctors = await User.countDocuments({ role: "doctor" });
    const patients = await User.countDocuments({ role: "patient" });
    
    // Get today's date in YYYY-MM-DD format (Handling timezone)
    const today = new Date().toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
    
    const totalAppointments = await Appointment.countDocuments();
    const todayAppointments = await Appointment.countDocuments({ date: today });
    const pending = await Appointment.countDocuments({ status: "Pending" });

    res.json({
      doctors,
      patients,
      totalAppointments, // Keep for potential use
      todayAppointments, // The new required count
      appointments: todayAppointments, // For backward compatibility if needed in UI
      pending
    });
  } catch (error) {
    console.error("Dashboard Counts Error:", error);
    res.status(500).json({ message: "Server error fetching dashboard counts" });
  }
});

// =======================
// UPDATE DOCTOR SCHEDULE API
// =======================
router.put("/doctor/schedule/:doctorId", async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    const {
      startTime,
      endTime,
      workingDays,
      slotDuration,
      breakStartTime,
      breakEndTime,
      isAvailable,
      leaves,
      selectedSlots
    } = req.body;

    const updated = await User.findByIdAndUpdate(
      doctorId,
      {
        startTime,
        endTime,
        workingDays,
        slotDuration,
        breakStartTime,
        breakEndTime,
        isAvailable,
        leaves,
        selectedSlots
      },
      { new: true, runValidators: true }
    );

    res.json(updated);

  } catch (err) {
    console.error("Schedule update failed:", err);
    res.status(500).json({ message: "Schedule update failed" });
  }
});

// =======================
// PATIENT DASHBOARD DATA
// =======================
router.get("/patient/dashboard/:patientId", async (req, res) => {
  try {
    const patientId = req.params.patientId;

    const appointments = await Appointment.find({
      $or: [
        { patientId: patientId },
        { userId: patientId } // fallback for old data
      ]
    });

    const now = new Date();

    const upcoming = appointments.filter(a => new Date(a.date) >= now);
    const pending = appointments.filter(a => a.status === "Pending");
    const approved = appointments.filter(a => a.status === "Approved");
    const cancelled = appointments.filter(a => a.status === "Cancelled");

    const lastAppointment = appointments
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    res.json({
      upcoming: upcoming.length,
      pending: pending.length,
      approved: approved.length,
      cancelled: cancelled.length,
      lastAppointment: lastAppointment?.date || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard error" });
  }
});

// =======================
// DELETE USER API
// =======================
router.delete("/user/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Also delete their appointments if they are a doctor? 
    // Usually we just mark them as cancelled or keep records, but for this task I'll just delete the user.
    // To be thorough, we can cleanup associated data.
    if (user.role === 'doctor') {
        await Appointment.deleteMany({ doctorId: user._id });
    }
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// ADMIN: GET PATIENTS WITH APPOINTMENTS
// =======================
router.get("/admin/patients-with-appointments", async (req, res) => {
  try {
    // 1. Fetch all appointments and group them carefully
    const appointments = await Appointment.find().sort({ createdAt: -1 });

    const patientMap = new Map();

    for (const app of appointments) {
      // Use patientId/userId if available, fallback to patientName to ensure no appointment is lost
      const pId = app.patientId?.toString() || app.userId?.toString();
      const pName = app.patientName || "Unknown Patient";
      
      // Use ID as primary key, but fallback to Name if ID is missing
      const lookupKey = pId || pName;

      if (!patientMap.has(lookupKey)) {
        patientMap.set(lookupKey, {
          patientId: pId || null,
          patientName: pName,
          appointmentCount: 0,
          lastVisitDate: app.date,
          phone: "Not Provided"
        });
      }

      const pData = patientMap.get(lookupKey);
      pData.appointmentCount += 1;
      
      // Update lastVisitDate if this appointment is newer
      if (new Date(app.date) > new Date(pData.lastVisitDate)) {
        pData.lastVisitDate = app.date;
      }
    }

    // 2. Enhance with additional user info from User collection
    const entries = Array.from(patientMap.values());
    const dbPatientIds = entries.map(p => p.patientId).filter(id => id !== null);
    
    // Also try to find users by name if ID was missing or to confirm name
    const dbUsers = await User.find({ 
      $or: [
        { _id: { $in: dbPatientIds } },
        { name: { $in: entries.map(p => p.patientName) } }
      ]
    }).select("name phone");

    const patientsList = entries.map(p => {
      // Find user by ID or Name
      const user = dbUsers.find(u => 
        (p.patientId && u._id.toString() === p.patientId) || 
        (u.name === p.patientName && !p.patientId)
      );

      return {
        ...p,
        patientName: user?.name || p.patientName,
        phone: user?.phone || p.phone
      };
    });

    // Sort by lastVisitDate DESC
    patientsList.sort((a, b) => new Date(b.lastVisitDate) - new Date(a.lastVisitDate));

    res.json(patientsList);
  } catch (error) {
    console.error("Admin Patients Error:", error);
    res.status(500).json({ message: "Server error fetching patients with appointments" });
  }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Trigger reload for schema changes

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🔥 ROUTES CONNECT (THIS WAS MISSING)
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctor/notifications', notificationRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Smart Hospital Backend + MongoDB Connected Successfully!');
});

// User Requirements APIs
const Appointment = require('./models/appointment');

// GET /api/doctor/appointments
app.get('/api/doctor/appointments', async (req, res) => {
  try {
    const doctorFilter = req.query.doctor || req.query.doctorId;
    console.log(`[API CALLED] GET /api/doctor/appointments`);
    
    if (!doctorFilter) {
      return res.status(400).json({ message: "Doctor identifier is required (use ?doctor=... or ?doctorId=...)" });
    }

    const appointments = await Appointment.find({ 
      $or: [{ doctorId: doctorFilter }, { doctor: doctorFilter }]
    }).sort({ createdAt: -1 }).lean();
    console.log(`[RECORDS FOUND] ${appointments.length} appointments found for doctor: ${doctorFilter}`);
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error("[ERROR] GET /api/doctor/appointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/patient/appointments
app.get('/api/patient/appointments', async (req, res) => {
  try {
    const userId = req.query.userId || req.query.patientId;
    console.log(`[API CALLED] GET /api/patient/appointments`);
    
    if (!userId) {
      return res.status(400).json({ message: "UserId is required (use ?userId=... or ?patientId=...)" });
    }

    const appointments = await Appointment.find({ 
      $or: [{ patientId: userId }, { userId: userId }] 
    }).sort({ createdAt: -1 }).lean();
    console.log(`[RECORDS FOUND] ${appointments.length} appointments found for patient: ${userId}`);
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error("[ERROR] GET /api/patient/appointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/admin/appointments (For Appointment Management)
app.get('/api/admin/appointments', async (req, res) => {
  try {
    const User = require('./models/user');
    console.log(`[API CALLED] GET /api/admin/appointments`);
    const appointments = await Appointment.find().sort({ createdAt: -1 }).lean();
    
    // Enrich with fallbacks for legacy data
    const enriched = await Promise.all(appointments.map(async (app) => {
      let pName = app.patientName || app.userName || "Unknown";
      let dName = app.doctorName || app.doctor || "Unknown";
      
      // Attempt lookup if name is missing but ID is present
      if (pName === "Unknown" && (app.patientId || app.userId)) {
        try {
          const user = await User.findById(app.patientId || app.userId);
          if (user) pName = user.name;
        } catch (e) {}
      }
      
      if (dName === "Unknown" && app.doctorId) {
        try {
          const doc = await User.findById(app.doctorId);
          if (doc) dName = doc.name;
        } catch (e) {}
      }

      return {
        ...app,
        patientName: pName,
        doctorName: dName
      };
    }));

    res.status(200).json(enriched);
  } catch (error) {
    console.error("[ERROR] GET /api/admin/appointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /appointments (Requested exact URI)
app.get('/appointments', async (req, res) => {
  try {
    const User = require('./models/user');
    const appointments = await Appointment.find().sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(appointments.map(async (app) => {
      let pName = app.patientName || app.userName || "Unknown";
      let dName = app.doctorName || app.doctor || "Unknown";
      if (pName === "Unknown" && (app.patientId || app.userId)) {
        try { const user = await User.findById(app.patientId || app.userId); if (user) pName = user.name; } catch (e) {}
      }
      if (dName === "Unknown" && app.doctorId) {
        try { const doc = await User.findById(app.doctorId); if (doc) dName = doc.name; } catch (e) {}
      }
      return { ...app, patientName: pName, doctorName: dName };
    }));
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /appointments/:id (For Admin Management)
app.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[API CALLED] DELETE /appointments/${id}`);
    
    const appointment = await Appointment.findByIdAndDelete(id);
    
    if (!appointment) {
      console.log(`[ERROR] Appointment not found: ${id}`);
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    console.log(`[SUCCESS] Deleted appointment: ${id}`);
    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error(`[ERROR] DELETE /appointments/${id}:`, error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Background task for appointment reminders (Run every minute)
const Notification = require('./models/notification');
setInterval(async () => {
    try {
        const now = new Date();
        const reminderTime = new Date(now.getTime() + 10 * 60000);
        
        const dateStr = reminderTime.toLocaleDateString('en-CA');
        const hours = reminderTime.getHours().toString().padStart(2, '0');
        const mins = reminderTime.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${mins}`;

        const upcoming = await Appointment.find({
            date: dateStr,
            time: timeStr,
            status: 'Approved',
            reminderSent: { $ne: true }
        });

        for (const app of upcoming) {
            const msg = `Reminder: Appointment with ${app.patientName} at ${app.time} in 10 minutes`;
            const notif = new Notification({
                doctorId: app.doctorId,
                patientName: app.patientName,
                appointmentDate: app.date,
                appointmentTime: app.time,
                message: msg
            });
            await notif.save();
            await Appointment.findByIdAndUpdate(app._id, { reminderSent: true });
            console.log(`[Reminder] Triggered for ${app.patientName} at ${app.time}`);
        }
    } catch (err) {
        console.error("Reminder Worker Error:", err);
    }
}, 60000);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
  })
  .catch((err) => {
    console.log('MongoDB Connection Error:', err);
  });

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

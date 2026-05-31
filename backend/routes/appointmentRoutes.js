const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const User = require('../models/user');
const Notification = require('../models/notification');

// Book an appointment
router.post('/book', async (req, res) => {
    try {
        const { doctorId, date, time } = req.body;
        // Get patientId from logged-in user (req.user.id), falling back to req.body.patientId just in case
        const patientId = (req.user && req.user.id) ? req.user.id : req.body.patientId;

        if (!patientId || !doctorId || !date || !time) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if date is in the past
        const todayStr = new Date().toISOString().split('T')[0];
        if (date < todayStr) {
            return res.status(400).json({ message: "Cannot book appointments for past dates" });
        }

        // Fetch user names
        const patient = await User.findById(patientId);
        const doctorObj = await User.findById(doctorId);

        if (!patient || !doctorObj) {
            return res.status(404).json({ message: "Patient or Doctor not found" });
        }

        const patientName = patient.name;
        const doctorName = doctorObj.name;

        // Check if doctor is already booked for this slot
        const doctorConflict = await Appointment.findOne({
            doctorId: doctorId, 
            date: date, 
            time: time, 
            status: { $in: ['Pending', 'Approved'] }
        });

        if (doctorConflict) {
            return res.status(400).json({ message: "This doctor is already booked for this time slot. Please choose another slot or doctor." });
        }

        // Check if patient already has an appointment at this time
        const patientConflict = await Appointment.findOne({
            $or: [
                { patientId: patientId, date: date, time: time, status: { $in: ['Pending', 'Approved'] } },
                { userId: patientId.toString(), date: date, time: time, status: { $in: ['Pending', 'Approved'] } }
            ]
        });

        if (patientConflict) {
            return res.status(400).json({ message: "You already have another appointment booked at this time. Please check your schedule." });
        }

        const newAppointment = new Appointment({
            patientId,
            doctorId,
            patientName,
            doctorName,
            date,
            time,
            status: 'Pending'
        });
        await newAppointment.save();

        // Create notification for doctor
        const newNotification = new Notification({
            doctorId,
            patientName,
            appointmentDate: date,
            appointmentTime: time,
            message: `New appointment booked by ${patientName} on ${date} at ${time}`
        });
        await newNotification.save();

        res.status(201).json({ message: "Appointment booked successfully", appointment: newAppointment });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get all appointments for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const appointments = await Appointment.find({
            $or: [{ patientId: userId }, { userId: userId }]
        }).sort({ createdAt: -1 }).lean();
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get all appointments for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Build query for current exact ID
        const query = { doctorId: doctorId };

        const appointments = await Appointment.find(query).sort({ createdAt: -1 }).lean();

        console.log(`Found ${appointments.length} matches`);
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Doctor Appointment Fetch Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update appointment status (Approve/Reject)
router.put('/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const appointmentId = req.params.id ? req.params.id.trim() : null;

        console.log(`[DEBUG] Update Status Request - ID: '${appointmentId}', Status: '${status}'`);

        if (!appointmentId) {
            return res.status(400).json({ message: "Appointment ID is required" });
        }

        const validStatuses = ['Pending', 'Approved', 'Cancelled', 'Completed'];
        // Case-insensitive check
        const matchedStatus = validStatuses.find(s => s.toLowerCase() === (status || "").toLowerCase());

        if (!matchedStatus) {
            console.log(`[DEBUG] Status Rejected: '${status}'`);
            return res.status(400).json({ message: `Invalid status: ${status}` });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { $set: { status: matchedStatus } },
            { new: true, runValidators: true }
        );

        if (!appointment) {
            console.log(`[DEBUG] Appointment not found: ${appointmentId}`);
            return res.status(404).json({ message: "Appointment record not found in database" });
        }

        console.log(`[DEBUG] Update Success: ${appointmentId} -> ${matchedStatus}`);
        res.status(200).json({ message: `Status updated to ${matchedStatus}`, appointment });
    } catch (error) {
        console.error("[DEBUG] Critical Update Error:", error);
        res.status(500).json({ message: "Internal server error during status update", error: error.message });
    }
});

// Cancel an appointment
router.put('/cancel/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'Cancelled' } },
            { new: true, runValidators: true }
        );
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Create notification for doctor
        try {
            const notif = new Notification({
                doctorId: appointment.doctorId,
                patientName: appointment.patientName || "A patient",
                appointmentDate: appointment.date,
                appointmentTime: appointment.time,
                message: `Patient ${appointment.patientName || "A patient"} cancelled the appointment scheduled at ${appointment.time}`
            });
            await notif.save();
        } catch (err) {
            console.error("Cancellation notification error:", err);
        }

        res.status(200).json({ message: "Appointment cancelled", appointment });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get approved patients for a doctor with full details
// Get approved patients for a doctor with full details
router.get('/doctor-patients/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Build query
        const query = {
            doctorId: doctorId,
            status: { $in: ['Approved', 'Completed'] } 
        };

        // 1. Fetch appointments & populate patient details
        const appointments = await Appointment.find(query)
            .sort({ createdAt: -1 })
            .populate('patientId')
            .lean();

        // 2. Fallback execution & formatting map
        const formatted = await Promise.all(
            appointments.map(async (a) => {
                let patient = a.patientId;

                // fallback for old data where patientId wasn't stored
                if (!patient && a.userId) {
                    try {
                        patient = await User.findById(a.userId.trim());
                    } catch (e) {
                        console.error("Legacy patient lookup failed:", e);
                    }
                }

                // fallback for broken populate
                if (!patient && a.patientId) {
                    try {
                        patient = await User.findById(a.patientId);
                    } catch (e) {
                        console.error("Broken populate lookup failed:", e);
                    }
                }

                return {
                    appointmentId: a._id.toString(),
                    patientName: patient?.name || a.patientName || a.userName || "Unknown",
                    age: patient?.age ?? "Not Provided",
                    phone: patient?.phone ?? "Not Provided",
                    address: patient?.address ?? "Not Provided",
                    date: a.date,
                    time: a.time,
                    status: a.status
                };
            })
        );

        res.status(200).json(formatted);
    } catch (error) {
        console.error("[Backend-Patients] Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete an appointment
router.delete('/delete/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;
        console.log(`[Backend] Attempting to delete appointment with ID: ${appointmentId}`);
        const appointment = await Appointment.findByIdAndDelete(appointmentId);
        if (!appointment) {
            console.log(`[Backend] Appointment not found for ID: ${appointmentId}`);
            return res.status(404).json({ message: "Appointment not found" });
        }
        console.log(`[Backend] Successfully deleted appointment with ID: ${appointmentId}`);
        res.status(200).json({ message: "Appointment deleted successfully" });
    } catch (error) {
        console.error("[Backend] Delete Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get appointments with filtering (e.g. ?doctorId=...)
router.get('/', async (req, res) => {
    try {
        const { doctorId } = req.query;
        if (!doctorId) {
            return res.status(400).json({ message: "doctorId query parameter is required" });
        }

        const appointments = await Appointment.find({ doctorId }).sort({ createdAt: -1 }).lean();
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;


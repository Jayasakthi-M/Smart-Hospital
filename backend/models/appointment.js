const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    patientName: {
        type: String,
        required: false
    },
    doctorName: {
        type: String,
        required: false
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Cancelled', 'Completed'],
        default: 'Pending'
    },
    reminderSent: {
        type: Boolean,
        default: false
    }
}, { timestamps: true, strict: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Appointment = require('./models/appointment');
const User = require('./models/user');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const appointments = await Appointment.find();
        console.log(`Total appointments: ${appointments.length}`);

        const problematic = appointments.filter(a => !a.patientName || a.patientName === 'Unknown Patient' || !a.patientId);
        console.log(`Problematic appointments: ${problematic.length}`);

        for (const app of problematic) {
            console.log(`ID: ${app._id}, patientId: ${app.patientId}, patientName: ${app.patientName}`);
            if (app.patientId) {
                const user = await User.findById(app.patientId);
                console.log(`   User Lookup: ${user ? user.name : 'NOT FOUND'}`);
            }
        }

        const patients = await User.find({ role: 'patient' });
        console.log(`Total patients in User collection: ${patients.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();

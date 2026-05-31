const mongoose = require('mongoose');
const User = require('./models/user');

const MONGODB_URI = "mongodb://127.0.0.1:27017/smarthospital";

async function checkDoctors() {
    try {
        await mongoose.connect(MONGODB_URI);
        const doctors = await User.find({ role: 'doctor' });
        console.log('--- DOCTORS IN DB ---');
        doctors.forEach(d => {
            console.log(`ID: ${d._id}, Name: ${d.name}, Spec: ${d.specialization}`);
        });
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkDoctors();

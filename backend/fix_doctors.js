const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');
const Appointment = require('./models/appointment');

const normalizeName = (name) => {
    return name.toLowerCase().replace(/dr\.?\s*/g, '').replace(/\s+/g, '').trim();
};

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smarthospital');
        console.log("Connected to MongoDB");

        const doctors = await User.find({ role: 'doctor' });
        const masterMap = {}; // normalizedName -> doctor record

        for (const doc of doctors) {
            const norm = normalizeName(doc.name);
            if (!masterMap[norm]) {
                masterMap[norm] = doc;
                continue;
            }

            const master = masterMap[norm];
            const duplicate = doc;

            console.log(`Duplicate found: ${duplicate.name} (${duplicate.email}) -> Master: ${master.name} (${master.email})`);

            // Update appointments
            const result = await Appointment.updateMany(
                { doctorId: duplicate._id },
                { $set: { doctorId: master._id, doctorName: master.name } }
            );
            console.log(`Updated ${result.modifiedCount} appointments for ${duplicate.name}`);

            // Also check for legacy 'doctor' field or 'doctorName' field matches
            const resultLegacy = await Appointment.updateMany(
                { doctorName: duplicate.name },
                { $set: { doctorId: master._id, doctorName: master.name } }
            );
             console.log(`Updated ${resultLegacy.modifiedCount} legacy appointments for ${duplicate.name}`);

            // Delete duplicate
            await User.findByIdAndDelete(duplicate._id);
            console.log(`Deleted duplicate doctor user: ${duplicate._id}`);
        }

        console.log("Cleanup complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fix();

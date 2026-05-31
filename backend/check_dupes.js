const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');
const Appointment = require('./models/appointment');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smarthospital');
        console.log("Connected to MongoDB");

        const doctors = await User.find({ role: 'doctor' });
        console.log(`Total doctors: ${doctors.length}`);

        const nameMap = {};
        const emailMap = {};
        const duplicates = [];

        for (const doc of doctors) {
            if (emailMap[doc.email]) {
                duplicates.push({ type: 'email', original: emailMap[doc.email], duplicate: doc });
            } else {
                emailMap[doc.email] = doc;
            }

            if (nameMap[doc.name]) {
               // Only consider name duplicate if it's not already an email duplicate
               if (!emailMap[doc.email] || emailMap[doc.email]._id.toString() === doc._id.toString()) {
                   // wait, emailMap[doc.email] is doc itself if it's the first time we see this email.
               }
            }
        }

        // Simpler way: aggregation
        const emailDupes = await User.aggregate([
            { $match: { role: 'doctor' } },
            { $group: { _id: "$email", count: { $sum: 1 }, ids: { $push: "$_id" } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        const nameDupes = await User.aggregate([
            { $match: { role: 'doctor' } },
            { $group: { _id: "$name", count: { $sum: 1 }, ids: { $push: "$_id" } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        console.log("Email Duplicates:", JSON.stringify(emailDupes, null, 2));
        console.log("Name Duplicates:", JSON.stringify(nameDupes, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();

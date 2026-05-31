const mongoose = require('mongoose');
const User = require('./models/user');

const MONGODB_URI = "mongodb://127.0.0.1:27017/smarthospital";

async function testUpdate() {
    try {
        await mongoose.connect(MONGODB_URI);
        const doctorId = '698969876abb41911bd20726';
        
        const updateData = {
            startTime: '10:00',
            endTime: '18:00',
            selectedSlots: ['10:00 AM', '10:30 AM']
        };

        console.log('--- BEFORE UPDATE ---');
        const before = await User.findById(doctorId);
        console.log('StartTime:', before.startTime, 'Slots:', before.selectedSlots);

        const updated = await User.findByIdAndUpdate(
            doctorId,
            { $set: updateData },
            { new: true }
        );

        console.log('--- AFTER UPDATE ---');
        console.log('StartTime:', updated.startTime, 'Slots:', updated.selectedSlots);

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

testUpdate();

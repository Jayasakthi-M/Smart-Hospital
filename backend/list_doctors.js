const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');

async function list() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smarthospital');
        const doctors = await User.find({ role: 'doctor' }).select('name email specialized role');
        console.log(JSON.stringify(doctors, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
list();

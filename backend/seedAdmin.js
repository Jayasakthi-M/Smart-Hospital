const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
require('dotenv').config();

const seedAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected to seed admins...');

        const emails = ['admin@gmail.com', 'admin@gamil.com'];

        for (const email of emails) {
            const existingAdmin = await User.findOne({ email });

            if (existingAdmin) {
                console.log('User already exists:', email);
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('Verified role: admin for', email);
            } else {
                const hashedPassword = await bcrypt.hash('123456', 10);
                const newAdmin = new User({
                    name: 'System Admin',
                    email: email,
                    password: hashedPassword,
                    role: 'admin'
                });
                await newAdmin.save();
                console.log('Admin user created successfully:', email);
            }
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding admins:', error);
        process.exit(1);
    }
};

seedAdmins();

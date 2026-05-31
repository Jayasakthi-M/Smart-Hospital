const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    profilePic: { type: String, default: "" },
    age: { type: String, default: "" },
    height: { type: String, default: "" },
    weight: { type: String, default: "" },
    specialization: { type: String, default: "" },
    experience: { type: String, default: "" },
    consultationFee: { type: String, default: "" },
    role: { type: String, default: "patient" },
    // Doctor Schedule Fields
    isAvailable: { type: Boolean, default: true },
    workingDays: { type: [String], default: [] },
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "17:00" },
    slotDuration: { type: Number, default: 30 },
    breakStartTime: { type: String, default: "" },
    breakEndTime: { type: String, default: "" },
    leaves: { type: [String], default: [] }, // Array of date strings like "YYYY-MM-DD"
    selectedSlots: { type: [String], default: [] }, // Chosen slots for the day
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
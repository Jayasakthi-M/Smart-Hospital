const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');

// Get all notifications for a doctor (both read and unread, but we'll use unread count for badge)
router.get('/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        const notifications = await Notification.find({ doctorId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Mark notification as read (optional but good to have)
router.put('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete a single notification
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Clear all notifications for a doctor
router.delete('/clear-all/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        await Notification.deleteMany({ doctorId });
        res.status(200).json({ message: "All notifications cleared" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;

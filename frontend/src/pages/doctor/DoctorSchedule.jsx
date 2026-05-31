import React, { useState, useEffect } from 'react';
import { getUserProfile, updateDoctorSchedule } from '../../services/authService';

const DoctorSchedule = () => {
    const [schedule, setSchedule] = useState({
        isAvailable: true,
        workingDays: [],
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        breakStartTime: '',
        breakEndTime: '',
        leaves: [],
        selectedSlots: []
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newLeaveDate, setNewLeaveDate] = useState('');
    const [previewSlots, setPreviewSlots] = useState([]);

    const user = JSON.parse(localStorage.getItem('user'));
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        if (user && (user.id || user._id)) {
            fetchSchedule();
        }
    }, []);

    useEffect(() => {
        generatePreview();
    }, [schedule.startTime, schedule.endTime, schedule.slotDuration, schedule.breakStartTime, schedule.breakEndTime]);

    const fetchSchedule = async () => {
        try {
            const res = await getUserProfile(user.id || user._id);
            const data = res.data;
            setSchedule({
                isAvailable: data.isAvailable ?? true,
                workingDays: data.workingDays || [],
                startTime: data.startTime || '09:00',
                endTime: data.endTime || '17:00',
                slotDuration: data.slotDuration || 30,
                breakStartTime: data.breakStartTime || '',
                breakEndTime: data.breakEndTime || '',
                leaves: data.leaves || [],
                selectedSlots: data.selectedSlots || []
            });
            console.log("Schedule fetched successfully:", data);
        } catch (error) {
            console.error('Error fetching schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDayToggle = (day) => {
        setSchedule(prev => {
            const workingDays = prev.workingDays.includes(day)
                ? prev.workingDays.filter(d => d !== day)
                : [...prev.workingDays, day];
            return { ...prev, workingDays };
        });
    };

    const handleSlotToggle = (slot) => {
        setSchedule(prev => {
            const selectedSlots = prev.selectedSlots.includes(slot)
                ? prev.selectedSlots.filter(s => s !== slot)
                : [...prev.selectedSlots, slot];
            return { ...prev, selectedSlots };
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSchedule(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'slotDuration' ? parseInt(value) : value)
        }));
    };

    const addLeave = () => {
        if (newLeaveDate && !schedule.leaves.includes(newLeaveDate)) {
            setSchedule(prev => ({
                ...prev,
                leaves: [...prev.leaves, newLeaveDate].sort()
            }));
            setNewLeaveDate('');
        }
    };

    const removeLeave = (date) => {
        setSchedule(prev => ({
            ...prev,
            leaves: prev.leaves.filter(d => d !== date)
        }));
    };

    const generatePreview = () => {
        const { startTime, endTime, slotDuration, breakStartTime, breakEndTime } = schedule;
        if (!startTime || !endTime || !slotDuration) return;

        // Helper to convert HH:mm to minutes from midnight
        const toMin = (t) => {
            if (!t) return null;
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const startMin = toMin(startTime);
        const endMin = toMin(endTime);
        const bStartMin = toMin(breakStartTime);
        const bEndMin = toMin(breakEndTime);

        const slots = [];
        let currentMin = startMin;

        while (currentMin < endMin) {
            const nextMin = currentMin + slotDuration;
            if (nextMin > endMin) break;

            // Check overlap with break: (slotStart < breakEnd && slotEnd > breakStart)
            const isDuringBreak = (bStartMin !== null && bEndMin !== null) && (
                currentMin < bEndMin && nextMin > bStartMin
            );

            if (!isDuringBreak) {
                const h = Math.floor(currentMin / 60);
                const m = currentMin % 60;
                const period = h >= 12 ? 'PM' : 'AM';
                const displayH = h % 12 === 0 ? 12 : h % 12;
                const displayM = m.toString().padStart(2, '0');
                const displayHStr = displayH.toString().padStart(2, '0');
                
                slots.push(`${displayHStr}:${displayM} ${period}`);
            }
            currentMin = nextMin;
        }
        setPreviewSlots(slots);
    };

    const handleSave = async () => {
        // Validation: Only save selected slots that are actually in the current preview
        const validSelectedSlots = schedule.selectedSlots.filter(slot => previewSlots.includes(slot));
        
        setSaving(true);
        try {
            const payload = { ...schedule, selectedSlots: validSelectedSlots };
            console.log("Saving schedule payload:", payload);
            await updateDoctorSchedule(user.id || user._id, payload);
            
            // Re-fetch to confirm persistence
            alert('Schedule updated successfully!');
            fetchSchedule(); 
        } catch (error) {
            console.error('Error updating schedule:', error);
            alert('Failed to update schedule.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    return (
        <div className="schedule-container animate-slide-down">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-dark m-0">
                    <span className="me-2">📅</span> Schedule & Availability
                </h2>
                <div className="form-check form-switch availability-toggle">
                    <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        id="availabilitySwitch"
                        name="isAvailable"
                        checked={schedule.isAvailable}
                        onChange={handleInputChange}
                    />
                    <label className={`form-check-label fw-bold ${schedule.isAvailable ? 'text-success' : 'text-danger'}`} htmlFor="availabilitySwitch">
                        {schedule.isAvailable ? 'Available' : 'Unavailable'}
                    </label>
                </div>
            </div>

            <div className="row g-4">
                {/* Main Settings Card */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                        <h5 className="fw-bold mb-4 text-primary d-flex align-items-center">
                            <span className="me-2">⏰</span> Working Hours
                        </h5>
                        
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-secondary">START TIME</label>
                                <input
                                    type="time"
                                    className="form-control form-control-lg border-2"
                                    name="startTime"
                                    value={schedule.startTime}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-secondary">END TIME</label>
                                <input
                                    type="time"
                                    className="form-control form-control-lg border-2"
                                    name="endTime"
                                    value={schedule.endTime}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label small fw-bold text-secondary mb-3">WORKING DAYS</label>
                            <div className="d-flex flex-wrap gap-2">
                                {daysOfWeek.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        className={`btn btn-sm rounded-pill px-3 py-2 transition-all ${
                                            schedule.workingDays.includes(day)
                                                ? 'btn-primary shadow-sm'
                                                : 'btn-outline-secondary hover-bg-light'
                                        }`}
                                        onClick={() => handleDayToggle(day)}
                                    >
                                        {day.substring(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-secondary">SLOT DURATION</label>
                                <select
                                    className="form-select form-select-lg border-2"
                                    name="slotDuration"
                                    value={schedule.slotDuration}
                                    onChange={handleInputChange}
                                >
                                    <option value={15}>15 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                    <option value={45}>45 Minutes</option>
                                    <option value={60}>60 Minutes</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                        <h5 className="fw-bold mb-4 text-warning d-flex align-items-center">
                            <span className="me-2">☕</span> Break Time (Optional)
                        </h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-secondary">BREAK START</label>
                                <input
                                    type="time"
                                    className="form-control form-control-lg border-2"
                                    name="breakStartTime"
                                    value={schedule.breakStartTime}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-secondary">BREAK END</label>
                                <input
                                    type="time"
                                    className="form-control form-control-lg border-2"
                                    name="breakEndTime"
                                    value={schedule.breakEndTime}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h5 className="fw-bold mb-4 text-danger d-flex align-items-center">
                            <span className="me-2">🏖️</span> Manage Leaves
                        </h5>
                        <div className="d-flex gap-2 mb-4">
                            <input
                                type="date"
                                className="form-control form-control-lg border-2"
                                value={newLeaveDate}
                                onChange={(e) => setNewLeaveDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <button
                                type="button"
                                className="btn btn-danger px-4 fw-bold rounded-3"
                                onClick={addLeave}
                            >
                                Add Leave
                            </button>
                        </div>
                        
                        <div className="d-flex flex-wrap gap-2">
                            {schedule.leaves.length > 0 ? (
                                schedule.leaves.map(date => (
                                    <div key={date} className="badge bg-light text-dark border p-2 px-3 rounded-pill d-flex align-items-center gap-2 shadow-sm">
                                        <span className="fw-bold">{new Date(date).toLocaleDateString()}</span>
                                        <button
                                            type="button"
                                            className="btn-close small"
                                            style={{ fontSize: '0.6rem' }}
                                            onClick={() => removeLeave(date)}
                                        ></button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted small italic">No leaves scheduled.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Card */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '20px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold text-success d-flex align-items-center m-0">
                                <span className="me-2">👁️</span> Slot Preview
                            </h5>
                            {previewSlots.length > 0 && (
                                <button 
                                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                    onClick={() => {
                                        const allSelected = previewSlots.every(s => schedule.selectedSlots.includes(s));
                                        setSchedule(prev => ({
                                            ...prev,
                                            selectedSlots: allSelected ? [] : [...previewSlots]
                                        }));
                                    }}
                                >
                                    {previewSlots.every(s => schedule.selectedSlots.includes(s)) ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>
                        <p className="text-muted small mb-3">Click on a slot to make it available for patients:</p>
                        
                        <div className="preview-slots-grid scrollbar-hidden" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {previewSlots.length > 0 ? (
                                <div className="row g-2">
                                    {previewSlots.map((slot, index) => (
                                        <div key={index} className="col-6">
                                            <div 
                                                className={`slot-item text-center p-2 rounded-3 border cursor-pointer transition-all small fw-bold ${
                                                    schedule.selectedSlots.includes(slot)
                                                        ? 'bg-success text-white border-success'
                                                        : 'bg-light text-muted opacity-50'
                                                }`}
                                                onClick={() => handleSlotToggle(slot)}
                                            >
                                                {slot}
                                                {schedule.selectedSlots.includes(slot) && <span className="ms-1">✓</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <span className="display-4 text-light">🕒</span>
                                    <p className="text-muted mt-2">No slots generated.</p>
                                </div>
                            )}
                        </div>

                        <hr className="my-4" />

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary w-100 py-3 rounded-3 fw-bold shadow-sm btn-glow"
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Updating...
                                </>
                            ) : (
                                'Save Schedule'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>
                {`
                .schedule-container {
                    padding-bottom: 50px;
                }
                .availability-toggle .form-check-input {
                    width: 3.5rem;
                    height: 1.75rem;
                }
                .availability-toggle .form-check-input:checked {
                    background-color: #198754;
                    border-color: #198754;
                }
                .slot-item {
                    transition: all 0.2s;
                    border: 1px solid #eee !important;
                }
                .slot-item:hover {
                    background-color: #e9ecef !important;
                    border-color: #0d6efd !important;
                    color: #0d6efd;
                }
                .preview-slots-grid::-webkit-scrollbar {
                    width: 4px;
                }
                .preview-slots-grid::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 10px;
                }
                .btn-glow:hover {
                    box-shadow: 0 0 15px rgba(13, 110, 253, 0.4);
                    transform: translateY(-2px);
                }
                @media (max-width: 991px) {
                    .sticky-top {
                        position: static !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default DoctorSchedule;

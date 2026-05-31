import api from './api';

export const getDoctorNotifications = (doctorId) => {
    return api.get(`/doctor/notifications/${doctorId}`);
};

export const markNotificationAsRead = (id) => {
    return api.put(`/doctor/notifications/${id}/read`);
};

export const deleteNotification = (id) => {
    return api.delete(`/doctor/notifications/${id}`);
};

export const clearAllNotifications = (doctorId) => {
    return api.delete(`/doctor/notifications/clear-all/${doctorId}`);
};

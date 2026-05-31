import API from "./api";

export const bookAppointment = (data) => API.post("/appointments/book", data);
export const getUserAppointments = (userId) => API.get(`/appointments/user/${userId}`);
export const getDoctorAppointments = (doctorId) => API.get(`/appointments?doctorId=${doctorId}`);
export const cancelAppointment = (id) => API.put(`/appointments/cancel/${id}`);
export const updateAppointmentStatus = (id, status) => API.put(`/appointments/update-status/${id}`, { status });
export const getDoctorPatients = (doctorId) => API.get(`/appointments/doctor-patients/${doctorId}`);
export const deleteAppointment = (id) => API.delete(`/appointments/delete/${id}`);
export const getAllAppointments = () => API.get("/admin/appointments");


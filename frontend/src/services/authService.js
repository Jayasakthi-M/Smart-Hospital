import API from "./api";

export const registerUser = (data) => API.post("/register", data);
export const loginUser = (data) => API.post("/login", data);
export const getUserProfile = (id) => API.get(`/user/${id}`);
export const updateUserProfile = (id, data) => API.put(`/user/${id}`, data);
export const getAllDoctors = () => API.get("/doctors");
export const getDashboardCounts = () => API.get("/dashboard-counts");
export const updateDoctorSchedule = (id, data) => API.put(`/doctor/schedule/${id}`, data);
export const deleteUser = (id) => API.delete(`/user/${id}`);
export const getPatientsWithAppointments = () => API.get("/admin/patients-with-appointments");

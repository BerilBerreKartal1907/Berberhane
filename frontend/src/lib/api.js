import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getServices = async () => {
  const response = await api.get("/services");
  return response.data;
};

export const getSettings = async () => {
  const response = await api.get("/settings");
  return response.data;
};

export const getAvailableSlots = async (date, serviceId) => {
  const response = await api.get(`/available-slots/${date}?service_id=${serviceId}`);
  return response.data;
};

export const createAppointment = async (data) => {
  const response = await api.post("/appointments", data);
  return response.data;
};

export const adminLogin = async (password) => {
  const response = await api.post(`/admin/login?password=${encodeURIComponent(password)}`);
  return response.data;
};

export const adminGetServices = async (password) => {
  const response = await api.get("/admin/services", {
    headers: { "X-Admin-Password": password },
  });
  return response.data;
};

export const adminCreateService = async (password, data) => {
  const response = await api.post("/admin/services", data, {
    headers: { "X-Admin-Password": password },
  });
  return response.data;
};

export const adminUpdateService = async (password, serviceId, data) => {
  const response = await api.put(`/admin/services/${serviceId}`, data, {
    headers: { "X-Admin-Password": password },
  });
  return response.data;
};

export const adminDeleteService = async (password, serviceId) => {
  const response = await api.delete(`/admin/services/${serviceId}`, {
    headers: { "X-Admin-Password": password },
  });
  return response.data;
};

export const adminGetAppointments = async (password, date = null, status = null) => {
  let url = "/admin/appointments";
  const params = [];
  if (date) params.push(`date=${date}`);
  if (status) params.push(`status=${status}`);
  if (params.length > 0) url += `?${params.join("&")}`;

  const response = await api.get(url, {
    headers: { "X-Admin-Password": password },
  });
  return response.data;
};

export const adminUpdateAppointmentStatus = async (password, appointmentId, status) => {
  const response = await api.put(
    `/admin/appointments/${appointmentId}/status?status=${status}`,
    {},
    { headers: { "X-Admin-Password": password } }
  );
  return response.data;
};

export const adminDeleteAppointment = async (password, appointmentId) => {
  const response = await api.delete(`/admin/appointments/${appointmentId}`, {
    headers: { "X-Admin-Password": password },
  });
  return response.data;
};

export const adminGetBlockedSlots = async (password) => {
  const response = await api.get("/admin/blocked-slots", {
    headers: { "X-Admin-Password": password },
  });
  return response.data;
};

export const adminCreateBlockedSlot = async (password, data) => {
  const response = await api.post("/admin/blocked-slots", data, {
    headers: { "X-Admin-Password": password },
  });
  return response.data;
};

export const adminDeleteBlockedSlot = async (password, slotId) => {
  const response = await api.delete(`/admin/blocked-slots/${slotId}`, {
    headers: { "X-Admin-Password": password },
  });
  return response.data;
};

export const adminUpdateSettings = async (password, data) => {
  const response = await api.put("/admin/settings", data, {
    headers: { "X-Admin-Password": password },
  });
  return response.data;
};

export const adminChangePassword = async (password, currentPassword, newPassword) => {
  const response = await api.post(
    "/admin/change-password",
    { current_password: currentPassword, new_password: newPassword },
    { headers: { "X-Admin-Password": password } }
  );
  return response.data;
};

export const adminSeedData = async (password) => {
  const response = await api.post(
    "/admin/seed",
    {},
    { headers: { "X-Admin-Password": password } }
  );
  return response.data;
};

export default api;

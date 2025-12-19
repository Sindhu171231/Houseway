import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// -----------------------------
// 🔧 Base URL Configuration
// -----------------------------
const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // ⚠️ Replace this with your local IP for physical device testing
  const LOCAL_IP = ''; // e.g. '192.168.1.5'

  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  } else if (Platform.OS === 'android') {
    return `http://${LOCAL_IP || '10.0.2.2'}:5000/api`;
  } else {
    return `http://${LOCAL_IP || '127.0.0.1'}:5000/api`;
  }
};

const BASE_URL = getBaseURL();

// -----------------------------
// 📡 Axios Instance
// -----------------------------
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// -----------------------------
// 🧠 Request Interceptor
// -----------------------------
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@houseway_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -----------------------------
// ⚙️ Response Interceptor
// -----------------------------
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[API Error]', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return Promise.reject(error.response?.data || error);
  }
);

// -----------------------------
// 🧩 AUTH API
// -----------------------------
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }, {
      headers: { 'Content-Type': 'application/json' },
    }),

  // ✅ Dynamic register route (core fix)
  register: (userData) => {
    let endpoint = '/auth/register-client'; // default

    if (userData.role === 'employee') {
      endpoint = '/auth/register-employee';
    } else if (userData.role === 'vendor') {
      endpoint = '/auth/register-vendor';
    } else if (userData.role === 'owner') {
      endpoint = '/auth/register';
    } else if (userData.role === 'guest') {
      endpoint = '/auth/register-guest';
    }

    console.log('[authAPI] Register endpoint:', endpoint, '| Data:', userData);

    return api.post(endpoint, userData, {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) =>
    api.put('/auth/profile', userData, {
      headers: { 'Content-Type': 'application/json' },
    }),
  changePassword: (passwordData) =>
    api.put('/auth/change-password', passwordData, {
      headers: { 'Content-Type': 'application/json' },
    }),
  uploadProfilePhoto: (formData) =>
    api.post('/auth/upload-profile-photo', formData),
  removeProfilePhoto: () => api.delete('/auth/remove-profile-photo'),
};

// -----------------------------
// 🧱 USERS API
// -----------------------------
export const usersAPI = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUserStatus: (id, isActive) =>
    api.put(`/users/${id}/status`, { isActive }, {
      headers: { 'Content-Type': 'application/json' },
    }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUsersByRole: (role) => api.get(`/users/role/${role}`),
  updateProfile: (data) => api.put('/users/profile', data, {
    headers: { 'Content-Type': 'application/json' },
  }),
  changePassword: (data) => api.put('/users/change-password', data, {
    headers: { 'Content-Type': 'application/json' },
  }),
  registerClient: (data) => api.post('/users/register-client', data, {
    headers: { 'Content-Type': 'application/json' },
  }),
};

// -----------------------------
// 🏗️ PROJECTS API
// -----------------------------
export const projectsAPI = {
  getProjects: (params = {}) => api.get('/projects', { params }),
  getProjectById: (id) => api.get(`/projects/${id}`),
  getProject: (id) => api.get(`/projects/${id}`), // Alias for getProjectById
  createProject: (data) =>
    api.post('/projects', data, { headers: { 'Content-Type': 'application/json' } }),
  updateProject: (id, data) =>
    api.put(`/projects/${id}`, data, { headers: { 'Content-Type': 'application/json' } }),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  assignEmployee: (id, employeeId) =>
    api.put(`/projects/${id}/assign-employee`, { employeeId }, {
      headers: { 'Content-Type': 'application/json' },
    }),
  assignVendor: (id, vendorId) =>
    api.put(`/projects/${id}/assign-vendor`, { vendorId }, {
      headers: { 'Content-Type': 'application/json' },
    }),
  updateProgress: (id, progressData) =>
    api.put(`/projects/${id}/progress`, progressData, {
      headers: { 'Content-Type': 'application/json' },
    }),
};

// -----------------------------
// 🧾 DASHBOARD API
// -----------------------------
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getClientStats: () => api.get('/dashboard/client-stats'),
  getEmployeeStats: () => api.get('/dashboard/employee-stats'),
  getVendorStats: () => api.get('/dashboard/vendor-stats'),
  getOwnerStats: () => api.get('/dashboard/owner-stats'),
  getRecentActivity: (limit = 10) =>
    api.get('/dashboard/recent-activity', { params: { limit } }),
};

// -----------------------------
// ⚙️ MATERIAL REQUESTS API
// -----------------------------
export const materialRequestsAPI = {
  getMaterialRequests: (params = {}) => api.get('/material-requests', { params }),
  createMaterialRequest: (data) =>
    api.post('/material-requests', data, { headers: { 'Content-Type': 'application/json' } }),
};

// -----------------------------
// 📁 FILES API
// -----------------------------
export const filesAPI = {
  getFiles: (params = {}) => api.get('/files', { params }),
  uploadFile: (formData) => api.post('/files/upload', formData),
  deleteFile: (id) => api.delete(`/files/${id}`),
};

// -----------------------------
// 📊 PURCHASE ORDERS API
// -----------------------------
export const purchaseOrdersAPI = {
  getPurchaseOrders: (params = {}) => api.get('/purchase-orders', { params }),
  getPurchaseOrderById: (id) => api.get(`/purchase-orders/${id}`),
  createPurchaseOrder: (data) =>
    api.post('/purchase-orders', data, { headers: { 'Content-Type': 'application/json' } }),
};

// -----------------------------
// ⏱️ ATTENDANCE API
// -----------------------------
export const attendanceAPI = {
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  heartbeat: (activeMinutes = 60) =>
    api.post('/attendance/heartbeat', { activeMinutes }),
  getStatus: () => api.get('/attendance/status'),
  getStats: (period = 'weekly') =>
    api.get('/attendance/stats', { params: { period } }),
  getEmployeeStats: (employeeId, period = 'weekly') =>
    api.get(`/attendance/employee/${employeeId}`, { params: { period } }),
};

// -----------------------------
// 📅 TASKS API
// -----------------------------
export const tasksAPI = {
  createTask: (data) => api.post('/tasks', data, {
    headers: { 'Content-Type': 'application/json' }
  }),
  getProjectTasks: (projectId, params = {}) =>
    api.get(`/tasks/project/${projectId}`, { params }),
  getUpcomingTasks: (days = 7) =>
    api.get('/tasks/upcoming', { params: { days } }),
  getTask: (taskId) => api.get(`/tasks/${taskId}`),
  updateTask: (taskId, data) => api.put(`/tasks/${taskId}`, data, {
    headers: { 'Content-Type': 'application/json' }
  }),
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
  updateTaskStatus: (taskId, status) =>
    api.put(`/tasks/${taskId}/status`, { status }, {
      headers: { 'Content-Type': 'application/json' }
    }),
};

// -----------------------------
// 💰 INVOICES API
// -----------------------------
export const invoicesAPI = {
  createInvoice: (data) => api.post('/invoices', data, {
    headers: { 'Content-Type': 'application/json' }
  }),
  getProjectInvoices: (projectId, params = {}) =>
    api.get(`/invoices/project/${projectId}`, { params }),
  getClientInvoices: (clientId, params = {}) =>
    api.get(`/invoices/client/${clientId}`, { params }),
  getInvoice: (invoiceId) => api.get(`/invoices/${invoiceId}`),
  updateInvoice: (invoiceId, data) => api.put(`/invoices/${invoiceId}`, data, {
    headers: { 'Content-Type': 'application/json' }
  }),
  updateInvoiceStatus: (invoiceId, status, paymentMethod) =>
    api.put(`/invoices/${invoiceId}/status`, { status, paymentMethod }, {
      headers: { 'Content-Type': 'application/json' }
    }),
  deleteInvoice: (invoiceId) => api.delete(`/invoices/${invoiceId}`),
  getInvoiceStats: (clientId) =>
    api.get('/invoices/stats/overview', { params: { clientId } }),
};

// -----------------------------
// 👥 CLIENTS API
// -----------------------------
export const clientsAPI = {
  getClients: (params = {}) => api.get('/clients', { params }),
  getClientById: (id) => api.get(`/clients/${id}`),
  getClient: (id) => api.get(`/clients/${id}`),  // Alias for getClientById
  getClientProjects: (clientId) => api.get(`/clients/${clientId}/projects`),
  getClientProjectInvoices: (clientId, projectId) =>
    api.get(`/clients/${clientId}/projects/${projectId}/invoices`),
  updateClient: (id, data) => api.put(`/clients/${id}`, data, {
    headers: { 'Content-Type': 'application/json' }
  }),
};



// -----------------------------
// Export Axios Instance & Base URL
// -----------------------------
export const API_BASE_URL = BASE_URL;
export default api;

import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper function to attach the Firebase JWT to fetch requests
 */
async function fetchWithAuth(endpoint, options = {}) {
  let token = null;
  
  if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Students
  addStudent: (data) => fetchWithAuth('/students', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  getStudents: (standard, section) => fetchWithAuth(`/students?standard=${standard}&section=${section}`),
  
  getStudentById: (studentId) => fetchWithAuth(`/students/${studentId}`),
  
  updateMarks: (studentId, termName, marks) => fetchWithAuth(`/students/${studentId}/marks`, {
    method: 'PUT',
    body: JSON.stringify({ termName, marks })
  }),
  
  updateStudent: (studentId, data) => fetchWithAuth(`/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  deleteStudent: (studentId) => fetchWithAuth(`/students/${studentId}`, {
    method: 'DELETE'
  }),

  // Analytics Leaderboard
  getLeaderboard: (standard, section) => fetchWithAuth(`/analytics/leaderboard?standard=${standard}&section=${section}`),
  getDashboardStats: () => fetchWithAuth('/analytics/dashboard'),

  // AI Assistant
  askAI: (question) => fetchWithAuth('/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ question })
  }),

  // Auth
  post: (url, data) => fetchWithAuth(url, { method: 'POST', body: JSON.stringify(data || {}) }),
  get: (url) => fetchWithAuth(url),
  put: (url, data) => fetchWithAuth(url, { method: 'PUT', body: JSON.stringify(data || {}) }),
  delete: (url) => fetchWithAuth(url, { method: 'DELETE' }),
  getMe: () => fetchWithAuth('/auth/me'),
  updateProfile: (data) => fetchWithAuth('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getAllUsers: () => fetchWithAuth('/auth/users'),
};

export default api;

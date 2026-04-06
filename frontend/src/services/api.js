import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me')
};

// Subject APIs
export const subjectAPI = {
    getAll: (params) => api.get('/subjects', { params }),
    getById: (id) => api.get(`/subjects/${id}`),
    create: (data) => api.post('/subjects', data),
    update: (id, data) => api.put(`/subjects/${id}`, data),
    delete: (id) => api.delete(`/subjects/${id}`)
};

// Question APIs
export const questionAPI = {
    getAll: (params) => api.get('/questions', { params }),
    getById: (id) => api.get(`/questions/${id}`),
    create: (data) => api.post('/questions', data),
    update: (id, data) => api.put(`/questions/${id}`, data),
    delete: (id) => api.delete(`/questions/${id}`),
    generateWithAI: (data) => api.post('/questions/generate-ai', data)
};

// Exam APIs
export const examAPI = {
    getAll: (params) => api.get('/exams', { params }),
    getById: (id) => api.get(`/exams/${id}`),
    create: (data) => api.post('/exams', data),
    update: (id, data) => api.put(`/exams/${id}`, data),
    delete: (id) => api.delete(`/exams/${id}`),
    publish: (id, isActive) => api.patch(`/exams/${id}/publish`, { isActive })
};

// Code execution APIs
export const codeAPI = {
    execute: (data) => api.post('/code/execute', data)
};

// Result APIs
export const resultAPI = {
    submit: (data) => api.post('/results/submit', data),
    getStudentResults: (studentId) => api.get(`/results/student/${studentId}`),
    getById: (id) => api.get(`/results/${id}`),
    getAll: (params) => api.get('/results', { params }),
    getAnalytics: () => api.get('/results/analytics'),
    delete: (id) => api.delete(`/results/${id}`)
};

// Study Material APIs
export const materialAPI = {
    getAll: (params) => api.get('/materials', { params }),
    getById: (id) => api.get(`/materials/${id}`),
    upload: (formData) => api.post('/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, formData) => api.put(`/materials/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/materials/${id}`),
    download: (id) => api.get(`/materials/${id}/download`, {
        responseType: 'blob'
    }),
    getViewUrl: (id) => {
        const token = localStorage.getItem('token');
        return `${API_URL}/materials/${id}/view?token=${token}`;
    }
};

export default api;

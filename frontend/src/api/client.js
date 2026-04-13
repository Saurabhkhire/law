import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// User profile
export const createUser = (data) => api.post('/users', data);
export const getUser = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);

// Visa strategy
export const analyzeVisa = (userId, extra = {}) => api.post(`/visa/analyze/${userId}`, extra);
export const getAssessments = (userId) => api.get(`/visa/assessments/${userId}`);

// Travel
export const assessTravel = (userId, data) => api.post(`/travel/assess/${userId}`, data);
export const generateTravelLetter = (userId, letterType, context = {}) =>
  api.post(`/travel/letter/${userId}`, { letterType, context });
export const getTravelHistory = (userId) => api.get(`/travel/history/${userId}`);

// Company / Employer
export const analyzeHire      = (userId, data)            => api.post(`/company/hiring-analysis/${userId}`, data);
export const getHiringHistory  = (userId)                  => api.get(`/company/hiring-history/${userId}`);
export const getRoster         = (userId)                  => api.get(`/company/roster/${userId}`);
export const addToRoster       = (userId, data)            => api.post(`/company/roster/${userId}`, data);
export const getComplianceReport = (userId)                => api.post(`/company/compliance-report/${userId}`, {});
export const generateSponsorDoc  = (userId, docType, emp)  => api.post(`/company/sponsorship-doc/${userId}`, { docType, employeeInfo: emp });

// Documents
export const getTemplates = () => api.get('/documents/templates');
export const generateDocument = (userId, docType, context = {}) =>
  api.post(`/documents/generate/${userId}`, { docType, context });
export const generateRFE = (userId, data) => api.post(`/documents/rfe/${userId}`, data);
export const getUserDocuments = (userId) => api.get(`/documents/user/${userId}`);
export const getDocument = (id) => api.get(`/documents/${id}`);
export const downloadPDF = (id) => `/api/documents/${id}/pdf`;
export const markReviewed = (id) => api.patch(`/documents/${id}/review`);

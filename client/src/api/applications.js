import axiosInstance from './axiosInstance';

export const applyToOpening = (openingId, data) =>
  axiosInstance.post('/applications/apply', { openingId, ...data });

export const getMyApplications = () =>
  axiosInstance.get('/applications/my');

export const getOpeningApplicants = (openingId) =>
  axiosInstance.get(`/applications/opening/${openingId}`);

export const updateApplicationStatus = (applicationId, status) =>
  axiosInstance.put(`/applications/${applicationId}/status`, { status });
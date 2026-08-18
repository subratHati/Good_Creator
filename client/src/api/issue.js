import axiosInstance from './axiosInstance';

export const submitIssue = (data) =>
  axiosInstance.post('/issues', data);

export const getAllIssues = (params) =>
  axiosInstance.get('/issues', { params });

export const updateIssueStatus = (id, status) =>
  axiosInstance.put(`/issues/${id}/status`, { status });
import axiosInstance from './axiosInstance';

export const createOpening = (data) =>
  axiosInstance.post('/openings', data);

export const getMyOpenings = () =>
  axiosInstance.get('/openings/my');

export const updateOpening = (id, data) =>
  axiosInstance.put(`/openings/${id}`, data);

export const deleteOpening = (id) =>
  axiosInstance.delete(`/openings/${id}`);

export const searchOpenings = (params) =>
  axiosInstance.get('/openings/search', { params });

export const getOpeningById = (id) =>
  axiosInstance.get(`/openings/${id}`);
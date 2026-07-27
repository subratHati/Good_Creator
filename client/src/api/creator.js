import axiosInstance from './axiosInstance';

export const getMyCreatorProfile = () =>
  axiosInstance.get('/creators/me');

export const createCreatorProfile = (data) =>
  axiosInstance.post('/creators/profile', data);

export const updateCreatorProfile = (data) =>
  axiosInstance.put('/creators/profile/details', data);

export const uploadCreatorPhoto = (formData) =>
  axiosInstance.put('/creators/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const searchCreators = (params) =>
  axiosInstance.get('/creators/search', { params });

export const getInstagramAuthUrl = () =>
  axiosInstance.get('/instagram/auth-url');

export const syncInstagram = () =>
  axiosInstance.post('/instagram/sync');

export const addManualInstagramStats = (data) =>
  axiosInstance.post('/instagram/manual-stats', data);

export const disconnectInstagram = () =>
  axiosInstance.post('/instagram/disconnect');
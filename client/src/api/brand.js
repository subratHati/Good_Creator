import axiosInstance from './axiosInstance';

export const getMyBrandProfile = () =>
  axiosInstance.get('/brands/me');

export const createBrandProfile = (data) =>
  axiosInstance.post('/brands/profile', data);

export const updateBrandProfile = (data) =>
  axiosInstance.put('/brands/profile', data);

export const uploadBrandLogo = (formData) =>
  axiosInstance.put('/brands/profile/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const saveCreator = (creatorId) =>
  axiosInstance.put(`/brands/save-creator/${creatorId}`);
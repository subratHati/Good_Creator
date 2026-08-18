import axiosInstance from './axiosInstance';

export const getCreatorCollaborations = (params) =>
  axiosInstance.get('/collaborations/creator', { params });

export const getBrandCollaborations = (params) =>
  axiosInstance.get('/collaborations/brand', { params });
import axiosInstance from './axiosInstance';

export const getAllCreators = (params) =>
  axiosInstance.get('/admin/creators', { params });

export const getAllBrands = () =>
  axiosInstance.get('/admin/brands');

export const sendAdminMessage = (data) =>
  axiosInstance.post('/admin/send-message', data);

export const getReferralStats = () =>
  axiosInstance.get('/admin/referral-stats');

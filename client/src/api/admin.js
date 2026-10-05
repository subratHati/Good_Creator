import axiosInstance from './axiosInstance';

export const getAllCreators = (params) =>
  axiosInstance.get('/admin/creators', { params });

export const getAllBrands = (params) =>
  axiosInstance.get('/admin/brands', { params });

export const sendAdminMessage = (data) =>
  axiosInstance.post('/admin/send-message', data);

export const getReferralStats = () =>
  axiosInstance.get('/admin/referral-stats');

export const getPaymentOverview = () =>
  axiosInstance.get('/payment/admin/overview');

export const markPayoutCompleted = (deliveryMessageId) =>
  axiosInstance.post('/payment/admin/mark-paid', { deliveryMessageId });

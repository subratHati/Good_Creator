import axiosInstance from './axiosInstance';

export const subscribeToPush = (subscription) =>
  axiosInstance.post('/push/subscribe', { subscription });

export const unsubscribeFromPush = (endpoint) =>
  axiosInstance.post('/push/unsubscribe', { endpoint });

export const sendAdminPush = (data) =>
  axiosInstance.post('/push/admin-send', data);

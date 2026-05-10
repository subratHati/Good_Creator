import axiosInstance from './axiosInstance';

export const createPaymentOrder = (data) =>
  axiosInstance.post('/payment/create-order', data);

export const verifyPayment = (data) =>
  axiosInstance.post('/payment/verify', data);

export const releasePayment = (data) =>
  axiosInstance.post('/payment/release', data);

export const getCreatorBankDetails = () =>
  axiosInstance.get('/payment/creator-bank');

export const saveCreatorBankDetails = (data) =>
  axiosInstance.put('/payment/creator-bank', data);

import axiosInstance from './axiosInstance';

export const checkDeleteAccount = () =>
  axiosInstance.get('/account/delete-check');

export const deleteMyAccount = (data) =>
  axiosInstance.post('/account/delete', data);

export const getDeletedAccounts = (params) =>
  axiosInstance.get('/account/deleted', { params });
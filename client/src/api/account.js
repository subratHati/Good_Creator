import axiosInstance from './axiosInstance';

export const checkDeleteAccount = () =>
  axiosInstance.get('/account/delete-check');

export const deleteMyAccount = (data) =>
  axiosInstance.post('/account/delete', data);

export const getDeletedAccounts = (params) =>
  axiosInstance.get('/account/deleted', { params });

// the "please set your location" pop-up
export const getLocationStatus = () =>
  axiosInstance.get('/account/location-status');

// { state, city }  or  { outsideIndia: true, state: <country>, city }
export const saveMyLocation = (data) =>
  axiosInstance.put('/account/location', data);
// client/src/api/collaborationHistory.js
import axiosInstance from './axiosInstance';

export const getMyCollabHistory = () =>
  axiosInstance.get('/collaboration-history/mine');
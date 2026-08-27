import axiosInstance from './axiosInstance';

export const getUserAnalytics = (params) =>
  axiosInstance.get('/analytics/users', { params });

export const getCampaignAnalytics = (params) =>
  axiosInstance.get('/analytics/campaigns', { params });

export const getCollabAnalytics = (params) =>
  axiosInstance.get('/analytics/collabs', { params });

export const getBrandsWithConversations = (params) =>
  axiosInstance.get('/analytics/conversation-brands', { params });

export const exportBrandConversations = (brandId) =>
  axiosInstance.get(`/analytics/conversation-brands/${brandId}/export`);
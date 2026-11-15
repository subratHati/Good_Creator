import axiosInstance from './axiosInstance';

export const getAssistantChatList = (params) =>
  axiosInstance.get('/admin-assistant/list', { params });

export const getAssistantChatForAdmin = (conversationId, params) =>
  axiosInstance.get(`/admin-assistant/${conversationId}`, { params });

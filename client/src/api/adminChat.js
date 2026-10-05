import axiosInstance from './axiosInstance';

export const getAdminChatList = (params) =>
  axiosInstance.get('/admin-chat/list', { params });

export const startAdminConversation = (userId) =>
  axiosInstance.post('/admin-chat/start', { userId });

export const getMyAdminConversation = () =>
  axiosInstance.get('/admin-chat/mine');

export const getAdminUnreadCount = () =>
  axiosInstance.get('/admin-chat/unread-count');

export const getAdminMessages = (conversationId) =>
  axiosInstance.get(`/admin-chat/${conversationId}/messages`);

export const sendAdminChatMessage = (conversationId, data) =>
  axiosInstance.post(`/admin-chat/${conversationId}/messages`, data);

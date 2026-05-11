import axiosInstance from './axiosInstance';

export const getConversations = () =>
  axiosInstance.get('/chat/conversations');

export const getOrCreateConversation = (targetId) =>
  axiosInstance.post('/chat/conversations', { targetId });

export const getMessages = (conversationId) =>
  axiosInstance.get(`/chat/conversations/${conversationId}/messages`);

export const sendMessage = (conversationId, data) =>
  axiosInstance.post(`/chat/conversations/${conversationId}/messages`, data);

export const getConversationById = (conversationId) =>
  axiosInstance.get(`/chat/conversations/${conversationId}`);

export const getUnreadCount = () =>
  axiosInstance.get('/chat/unread');

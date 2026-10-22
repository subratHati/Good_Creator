import axiosInstance from './axiosInstance';

export const getMyAssistantConversation = () => axiosInstance.get('/assistant/mine');
export const getAssistantMessages = () => axiosInstance.get('/assistant/messages');
export const getSupportUnreadCount = () => axiosInstance.get('/assistant/support-unread');
export const sendAssistantMessage = (text) => axiosInstance.post('/assistant/messages', { text });
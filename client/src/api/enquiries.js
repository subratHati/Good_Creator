import axiosInstance from './axiosInstance';

export const sendEnquiry = (creatorId, message) =>
  axiosInstance.post('/enquiries', { creatorId, message });

export const getMyEnquiries = () =>
  axiosInstance.get('/enquiries/received');

export const markEnquirySeen = (enquiryId) =>
  axiosInstance.put(`/enquiries/${enquiryId}/seen`);
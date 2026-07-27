import axiosInstance from './axiosInstance';

export const registerUser = (data) =>
  axiosInstance.post('/auth/register', data);

export const loginUser = (data) =>
  axiosInstance.post('/auth/login', data);

export const saveReferralSource = (data) =>
  axiosInstance.put('/auth/referral-source', data);

// export const getMe = () =>
//   axiosInstance.get('/auth/me');

export const verifyOtp = (data) => axiosInstance.post('/auth/verify-otp', data);
export const resendOtp = (data) => axiosInstance.post('/auth/resend-otp', data);
export const forgotPassword = (data) => axiosInstance.post('/auth/forgot-password', data);
export const resetPassword = (data) => axiosInstance.post('/auth/reset-password', data);
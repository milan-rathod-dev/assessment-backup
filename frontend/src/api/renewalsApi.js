import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const enhanced = new Error(data?.error ?? error.message ?? 'Request failed');
    enhanced.status = error.response?.status;
    enhanced.details = data?.details ?? [];
    enhanced.rawData = data;
    return Promise.reject(enhanced);
  }
);

export const fetchRenewals = async (params = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );
  const { data } = await api.get('/renewals', { params: cleaned });
  return data;
};

export const generateRenewals = async (month) => {
  const { data } = await api.post('/renewals/generate', { month });
  return data;
};

export const retryRenewal = async (id) => {
  const { data } = await api.post(`/renewals/${id}/retry`);
  return data;
};

export const simulateWebhook = async (id, outcome, failureReason) => {
  const { data } = await api.post(`/renewals/${id}/webhook`, { outcome, failureReason });
  return data;
};

export default api;

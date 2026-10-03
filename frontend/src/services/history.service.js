import api from './api.js';

export async function fetchInterviewHistory() {
  const response = await api.get('/interviews/history');
  return response.data.data;
}

export async function fetchProgressTrend() {
  const response = await api.get('/progress/trend');
  return response.data.data;
}
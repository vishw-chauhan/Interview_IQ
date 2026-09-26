import api from './api.js';

export async function createInterview({ roleId, resumeId, mode, difficulty }) {
  const response = await api.post('/interviews', { roleId, resumeId, mode, difficulty });
  return response.data.data;
}

export async function fetchInterviews() {
  const response = await api.get('/interviews');
  return response.data.data;
}

export async function fetchInterview(id) {
  const response = await api.get(`/interviews/${id}`);
  return response.data.data;
}

export async function generateQuestions(id) {
  const response = await api.post(`/interviews/${id}/questions`, {}, { timeout: 60000 });
  return response.data.data;
}
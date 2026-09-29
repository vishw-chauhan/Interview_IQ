import api from './api.js';

export async function fetchSkillAnalysis() {
  const response = await api.get('/skills');
  return response.data.data;
}

export async function generateSkillAnalysis() {
  const response = await api.post('/skills/analyze', {}, { timeout: 45000 });
  return response.data.data;
}
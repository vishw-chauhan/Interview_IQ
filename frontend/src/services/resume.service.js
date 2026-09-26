import api from './api.js';

export async function uploadResume({ file, targetRoleId }) {
  const formData = new FormData();
  formData.append('resume', file);
  if (targetRoleId) {
    formData.append('targetRoleId', targetRoleId);
  }

  const response = await api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function fetchResumes() {
  const response = await api.get('/resumes');
  return response.data.data;
}

export async function fetchResume(id) {
  const response = await api.get(`/resumes/${id}`);
  return response.data.data;
}

export async function deleteResume(id) {
  await api.delete(`/resumes/${id}`);
}

export async function analyzeResume(id) {
  // Analysis can take several seconds — give it a longer timeout than the
  // shared 15s default so a slow-but-successful AI call isn't cut off.
  const response = await api.post(`/resumes/${id}/analyze`, {}, { timeout: 45000 });
  return response.data.data;
}

export async function improveResume(id) {
  const response = await api.post(`/resumes/${id}/improve`, {}, { timeout: 45000 });
  return response.data.data;
}
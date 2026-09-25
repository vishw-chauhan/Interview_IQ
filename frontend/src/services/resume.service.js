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

export async function deleteResume(id) {
  await api.delete(`/resumes/${id}`);
}
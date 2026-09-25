import api from './api.js';

export async function fetchRoles() {
  const response = await api.get('/roles');
  return response.data.data;
}
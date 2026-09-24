import api from './api.js';

// The backend answers 503 when the API is up but the database is down.
// We treat both 200 and 503 as "the API answered" so the UI can show which part failed.
export async function getHealth() {
  const response = await api.get('/health', {
    validateStatus: (status) => status === 200 || status === 503,
  });
  return response.data;
}
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;

  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }

  if (error?.request && !error?.response) {
    return 'Cannot reach the server. Check your connection and try again.';
  }

  if (error?.response?.status >= 500) {
    return 'The server is not responding right now. Please try again in a moment.';
  }

  return fallback;
}
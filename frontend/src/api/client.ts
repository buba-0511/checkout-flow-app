import axios, { AxiosError } from 'axios';
import type { ApiError, ApiErrorResponse } from './types';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Success: unwrap { success: true, data } so callers get the payload directly.
apiClient.interceptors.response.use(
  (response) => response.data.data,
  (error: AxiosError<ApiErrorResponse>) => {
    const envelope = error.response?.data;

    const apiError: ApiError =
      envelope && envelope.success === false
        ? { ...envelope.error, status: error.response?.status }
        : {
            code: error.response ? 'UNEXPECTED_RESPONSE' : 'NETWORK_ERROR',
            message: error.response
              ? 'The server returned an unexpected response. Please try again.'
              : 'Could not reach the server. Check your connection and try again.',
            status: error.response?.status,
          };

    return Promise.reject(apiError);
  },
);

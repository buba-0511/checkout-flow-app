import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiError, ApiErrorResponse, ApiSuccessResponse } from './types';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

type SuccessResponseLike = {
  data: ApiSuccessResponse<unknown>
}

// Unwraps { success: true, data } so callers get the payload directly.
export function onFulfilled(response: SuccessResponseLike) {
  return response.data.data
}

type ResponseErrorLike = {
  response?: {
    status?: number
    data?: ApiErrorResponse
  }
}

export function onRejected(error: ResponseErrorLike): Promise<never> {
  const envelope = error.response?.data

  const apiError: ApiError =
    envelope && envelope.success === false
      ? { ...envelope.error, status: error.response?.status }
      : {
          code: error.response ? 'UNEXPECTED_RESPONSE' : 'NETWORK_ERROR',
          message: error.response
            ? 'The server returned an unexpected response. Please try again.'
            : 'Could not reach the server. Check your connection and try again.',
          status: error.response?.status,
        }

  return Promise.reject(apiError)
}

apiClient.interceptors.response.use(
  onFulfilled as unknown as (response: AxiosResponse) => AxiosResponse,
  onRejected,
)

// Cast needed: the interceptor above resolves each call to T, not AxiosResponse<T>.
export const api = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.get(url, config) as unknown as Promise<T>
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.post(url, data, config) as unknown as Promise<T>
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.put(url, data, config) as unknown as Promise<T>
  },
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.patch(url, data, config) as unknown as Promise<T>
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.delete(url, config) as unknown as Promise<T>
  },
}

import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { ApiError, ApiErrorResponse, ApiSuccessResponse } from './types';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Narrower than AxiosResponse on purpose — see ResponseErrorLike below for why.
type SuccessResponseLike = {
  data: ApiSuccessResponse<unknown>
}

// Success: unwrap { success: true, data } so callers get the payload directly.
// Exported (rather than inlined below) so each branch can be unit-tested
// without going through a real HTTP call.
export function onFulfilled(response: SuccessResponseLike) {
  return response.data.data
}

// Narrower than AxiosError on purpose: this is all onRejected actually reads.
// Lets tests build plain object literals instead of faking a whole AxiosError.
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

// axios types the fulfilled handler as returning AxiosResponse, but this one
// deliberately unwraps to the payload instead — that's the whole point of
// the interceptor. Asserting the exact shape axios expects (rather than
// `any`) keeps the type hole scoped to this one signature.
apiClient.interceptors.response.use(
  onFulfilled as unknown as (response: AxiosResponse) => AxiosResponse,
  onRejected,
)

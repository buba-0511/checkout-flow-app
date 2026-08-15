// Mirrors backend/src/common/dto/api-response.ts — the contract between the two.
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// What every failed request rejects with, regardless of cause (backend
// error envelope, network failure, or an unexpected non-JSON response).
// Redux thunks use this directly with rejectWithValue.
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status?: number;
}

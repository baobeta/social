export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams {
  q?: string;
}

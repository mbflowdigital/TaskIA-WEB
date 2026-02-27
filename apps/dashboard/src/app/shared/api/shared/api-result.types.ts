export interface ApiResult<T = unknown> {
  isSuccess: boolean;
  message: string;
  errors: string[];
  data?: T;
}

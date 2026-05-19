import axios, { type AxiosRequestConfig } from "axios";
import type { ApiErrorBody, ApiSuccessBody } from "./types";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;

  public constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type HttpRequestOptions = Omit<AxiosRequestConfig, "baseURL" | "data" | "url"> & {
  token?: string | null;
  body?: BodyInit | null;
};

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

const toApiClientError = (error: unknown): ApiClientError => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status ?? 0;
    const apiError = error.response?.data?.error;

    if (apiError) {
      return new ApiClientError(apiError.message, status, apiError.code);
    }

    return new ApiClientError(error.message || "Request failed", status, "REQUEST_FAILED");
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message, 0, "REQUEST_FAILED");
  }

  return new ApiClientError("Request failed", 0, "REQUEST_FAILED");
};

export const httpRequest = async <TResponse>(path: string, options: HttpRequestOptions = {}): Promise<TResponse> => {
  const { token, headers, body, ...config } = options;

  try {
    const response = await axiosClient.request<ApiSuccessBody<TResponse>>({
      ...config,
      url: path,
      data: body,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      }
    });

    return response.data.data;
  } catch (error: unknown) {
    throw toApiClientError(error);
  }
};

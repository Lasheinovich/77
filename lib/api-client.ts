import { logger } from './logger';

/**
 * HTTP methods supported by the API client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Options for the API request
 */
export interface ApiRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  signal?: AbortSignal;
  timeout?: number;
}

/**
 * API client response type
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

/**
 * Error returned by the API client
 */
export class ApiError extends Error {
  status: number;
  data: unknown;
  
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

// Map of services and their base URLs
const SERVICE_ENDPOINTS = {
  auth: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || '/api/auth',
  users: process.env.NEXT_PUBLIC_USERS_SERVICE_URL || '/api/users',
  orchestrator: process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || '/api/orchestrator',
  monitoring: process.env.NEXT_PUBLIC_MONITORING_URL || '/api/monitoring',
  payments: process.env.NEXT_PUBLIC_PAYMENTS_URL || '/api/payments',
  aiMiner: process.env.NEXT_PUBLIC_AI_MINER_URL || '/api/ai-miner',
  nlpEngine: process.env.NEXT_PUBLIC_NLP_ENGINE_URL || '/api/nlp-engine',
  dataProcessing: process.env.NEXT_PUBLIC_DATA_PROCESSING_URL || '/api/data-processing',
} as const;

// Type for the service names
export type ServiceName = keyof typeof SERVICE_ENDPOINTS;

/**
 * Centralized API client for making HTTP requests to backend services
 */
export class ApiClient {
  /**
   * Creates a new API client instance
   * @param baseUrl - Optional base URL for all requests
   */
  constructor(private baseUrl: string = '') {}

  /**
   * Creates a new instance of the API client for a specific service
   * @param service - The service to create a client for
   * @returns A new API client instance
   */
  static forService(service: ServiceName): ApiClient {
    return new ApiClient(SERVICE_ENDPOINTS[service]);
  }

  /**
   * Makes a request to the API
   * @param endpoint - The endpoint to make the request to
   * @param options - The options for the request
   * @returns The response from the API
   * @throws {ApiError} If the response is not ok
   */
  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    const { 
      method = 'GET', 
      headers = {}, 
      body,
      timeout = 30000, // Default timeout of 30 seconds
      ...restOptions 
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;
    
    try {
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: options.signal || controller.signal,
        ...restOptions,
      };

      if (body) {
        requestOptions.body = JSON.stringify(body);
      }

      logger.debug(`API Request: ${method} ${url}`);
      const response = await fetch(url, requestOptions);
      
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json() as T;
      } else if (contentType?.includes('text/')) {
        data = await response.text() as unknown as T;
      } else {
        data = {} as T;
      }

      if (!response.ok) {
        throw new ApiError(
          `API request failed with status ${response.status}`, 
          response.status, 
          data
        );
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
        ok: response.ok,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw new ApiError(error.message, 500);
      }
      
      throw new ApiError('Unknown error occurred', 500);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Makes a GET request to the API
   * @param endpoint - The endpoint to make the request to
   * @param options - The options for the request
   * @returns The response from the API
   */
  async get<T>(endpoint: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    const response = await this.request<T>(endpoint, { ...options, method: 'GET' });
    return response.data;
  }

  /**
   * Makes a POST request to the API
   * @param endpoint - The endpoint to make the request to
   * @param body - The body of the request
   * @param options - The options for the request
   * @returns The response from the API
   */
  async post<T>(endpoint: string, body?: unknown, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    const response = await this.request<T>(endpoint, { ...options, method: 'POST', body });
    return response.data;
  }

  /**
   * Makes a PUT request to the API
   * @param endpoint - The endpoint to make the request to
   * @param body - The body of the request
   * @param options - The options for the request
   * @returns The response from the API
   */
  async put<T>(endpoint: string, body?: unknown, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    const response = await this.request<T>(endpoint, { ...options, method: 'PUT', body });
    return response.data;
  }

  /**
   * Makes a PATCH request to the API
   * @param endpoint - The endpoint to make the request to
   * @param body - The body of the request
   * @param options - The options for the request
   * @returns The response from the API
   */
  async patch<T>(endpoint: string, body?: unknown, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    const response = await this.request<T>(endpoint, { ...options, method: 'PATCH', body });
    return response.data;
  }

  /**
   * Makes a DELETE request to the API
   * @param endpoint - The endpoint to make the request to
   * @param options - The options for the request
   * @returns The response from the API
   */
  async delete<T>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<T> {
    const response = await this.request<T>(endpoint, { ...options, method: 'DELETE' });
    return response.data;
  }
}

// Export a default instance
export const api = new ApiClient();
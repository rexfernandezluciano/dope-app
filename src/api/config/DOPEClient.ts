/** @format */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

export enum RequestMethod {
	GET = "GET",
	POST = "POST",
	PATCH = "PATCH",
	PUT = "PUT",
	DELETE = "DELETE",
	OPTIONS = "OPTIONS", // Fixed typo: was "OPTION"
	HEAD = "HEAD",
}

export interface ApiResponse<T = any> {
	data: T;
	status: number;
	message?: string;
	success: boolean;
}

export interface ApiError {
	message: string;
	status?: number;
	code?: string;
	details?: any;
}

export interface DOPEClientConfig {
	baseURL?: string;
	timeout?: number;
	retries?: number;
	retryDelay?: number;
	defaultHeaders?: Record<string, string>;
}

class DOPEClientError extends Error {
	public status?: number;
	public code?: string;
	public details?: any;

	constructor(message: string, status?: number, code?: string, details?: any) {
		super(message);
		this.name = "DOPEClientError";
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

class DOPEClient {
	private static instance: DOPEClient;
	private client: AxiosInstance;
	private config: DOPEClientConfig;

	private constructor(config?: DOPEClientConfig) {
		this.config = {
			baseURL: "https://api.dopp.eu.org",
			timeout: 60 * 1000,
			retries: 3,
			retryDelay: 1000,
			defaultHeaders: {
				"Content-Type": "application/json; charset=UTF-8",
				Accept: "application/json",
				"User-Agent": "DOPE-Network-Client/2.0",
			},
			...config,
		};

		this.client = axios.create({
			baseURL: this.config.baseURL,
			timeout: this.config.timeout,
			headers: this.config.defaultHeaders,
		});

		this.setupInterceptors();
	}

	static getInstance(config?: DOPEClientConfig): DOPEClient {
		if (!this.instance) {
			this.instance = new DOPEClient(config);
		}
		return this.instance;
	}

	private setupInterceptors(): void {
		// Request interceptor
		this.client.interceptors.request.use(
			config => {
				console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
				return config;
			},
			error => {
				console.error("❌ Request Error:", error);
				return Promise.reject(error);
			},
		);

		// Response interceptor
		this.client.interceptors.response.use(
			response => {
				console.log(`✅ API Response: ${response.status} ${response.config.url}`);
				return response;
			},
			error => {
				console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`);
				return Promise.reject(error);
			},
		);
	}

	private async retryRequest<T>(requestFn: () => Promise<AxiosResponse<T>>, retries: number = this.config.retries || 3): Promise<AxiosResponse<T>> {
		try {
			return await requestFn();
		} catch (error) {
			if (retries > 0 && this.shouldRetry(error as AxiosError)) {
				console.log(`🔄 Retrying request... (${retries} attempts left)`);
				await this.delay(this.config.retryDelay || 1000);
				return this.retryRequest(requestFn, retries - 1);
			}
			throw error;
		}
	}

	private shouldRetry(error: AxiosError): boolean {
		// Retry on network errors or 5xx status codes
		return !error.response || error.code === "ECONNABORTED" || error.code === "NETWORK_ERROR" || (error.response.status >= 500 && error.response.status < 600);
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private handleApiError(error: AxiosError): never {
		if (error.response) {
			// Server responded with error status
			const { status, data } = error.response;
			const message = (data as any)?.message || `HTTP ${status} Error`;
			const code = (data as any)?.code || `HTTP_${status}`;

			throw new DOPEClientError(message, status, code, data);
		} else if (error.request) {
			// Network error
			throw new DOPEClientError("Network error - please check your connection", 0, "NETWORK_ERROR");
		} else {
			// Request setup error
			throw new DOPEClientError(error.message || "Request failed", 0, "REQUEST_ERROR");
		}
	}

	public async apiRequest<T = any>(
		path: string,
		method: RequestMethod = RequestMethod.GET,
		data?: any,
		options?: {
			headers?: Record<string, string>;
			params?: Record<string, any>;
			timeout?: number;
			retries?: number;
		},
	): Promise<ApiResponse<T>> {
		try {
			const requestConfig: AxiosRequestConfig = {
				url: path,
				method: method as any,
				data: method !== RequestMethod.GET && method !== RequestMethod.HEAD ? data : undefined,
				params: method === RequestMethod.GET ? data : options?.params,
				headers: options?.headers,
				timeout: options?.timeout,
			};

			const response = await this.retryRequest(() => this.client(requestConfig), options?.retries);

			// Validate response
			if (!response || typeof response.status === "undefined") {
				throw new DOPEClientError("Invalid response received", 0, "INVALID_RESPONSE");
			}

			// Handle different status codes
			if (response.status >= 200 && response.status < 300) {
				return {
					data: response.data,
					status: response.status,
					message: response.data?.message || "Success",
					success: true,
				};
			} else {
				throw new DOPEClientError(response.data?.message || "Request failed", response.status, `HTTP_${response.status}`, response.data);
			}
		} catch (error) {
			if (error instanceof DOPEClientError) {
				throw error;
			}

			if (axios.isAxiosError(error)) {
				this.handleApiError(error);
			}

			throw new DOPEClientError(error instanceof Error ? error.message : "Unknown error occurred", 0, "UNKNOWN_ERROR");
		}
	}

	// Convenience methods for different HTTP methods
	public async get<T = any>(path: string, params?: any, options?: { headers?: Record<string, string>; timeout?: number }): Promise<ApiResponse<T>> {
		return this.apiRequest<T>(path, RequestMethod.GET, params, options);
	}

	public async post<T = any>(path: string, data?: any, options?: { headers?: Record<string, string>; timeout?: number }): Promise<ApiResponse<T>> {
		return this.apiRequest<T>(path, RequestMethod.POST, data, options);
	}

	public async put<T = any>(path: string, data?: any, options?: { headers?: Record<string, string>; timeout?: number }): Promise<ApiResponse<T>> {
		return this.apiRequest<T>(path, RequestMethod.PUT, data, options);
	}

	public async patch<T = any>(path: string, data?: any, options?: { headers?: Record<string, string>; timeout?: number }): Promise<ApiResponse<T>> {
		return this.apiRequest<T>(path, RequestMethod.PATCH, data, options);
	}

	public async delete<T = any>(path: string, options?: { headers?: Record<string, string>; timeout?: number }): Promise<ApiResponse<T>> {
		return this.apiRequest<T>(path, RequestMethod.DELETE, undefined, options);
	}

	// Configuration methods
	public setDefaultHeader(key: string, value: string): void {
		this.client.defaults.headers.common[key] = value;
	}

	public removeDefaultHeader(key: string): void {
		delete this.client.defaults.headers.common[key];
	}

	public setBaseURL(url: string): void {
		this.client.defaults.baseURL = url;
	}

	public setTimeout(timeout: number): void {
		this.client.defaults.timeout = timeout;
	}
}

export default DOPEClient;
export { DOPEClientError };

/** @format */

import DOPEClient, { RequestMethod, DOPEClientError, ApiResponse } from "../api/config/DOPEClient";
import { saveSecure, getSecure, removeSecure } from "../utils/storage.utils";

// Enhanced types with better structure
export interface User {
	uid: string;
	name: string;
	username: string;
	email: string;
	bio?: string;
	photoURL?: string;
	coverPhotoURL?: string;
	gender?: "male" | "female" | "non_binary" | "prefer_not_to_say";
	birthday?: string;
	hasBlueCheck: boolean;
	membership: {
		subscription: "free" | "premium" | "pro";
		nextBillingDate?: string;
	};
	stats?: {
		posts: number;
		followers: number;
		followings: number;
		likes: number;
	};
	privacy: {
		profile: "public" | "private";
		comments: "public" | "followers" | "private";
		sharing: boolean;
		chat: "public" | "followers" | "private";
	};
	hasVerifiedEmail: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
	tfaCode?: string;
}

export interface RegisterData {
	name: string;
	email: string;
	username: string;
	password: string;
	photoURL?: string;
	coverPhotoURL?: string;
	gender?: User["gender"];
	birthday?: string;
	subscription?: User["membership"]["subscription"];
	privacy?: Partial<User["privacy"]>;
}

export interface AuthResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface AuthTokenData {
	token: string;
	user: User;
	sessionId?: string;
}

export interface AvailabilityResponse {
	available: boolean;
	error?: string;
}

// Auth state change listener type
export type AuthStateListener = (user: User | null) => void;

class AuthService {
	private static instance: AuthService;
	private client: DOPEClient;
	private currentUser: User | null = null;
	private authToken: string | null = null;
	private initializationPromise: Promise<void> | null = null;
	private authStateListeners: Set<AuthStateListener> = new Set();

	// Constants
	private static readonly TOKEN_STORAGE_KEY = "authToken";
	private static readonly TOKEN_EXPIRY_DAYS = 7;
	private static readonly API_ENDPOINTS = {
		LOGIN: "/v1/auth/login",
		REGISTER: "/v1/auth/register",
		VERIFY_EMAIL: "/v1/auth/verify-email",
		ME: "/v1/auth/me",
		LOGOUT: "/v1/auth/logout",
		CHECK_USERNAME: "/v1/auth/check-username",
		CHECK_EMAIL: "/v1/auth/check-email",
		FORGOT_PASSWORD: "/v1/auth/forgot-password",
		RESET_PASSWORD: "/v1/auth/reset-password",
	} as const;

	private constructor() {
		this.client = DOPEClient.getInstance();
		this.initialize();
	}

	public static getInstance(): AuthService {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService();
		}
		return AuthService.instance;
	}

	/**
	 * Initialize the authentication service by checking for stored tokens
	 */
	private initialize(): void {
		if (this.initializationPromise) {
			return;
		}

		this.initializationPromise = this.restoreAuthState()
			.then(() => {
				console.log("AuthService initialized successfully");
			})
			.catch(error => {
				console.error("AuthService initialization failed:", error);
				this.clearAuthState();
			});
	}

	/**
	 * Restore authentication state from secure storage
	 */
	private async restoreAuthState(): Promise<void> {
		try {
			const token = await getSecure(AuthService.TOKEN_STORAGE_KEY, { encrypt: true });
			if (!token) {
				return;
			}

			this.authToken = token;
			const userResponse = await this.fetchCurrentUser();

			if (userResponse.success && userResponse.data) {
				this.currentUser = userResponse.data;
				this.notifyAuthStateChange(userResponse.data);
			} else {
				// Token is invalid, clear it
				await this.clearStoredToken();
				this.clearAuthState();
			}
		} catch (error) {
			console.error("Failed to restore auth state:", error);
			await this.clearStoredToken();
			this.clearAuthState();
		}
	}

	/**
	 * Fetch current user information from the API
	 */
	private async fetchCurrentUser(): Promise<AuthResponse<User>> {
		if (!this.authToken) {
			return { success: false, error: "No authentication token available" };
		}

		try {
			const response = await this.client.get<{
				status: string;
				user: User;
				message?: string;
			}>(AuthService.API_ENDPOINTS.ME, undefined, {
				headers: { Authorization: `Bearer ${this.authToken}` },
			});

			if (response.success && response.data.status === "ok" && response.data.user) {
				return { success: true, data: response.data.user };
			}

			return { success: false, error: response.data.message || "Failed to fetch user data" };
		} catch (error) {
			console.error("Error fetching current user:", error);

			if (error instanceof DOPEClientError) {
				// Handle specific authentication errors
				if (error.status === 401) {
					// Token expired or invalid, clear auth state
					await this.clearStoredToken();
					this.clearAuthState();
					return { success: false, error: "Authentication expired. Please log in again." };
				}
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : "Network error occurred",
			};
		}
	}

	/**
	 * Handle API errors with enhanced context
	 */
	private handleApiError(error: unknown, context: string): AuthResponse {
		console.error(`AuthService ${context} error:`, error);

		if (error instanceof DOPEClientError) {
			switch (error.status) {
				case 400:
					return { success: false, error: error.message || "Invalid request data" };
				case 401:
					return { success: false, error: "Invalid credentials or session expired" };
				case 403:
					return { success: false, error: "Access denied" };
				case 404:
					return { success: false, error: "Service not found" };
				case 409:
					return { success: false, error: error.message || "Conflict - resource already exists" };
				case 422:
					return { success: false, error: error.message || "Invalid input data" };
				case 429:
					return { success: false, error: "Too many attempts. Please try again later." };
				case 500:
				case 502:
				case 503:
				case 504:
					return { success: false, error: "Server error. Please try again later." };
				default:
					return { success: false, error: error.message || `Error during ${context}` };
			}
		}

		if (error instanceof Error) {
			return {
				success: false,
				error: error.message.includes("NETWORK_ERROR") ? "Network connection error. Please check your internet connection." : error.message,
			};
		}

		return { success: false, error: `An unexpected error occurred during ${context}` };
	}

	/**
	 * Store authentication token securely
	 */
	private async storeAuthToken(token: string): Promise<void> {
		const expirationDate = new Date();
		expirationDate.setDate(expirationDate.getDate() + AuthService.TOKEN_EXPIRY_DAYS);

		await saveSecure(AuthService.TOKEN_STORAGE_KEY, token, {
			encrypt: true,
			expiration: expirationDate,
		});
	}

	/**
	 * Clear stored authentication token
	 */
	private async clearStoredToken(): Promise<void> {
		try {
			await removeSecure(AuthService.TOKEN_STORAGE_KEY);
		} catch (error) {
			console.warn("Failed to clear stored token:", error);
		}
	}

	/**
	 * Clear local authentication state
	 */
	private clearAuthState(): void {
		this.authToken = null;
		this.currentUser = null;
		this.notifyAuthStateChange(null);
	}

	/**
	 * Notify all listeners of authentication state changes
	 */
	private notifyAuthStateChange(user: User | null): void {
		this.authStateListeners.forEach(listener => {
			try {
				listener(user);
			} catch (error) {
				console.error("Auth state listener error:", error);
			}
		});
	}

	/**
	 * Wait for initialization to complete
	 */
	public async waitForInitialization(): Promise<void> {
		if (this.initializationPromise) {
			await this.initializationPromise;
		}
	}

	/**
	 * User authentication with credentials
	 */
	public async login(credentials: LoginCredentials): Promise<AuthResponse<User>> {
		try {
			const response = await this.client.post<{
				token: string;
				user: User;
				sessionId?: string;
				message?: string;
			}>(AuthService.API_ENDPOINTS.LOGIN, credentials);

			if (response.success && response.data.token && response.data.user) {
				this.authToken = response.data.token;
				this.currentUser = response.data.user;

				await this.storeAuthToken(response.data.token);
				this.notifyAuthStateChange(response.data.user);

				return { success: true, data: response.data.user };
			}

			return {
				success: false,
				error: response.data.message || "Invalid credentials provided",
			};
		} catch (error) {
			return this.handleApiError(error, "login");
		}
	}

	/**
	 * User registration
	 */
	public async register(userData: RegisterData): Promise<AuthResponse<{ verificationId: string }>> {
		try {
			const response = await this.client.post<{
				verificationId: string;
				message?: string;
			}>(AuthService.API_ENDPOINTS.REGISTER, userData);

			if (response.success && response.data.verificationId) {
				return {
					success: true,
					data: { verificationId: response.data.verificationId },
				};
			}

			return {
				success: false,
				error: response.data.message || "Registration failed",
			};
		} catch (error) {
			return this.handleApiError(error, "registration");
		}
	}

	/**
	 * Email verification
	 */
	public async verifyEmail(email: string, code: string, verificationId: string): Promise<AuthResponse<void>> {
		try {
			const response = await this.client.post<{
				success: boolean;
				message?: string;
			}>(AuthService.API_ENDPOINTS.VERIFY_EMAIL, { email, code, verificationId });

			return response.success && response.data.success ? { success: true } : { success: false, error: response.data.message || "Email verification failed" };
		} catch (error) {
			return this.handleApiError(error, "email verification");
		}
	}

	/**
	 * Get current authenticated user
	 */
	public async getCurrentUser(): Promise<AuthResponse<User>> {
		await this.waitForInitialization();

		if (!this.isAuthenticated) {
			return { success: false, error: "User not authenticated" };
		}

		if (this.currentUser) {
			return { success: true, data: this.currentUser };
		}

		return await this.fetchCurrentUser();
	}

	/**
	 * User logout
	 */
	public async logout(): Promise<AuthResponse<void>> {
		try {
			if (this.authToken) {
				await this.client.post<any>(
					AuthService.API_ENDPOINTS.LOGOUT,
					{},
					{
						headers: { Authorization: `Bearer ${this.authToken}` },
						timeout: 5000, // Short timeout for logout
					},
				);
			}
		} catch (error) {
			console.warn("Logout API call failed:", error);
		} finally {
			// Always clear local state regardless of API response
			await this.clearStoredToken();
			this.clearAuthState();
		}

		return { success: true };
	}

	/**
	 * Check username availability
	 */
	public async checkUsernameAvailability(username: string): Promise<AvailabilityResponse> {
		if (!username.trim()) {
			return { available: false, error: "Username cannot be empty" };
		}

		try {
			const response = await this.client.post<{
				available: boolean;
				message?: string;
			}>(AuthService.API_ENDPOINTS.CHECK_USERNAME, { username });

			return { available: response.data.available };
		} catch (error) {
			console.error("Username availability check error:", error);
			return {
				available: false,
				error: error instanceof Error ? error.message : "Availability check failed",
			};
		}
	}

	/**
	 * Check email availability
	 */
	public async checkEmailAvailability(email: string): Promise<AvailabilityResponse> {
		if (!email.trim()) {
			return { available: false, error: "Email cannot be empty" };
		}

		try {
			const response = await this.client.post<{
				available: boolean;
				message?: string;
			}>(AuthService.API_ENDPOINTS.CHECK_EMAIL, { email });

			return { available: response.data.available };
		} catch (error) {
			console.error("Email availability check error:", error);
			return {
				available: false,
				error: error instanceof Error ? error.message : "Availability check failed",
			};
		}
	}

	/**
	 * Initiate password reset
	 */
	public async forgotPassword(email: string): Promise<AuthResponse<{ resetId: string }>> {
		if (!email.trim()) {
			return { success: false, error: "Email address is required" };
		}

		try {
			const response = await this.client.post<{
				resetId: string;
				message?: string;
			}>(AuthService.API_ENDPOINTS.FORGOT_PASSWORD, { email });

			if (response.success && response.data.resetId) {
				return { success: true, data: { resetId: response.data.resetId } };
			}

			return {
				success: false,
				error: response.data.message || "Failed to initiate password reset",
			};
		} catch (error) {
			return this.handleApiError(error, "password reset initiation");
		}
	}

	/**
	 * Complete password reset
	 */
	public async resetPassword(email: string, code: string, resetId: string, newPassword: string): Promise<AuthResponse<void>> {
		if (!email.trim() || !code.trim() || !resetId.trim() || !newPassword.trim()) {
			return { success: false, error: "All fields are required for password reset" };
		}

		try {
			const response = await this.client.post<{
				success: boolean;
				message?: string;
			}>(AuthService.API_ENDPOINTS.RESET_PASSWORD, {
				email,
				code,
				resetId,
				newPassword,
			});

			return response.success && response.data.success ? { success: true } : { success: false, error: response.data.message || "Password reset failed" };
		} catch (error) {
			return this.handleApiError(error, "password reset");
		}
	}

	/**
	 * Refresh user data from server
	 */
	public async refreshUserData(): Promise<AuthResponse<User>> {
		if (!this.isAuthenticated) {
			return { success: false, error: "User not authenticated" };
		}

		try {
			const userResponse = await this.fetchCurrentUser();
			if (userResponse.success && userResponse.data) {
				this.currentUser = userResponse.data;
				this.notifyAuthStateChange(userResponse.data);
				return { success: true, data: userResponse.data };
			}

			return userResponse;
		} catch (error) {
			return this.handleApiError(error, "user data refresh");
		}
	}

	/**
	 * Update authentication headers for subsequent requests
	 */
	public updateAuthHeaders(): void {
		if (this.authToken) {
			this.client.setDefaultHeader("Authorization", `Bearer ${this.authToken}`);
		} else {
			this.client.removeDefaultHeader("Authorization");
		}
	}

	/**
	 * Subscribe to authentication state changes
	 */
	public onAuthStateChanged(listener: AuthStateListener): () => void {
		this.authStateListeners.add(listener);

		// Immediately call with current state
		listener(this.currentUser);

		// Return unsubscribe function
		return () => {
			this.authStateListeners.delete(listener);
		};
	}

	/**
	 * Check authentication status asynchronously
	 */
	public async checkAuthStatus(): Promise<boolean> {
		await this.waitForInitialization();
		return this.isAuthenticated;
	}

	/**
	 * Validate current session by making a request to the server
	 */
	public async validateSession(): Promise<boolean> {
		if (!this.isAuthenticated) {
			return false;
		}

		try {
			const userResponse = await this.fetchCurrentUser();
			if (!userResponse.success) {
				// Session is invalid, clear auth state
				await this.clearStoredToken();
				this.clearAuthState();
				return false;
			}

			return true;
		} catch (error) {
			console.error("Session validation failed:", error);
			return false;
		}
	}

	// Public getters
	public get user(): User | null {
		return this.currentUser;
	}

	public get token(): string | null {
		return this.authToken;
	}

	public get isAuthenticated(): boolean {
		return Boolean(this.authToken && this.currentUser);
	}

	public get isInitialized(): boolean {
		return (
			this.initializationPromise === null ||
			this.initializationPromise.then(
				() => true,
				() => false,
			)
		);
	}
}

export default AuthService.getInstance();

/** @format */

import DOPEClient, { RequestMethod, DOPEClientError, ApiResponse } from "../api/config/DOPEClient";
import AuthService from "./AuthService";
import { Post, PollData, CreatePostData, PostFilters, PostResponse, VoteRequest, ShareRequest } from "../api/interface/post.interface";

class PostService {
	private static instance: PostService;
	private client: DOPEClient;

	// API endpoint constants
	private static readonly ENDPOINTS = {
		POSTS: "/v1/posts",
		FOLLOWING_FEED: "/v1/posts/feed/following",
		TRENDING_FEED: "/v1/recommendations/trending",
		USER_POSTS: "/v1/posts/user/me",
		POST_LIKE: (postId: string) => `/v1/posts/${postId}/like`,
		POST_SHARE: (postId: string) => `/v1/posts/${postId}/share`,
		POST_REPOST: (postId: string) => `/v1/posts/${postId}/repost`,
		POST_DELETE: (postId: string) => `/v1/posts/${postId}`,
		POST_VIEW: (postId: string) => `/v1/posts/${postId}/view`,
		POLL_VOTE: (pollId: string) => `/v1/polls/${pollId}/vote`,
		POST_BOOKMARK: (postId: string) => `/v1/posts/${postId}/bookmark`,
		POST_REPORT: (postId: string) => `/v1/posts/${postId}/report`,
	} as const;

	private constructor() {
		this.client = DOPEClient.getInstance();
	}

	public static getInstance(): PostService {
		if (!PostService.instance) {
			PostService.instance = new PostService();
		}
		return PostService.instance;
	}

	/**
	 * Generate authorization headers for authenticated requests
	 */
	private async getAuthHeaders(): Promise<Record<string, string>> {
		await AuthService.waitForInitialization();
		const token = AuthService.token;
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	/**
	 * Validate authentication status
	 */
	private async validateAuthentication(): Promise<boolean> {
		return await AuthService.checkAuthStatus();
	}

	/**
	 * Build query parameters from filters object
	 */
	private buildQueryParams(filters: PostFilters): Record<string, any> {
		const params: Record<string, any> = {};

		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== "") {
				params[key] = value;
			}
		});

		return params;
	}

	/**
	 * Handle API error processing with enhanced error context
	 */
	private handleApiError(error: unknown, context: string): PostResponse {
		console.error(`PostService ${context} error:`, error);

		if (error instanceof DOPEClientError) {
			// Enhanced error handling for specific HTTP status codes
			switch (error.status) {
				case 401:
					return {
						success: false,
						error: "Authentication required. Please log in again.",
					};
				case 403:
					return {
						success: false,
						error: "You don't have permission to perform this action.",
					};
				case 404:
					return {
						success: false,
						error: "The requested resource was not found.",
					};
				case 429:
					return {
						success: false,
						error: "Too many requests. Please try again later.",
					};
				case 500:
				case 502:
				case 503:
				case 504:
					return {
						success: false,
						error: "Server error. Please try again later.",
					};
				default:
					return {
						success: false,
						error: error.message || `An error occurred during ${context}`,
					};
			}
		}

		if (error instanceof Error) {
			return {
				success: false,
				error:
					error.message.includes("network") || error.message.includes("NETWORK_ERROR")
						? "Network connection error. Please check your internet connection."
						: error.message,
			};
		}

		return {
			success: false,
			error: `An unexpected error occurred during ${context}`,
		};
	}

	/**
	 * Retrieve posts with optional filtering and pagination
	 */
	public async getPosts(filters: PostFilters = {}): Promise<PostResponse<Post[]>> {
		try {
			const params = this.buildQueryParams(filters);
			const headers = await this.getAuthHeaders();

			const response = await this.client.get<{
				posts: Post[] & { nextCursor?: string; hasMore?: boolean; limit?: number };
				status: string;
				message?: string;
			}>(PostService.ENDPOINTS.POSTS, params, { headers });

			if (response.success && response.data.status === "ok" && response.data.posts) {
				return {
					success: true,
					data: response.data.posts,
					pagination: {
						nextCursor: response.data.posts.nextCursor,
						hasMore: response.data.posts.hasMore,
						limit: response.data.posts.limit,
					},
				};
			}

			return {
				success: false,
				error: response.data.message || "Failed to retrieve posts",
			};
		} catch (error: any) {
			return this.handleApiError(error, "posts retrieval");
		}
	}

	/**
	 * Retrieve posts from users that the current user follows
	 */
	public async getFollowingFeed(filters: PostFilters = {}): Promise<PostResponse<Post[]>> {
		const isAuthenticated = await this.validateAuthentication();
		if (!isAuthenticated) {
			return { success: false, error: "Authentication required to access following feed" };
		}

		try {
			const params = this.buildQueryParams(filters);
			const headers = await this.getAuthHeaders();

			const response = await this.client.get<{
				posts: Post[] & { nextCursor?: string; hasMore?: boolean; limit?: number };
			}>(PostService.ENDPOINTS.FOLLOWING_FEED, params, { headers });

			if (response.success && response.data.posts) {
				return {
					success: true,
					data: response.data.posts,
					pagination: {
						nextCursor: response.data.posts.nextCursor,
						hasMore: response.data.posts.hasMore,
						limit: response.data.posts.limit,
					},
				};
			}

			console.log("Following Feed Response:", response);

			return {
				success: false,
				error: response.message || "Failed to retrieve following feed",
			};
		} catch (error: any) {
			return this.handleApiError(error, "following feed retrieval");
		}
	}

	/**
	 * Retrieve trending posts based on engagement metrics
	 */
	public async getTrendingPosts(filters: PostFilters = {}): Promise<PostResponse<Post[]>> {
		try {
			const params = this.buildQueryParams(filters);
			const headers = await this.getAuthHeaders();

			const response = await this.client.get<{
				trending: Post[];
			}>(PostService.ENDPOINTS.TRENDING_FEED, params, { headers });

			if (response.success && response.data.trending) {
				return {
					success: true,
					data: response.data.trending,
					pagination: {
						nextCursor: null,
						hasMore: false,
						limit: 10,
					},
				};
			}

			return {
				success: false,
				error: response.message || "Failed to retrieve trending posts",
			};
		} catch (error) {
			return this.handleApiError(error, "trending posts retrieval");
		}
	}

	/**
	 * Create a new post with comprehensive validation
	 */
	public async createPost(postData: CreatePostData): Promise<PostResponse<Post>> {
		const isAuthenticated = await this.validateAuthentication();
		if (!isAuthenticated) {
			return { success: false, error: "Authentication required to create posts" };
		}

		// Validate post data
		const validationError = this.validatePostData(postData);
		if (validationError) {
			return { success: false, error: validationError };
		}

		try {
			const headers = await this.getAuthHeaders();
			const response = await this.client.post<{
				status: string;
				post: Post;
				message?: string;
			}>(PostService.ENDPOINTS.POSTS, postData, { headers });

			if (response.success && response.data.status === "ok" && response.data.post) {
				return {
					success: true,
					data: response.data.post,
				};
			}

			return {
				success: false,
				error: response.data.message || "Failed to create post",
			};
		} catch (error) {
			return this.handleApiError(error, "post creation");
		}
	}

	/**
	 * Validate post data before submission
	 */
	private validatePostData(postData: CreatePostData): string | null {
		if (postData.postType === "poll" && !postData.poll) {
			return "Poll data is required for poll posts";
		}

		if (postData.postType === "live_video" && !postData.liveVideoUrl) {
			return "Live video URL is required for live video posts";
		}

		if (postData.postType === "repost" && !postData.originalPostId) {
			return "Original post ID is required for reposts";
		}

		if (postData.poll) {
			if (!postData.poll.question.trim()) {
				return "Poll question cannot be empty";
			}
			if (postData.poll.options.length < 2) {
				return "Polls must have at least 2 options";
			}
			if (postData.poll.options.length > 10) {
				return "Polls cannot have more than 10 options";
			}
		}

		return null;
	}

	/**
	 * Toggle like status for a specific post
	 */
	public async likePost(postId: string, currentlyLiked: boolean = false): Promise<PostResponse<void>> {
		const isAuthenticated = await this.validateAuthentication();
		if (!isAuthenticated) {
			return { success: false, error: "Authentication required to like posts" };
		}

		try {
			const endpoint = PostService.ENDPOINTS.POST_LIKE(postId);
			const headers = await this.getAuthHeaders();

			const response = await this.client.post<any>(endpoint, {}, { headers });

			console.log("Like Response:", JSON.stringify(response, null, 2));

			return response.success ? { success: true } : { success: false, error: response.message || "Failed to update like status" };
		} catch (error) {
			return this.handleApiError(error, "like toggle");
		}
	}

	/**
	 * Share a post to external platforms or generate shareable link
	 */
	public async sharePost(postId: string, shareData: ShareRequest = {}): Promise<PostResponse<{ shareUrl?: string }>> {
		try {
			const headers = await this.getAuthHeaders();
			const response = await this.client.post<{
				success: boolean;
				shareUrl?: string;
				message?: string;
			}>(PostService.ENDPOINTS.POST_SHARE(postId), shareData, { headers });

			if (response.success && response.data.success) {
				return {
					success: true,
					data: { shareUrl: response.data.shareUrl },
				};
			}

			return {
				success: false,
				error: response.data.message || "Failed to share post",
			};
		} catch (error) {
			return this.handleApiError(error, "post sharing");
		}
	}

	/**
	 * Create a repost with optional additional content
	 */
	public async repostPost(postId: string, content?: string): Promise<PostResponse<Post>> {
		const isAuthenticated = await this.validateAuthentication();
		if (!isAuthenticated) {
			return { success: false, error: "Authentication required to repost" };
		}

		try {
			const headers = await this.getAuthHeaders();
			const response = await this.client.post<{
				success: boolean;
				post?: Post;
				message?: string;
			}>(PostService.ENDPOINTS.POST_REPOST(postId), { content: content?.trim() }, { headers });

			if (response.success && response.data.success && response.data.post) {
				return {
					success: true,
					data: response.data.post,
				};
			}

			return {
				success: false,
				error: response.data.message || "Failed to create repost",
			};
		} catch (error) {
			return this.handleApiError(error, "repost creation");
		}
	}

	/**
	 * Delete a post with proper authorization validation
	 */
	public async deletePost(postId: string): Promise<PostResponse<void>> {
		const isAuthenticated = await this.validateAuthentication();
		if (!isAuthenticated) {
			return { success: false, error: "Authentication required to delete posts" };
		}

		try {
			const headers = await this.getAuthHeaders();
			const response = await this.client.delete<{
				success: boolean;
				message?: string;
			}>(PostService.ENDPOINTS.POST_DELETE(postId), { headers });

			return response.success && response.data.success ? { success: true } : { success: false, error: response.data.message || "Failed to delete post" };
		} catch (error) {
			return this.handleApiError(error, "post deletion");
		}
	}

	/**
	 * Submit votes for a poll with validation
	 */
	public async voteOnPoll(pollId: string, optionIds: string[]): Promise<PostResponse<void>> {
		const isAuthenticated = await this.validateAuthentication();
		if (!isAuthenticated) {
			return { success: false, error: "Authentication required to vote on polls" };
		}

		if (!optionIds.length) {
			return { success: false, error: "At least one option must be selected" };
		}

		try {
			const headers = await this.getAuthHeaders();
			const response = await this.client.post<{
				success: boolean;
				message?: string;
			}>(PostService.ENDPOINTS.POLL_VOTE(pollId), { optionIds }, { headers });

			return response.success && response.data.success ? { success: true } : { success: false, error: response.data.message || "Failed to submit vote" };
		} catch (error) {
			return this.handleApiError(error, "poll voting");
		}
	}

	/**
	 * Track post view for analytics purposes
	 */
	public async trackPostView(postId: string): Promise<PostResponse<void>> {
		try {
			if (!postId) {
				return { success: false, error: "postId is required" };
			}

			const headers = await this.getAuthHeaders();
			const response = await this.client.post<any>(PostService.ENDPOINTS.POST_VIEW(postId), {}, {
				headers,
				timeout: 5000, // Shorter timeout for view tracking
			});

			console.log("View Response:", JSON.stringify(response, null, 2));

			return response.success ? { success: true } : { success: false, error: "Failed to track post view" };
		} catch (error: any) {
			// View tracking failures should not be critical
			console.warn("Post view tracking failed:", error.message);
			return { success: false, error: "View tracking unavailable" };
		}
	}

	/**
	 * Toggle bookmark status for a post
	 */
	public async toggleBookmarkPost(postId: string): Promise<PostResponse<{ bookmarked: boolean }>> {
		const isAuthenticated = await this.validateAuthentication();
		if (!isAuthenticated) {
			return { success: false, error: "Authentication required to bookmark posts" };
		}

		try {
			const headers = await this.getAuthHeaders();
			const response = await this.client.post<{
				success: boolean;
				bookmarked: boolean;
				message?: string;
			}>(PostService.ENDPOINTS.POST_BOOKMARK(postId), null, { headers });

			if (response.success && response.data.success) {
				return {
					success: true,
					data: { bookmarked: response.data.bookmarked },
				};
			}

			return {
				success: false,
				error: response.data.message || "Failed to update bookmark status",
			};
		} catch (error) {
			return this.handleApiError(error, "bookmark toggle");
		}
	}

	/**
	 * Report a post for policy violations
	 */
	public async reportPost(postId: string, reason: string, details?: string): Promise<PostResponse<void>> {
		const isAuthenticated = await this.validateAuthentication();
		if (!isAuthenticated) {
			return { success: false, error: "Authentication required to report posts" };
		}

		if (!reason.trim()) {
			return { success: false, error: "Report reason is required" };
		}

		try {
			const headers = await this.getAuthHeaders();
			const response = await this.client.post<{
				success: boolean;
				message?: string;
			}>(PostService.ENDPOINTS.POST_REPORT(postId), { reason, details }, { headers });

			return response.success && response.data.success ? { success: true } : { success: false, error: response.data.message || "Failed to submit report" };
		} catch (error) {
			return this.handleApiError(error, "post reporting");
		}
	}

	/**
	 * Get user's own posts with pagination
	 */
	public async getUserPosts(filters: PostFilters = {}): Promise<PostResponse<Post[]>> {
		const isAuthenticated = await this.validateAuthentication();
		if (!isAuthenticated) {
			return { success: false, error: "Authentication required to access user posts" };
		}

		try {
			const params = this.buildQueryParams(filters);
			const headers = await this.getAuthHeaders();

			const response = await this.client.get<{
				posts: Post[] & { nextCursor?: string; hasMore?: boolean; limit?: number };
				status: string;
				message?: string;
			}>(PostService.ENDPOINTS.USER_POSTS, params, { headers });

			if (response.success && response.data.status === "ok" && response.data.posts) {
				return {
					success: true,
					data: response.data.posts,
					pagination: {
						nextCursor: response.data.posts.nextCursor,
						hasMore: response.data.posts.hasMore,
						limit: response.data.posts.limit,
					},
				};
			}

			return {
				success: false,
				error: response.data.message || "Failed to retrieve user posts",
			};
		} catch (error) {
			return this.handleApiError(error, "user posts retrieval");
		}
	}
}

export default PostService.getInstance();

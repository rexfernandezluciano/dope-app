/** @format */

import DOPEClient, { RequestMethod, DOPEClientError, ApiResponse } from "../api/config/DOPEClient";
import AuthService from "./AuthService";
import { Post } from "../api/interface/post.interface";

// Search-related interfaces
export interface SearchUser {
  uid: string;
  name: string;
  username: string;
  photoURL?: string;
  hasBlueCheck: boolean;
  bio?: string;
  stats?: {
    followers: number;
    posts: number;
  };
}

export interface SearchComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL?: string;
  postId: string;
  createdAt: string;
  likesCount: number;
}

export interface SearchFilters {
  query: string;
  limit?: number;
  sortBy?: "asc" | "desc";
  cursor?: string;
}

export interface SearchResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
    total?: number;
  };
}

export interface SearchResults {
  posts: Post[];
  users: SearchUser[];
  comments: SearchComment[];
  totalResults: number;
}

export type SearchType = "all" | "posts" | "users" | "comments";

class SearchService {
  private static instance: SearchService;
  private client: DOPEClient;

  // API endpoint constants
  private static readonly ENDPOINTS = {
    SEARCH_POSTS: "/v1/posts",
    SEARCH_USERS: "/v1/users",
    SEARCH_COMMENTS: "/v1/comments/search",
    SEARCH_ALL: "/v1/search", // Combined search endpoint if available
  } as const;

  private constructor() {
    this.client = DOPEClient.getInstance();
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
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
   * Build query parameters from search filters
   */
  private buildSearchParams(filters: SearchFilters): Record<string, any> {
    const params: Record<string, any> = {};

    if (filters.query.trim()) {
      params.search = filters.query.trim();
    }

    if (filters.limit && filters.limit > 0) {
      params.limit = Math.min(filters.limit, 100); // Cap at 100 results
    }

    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
    }

    if (filters.cursor) {
      params.cursor = filters.cursor;
    }

    return params;
  }

  /**
   * Handle API error processing with enhanced error context
   */
  private handleApiError(error: unknown, context: string): SearchResponse {
    console.error(`SearchService ${context} error:`, error);

    if (error instanceof DOPEClientError) {
      switch (error.status) {
        case 400:
          return {
            success: false,
            error: "Invalid search parameters provided.",
          };
        case 401:
          return {
            success: false,
            error: "Authentication required for search.",
          };
        case 403:
          return {
            success: false,
            error: "You don't have permission to perform this search.",
          };
        case 429:
          return {
            success: false,
            error: "Too many search requests. Please try again later.",
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            success: false,
            error: "Search service temporarily unavailable. Please try again later.",
          };
        default:
          return {
            success: false,
            error: error.message || `Search ${context} failed`,
          };
      }
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message.includes("NETWORK_ERROR")
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
   * Validate search query parameters
   */
  private validateSearchQuery(query: string): string | null {
    if (!query || !query.trim()) {
      return "Search query cannot be empty";
    }

    if (query.trim().length < 2) {
      return "Search query must be at least 2 characters long";
    }

    if (query.length > 200) {
      return "Search query cannot exceed 200 characters";
    }

    return null;
  }

  /**
   * Search for posts based on query parameters
   */
  public async searchPosts(filters: SearchFilters): Promise<SearchResponse<Post[]>> {
    const validationError = this.validateSearchQuery(filters.query);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      const params = this.buildSearchParams(filters);
      const headers = await this.getAuthHeaders();

      const response = await this.client.get<{
        posts: Post[] & { nextCursor?: string; hasMore?: boolean; total?: number };
        status?: string;
        message?: string;
      }>(SearchService.ENDPOINTS.SEARCH_POSTS, params, { headers });

      if (response.success && response.data.posts) {
        return {
          success: true,
          data: response.data.posts,
          pagination: {
            nextCursor: response.data.posts.nextCursor,
            hasMore: response.data.posts.hasMore || false,
            limit: filters.limit || 20,
            total: response.data.posts.total,
          },
        };
      }

      return {
        success: false,
        error: response.data.message || "Failed to search posts",
      };
    } catch (error) {
      return this.handleApiError(error, "posts search");
    }
  }

  /**
   * Search for users based on query parameters
   */
  public async searchUsers(filters: SearchFilters): Promise<SearchResponse<SearchUser[]>> {
    const validationError = this.validateSearchQuery(filters.query);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      const params = this.buildSearchParams(filters);
      const headers = await this.getAuthHeaders();

      const response = await this.client.get<{
        users: SearchUser[] & { nextCursor?: string; hasMore?: boolean; total?: number };
        status?: string;
        message?: string;
      }>(SearchService.ENDPOINTS.SEARCH_USERS, params, { headers });

      if (response.success && response.data.users) {
        return {
          success: true,
          data: response.data.users,
          pagination: {
            nextCursor: response.data.users.nextCursor,
            hasMore: response.data.users.hasMore || false,
            limit: filters.limit || 20,
            total: response.data.users.total,
          },
        };
      }

      return {
        success: false,
        error: response.data.message || "Failed to search users",
      };
    } catch (error) {
      return this.handleApiError(error, "users search");
    }
  }

  /**
   * Search for comments based on query parameters
   */
  public async searchComments(filters: SearchFilters): Promise<SearchResponse<SearchComment[]>> {
    const validationError = this.validateSearchQuery(filters.query);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      const params = { query: filters.query.trim() }; // Comments API uses 'query' parameter
      const headers = await this.getAuthHeaders();

      const response = await this.client.get<{
        comments: SearchComment[] & { nextCursor?: string; hasMore?: boolean; total?: number };
        status?: string;
        message?: string;
      }>(SearchService.ENDPOINTS.SEARCH_COMMENTS, params, { headers });

      if (response.success && response.data.comments) {
        return {
          success: true,
          data: response.data.comments,
          pagination: {
            nextCursor: response.data.comments.nextCursor,
            hasMore: response.data.comments.hasMore || false,
            limit: filters.limit || 20,
            total: response.data.comments.total,
          },
        };
      }

      return {
        success: false,
        error: response.data.message || "Failed to search comments",
      };
    } catch (error) {
      return this.handleApiError(error, "comments search");
    }
  }

  /**
   * Perform comprehensive search across all content types
   */
  public async searchAll(filters: SearchFilters): Promise<SearchResponse<SearchResults>> {
    const validationError = this.validateSearchQuery(filters.query);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      // Execute parallel searches for better performance
      const [postsResult, usersResult, commentsResult] = await Promise.allSettled([
        this.searchPosts({ ...filters, limit: Math.floor((filters.limit || 20) / 3) }),
        this.searchUsers({ ...filters, limit: Math.floor((filters.limit || 20) / 3) }),
        this.searchComments({ ...filters, limit: Math.floor((filters.limit || 20) / 3) }),
      ]);

      const posts = postsResult.status === "fulfilled" && postsResult.value.success 
        ? postsResult.value.data || [] 
        : [];
      
      const users = usersResult.status === "fulfilled" && usersResult.value.success 
        ? usersResult.value.data || [] 
        : [];
      
      const comments = commentsResult.status === "fulfilled" && commentsResult.value.success 
        ? commentsResult.value.data || [] 
        : [];

      const totalResults = posts.length + users.length + comments.length;

      // Check if all searches failed
      if (postsResult.status === "rejected" && 
          usersResult.status === "rejected" && 
          commentsResult.status === "rejected") {
        return {
          success: false,
          error: "Search service temporarily unavailable. Please try again later.",
        };
      }

      return {
        success: true,
        data: {
          posts,
          users,
          comments,
          totalResults,
        },
        pagination: {
          hasMore: totalResults >= (filters.limit || 20),
          limit: filters.limit || 20,
          total: totalResults,
        },
      };
    } catch (error) {
      return this.handleApiError(error, "comprehensive search");
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  public async getSearchSuggestions(query: string, limit: number = 5): Promise<SearchResponse<string[]>> {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get<{
        suggestions: string[];
        message?: string;
      }>(
        "/v1/search/suggestions",
        { query: query.trim(), limit },
        { headers, timeout: 3000 } // Short timeout for suggestions
      );

      if (response.success && response.data.suggestions) {
        return {
          success: true,
          data: response.data.suggestions,
        };
      }

      return { success: true, data: [] }; // Return empty array if no suggestions
    } catch (error) {
      console.warn("Search suggestions failed:", error);
      return { success: true, data: [] }; // Non-critical failure
    }
  }

  /**
   * Get trending search queries
   */
  public async getTrendingSearches(limit: number = 10): Promise<SearchResponse<string[]>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get<{
        trending: string[];
        message?: string;
      }>(
        "/v1/search/trending",
        { limit },
        { headers, timeout: 5000 }
      );

      if (response.success && response.data.trending) {
        return {
          success: true,
          data: response.data.trending,
        };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.warn("Trending searches failed:", error);
      return { success: true, data: [] };
    }
  }

  /**
   * Clear search history (if implemented on server)
   */
  public async clearSearchHistory(): Promise<SearchResponse<void>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.delete<{
        success: boolean;
        message?: string;
      }>(
        "/v1/search/history",
        { headers }
      );

      return response.success && response.data.success
        ? { success: true }
        : { success: false, error: response.data.message || "Failed to clear search history" };
    } catch (error) {
      return this.handleApiError(error, "clear search history");
    }
  }
}

export default SearchService.getInstance();
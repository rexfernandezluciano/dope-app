/** @format */

import DOPEClient from '../api/config/DOPEClient';
import AuthService from './AuthService';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    uid: string;
    name: string;
    username: string;
    photoURL?: string;
    hasBlueCheck?: boolean;
  };
  stats: {
    likes: number;
    replies: number;
  };
  likes?: Array<{
    user: {
      uid: string;
      username: string;
    };
  }>;
  parentId?: string;
  postId: string;
}

export interface CommentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class CommentService {
  private client: DOPEClient;
  
  private static readonly ENDPOINTS = {
    POST_COMMENTS: (postId: string) => `/v1/comments/post/${postId}`,
    CREATE_COMMENT: (postId: string) => `/v1/comments/post/${postId}`,
    COMMENT_LIKE: (commentId: string) => `/v1/comments/${commentId}/like`,
    COMMENT_DELETE: (commentId: string) => `/v1/comments/${commentId}`,
    COMMENT_UPDATE: (commentId: string) => `/v1/comments/${commentId}`,
  } as const;

  constructor() {
    this.client = DOPEClient.getInstance();
  }

  /**
   * Validate authentication before making API calls
   */
  private async validateAuthentication(): Promise<boolean> {
    return AuthService.isAuthenticated;
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    return {
      'Authorization': `Bearer ${AuthService.token || ''}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Handle API errors consistently
   */
  private handleApiError(error: any, operation: string): CommentResponse {
    console.error(`Comment ${operation} failed:`, error);
    return {
      success: false,
      error: error.message || `Failed to ${operation}`,
    };
  }

  /**
   * Get comments for a specific post
   */
  public async getComments(
    postId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<CommentResponse<Comment[]>> {
    if (!postId) {
      return { success: false, error: 'Post ID is required' };
    }

    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (cursor) params.append('cursor', cursor);

      const response = await this.client.get<{
        comments: Comment[];
        nextCursor?: string;
        hasMore: boolean;
      }>(`${CommentService.ENDPOINTS.POST_COMMENTS(postId)}?${params.toString()}`);

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.comments,
        };
      }

      return {
        success: false,
        error: 'Failed to fetch comments',
      };
    } catch (error) {
      return this.handleApiError(error, 'fetch comments');
    }
  }

  /**
   * Create a new comment or reply
   */
  public async createComment(
    postId: string,
    content: string,
    parentId?: string,
    tipAmount?: number
  ): Promise<CommentResponse<Comment>> {
    const isAuthenticated = await this.validateAuthentication();
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication required to comment' };
    }

    if (!postId || !content.trim()) {
      return { success: false, error: 'Post ID and content are required' };
    }

    if (content.length > 500) {
      return { success: false, error: 'Comment cannot exceed 500 characters' };
    }

    try {
      const headers = await this.getAuthHeaders();
      const requestBody: any = {
        content: content.trim(),
      };

      if (parentId) {
        requestBody.parentId = parentId;
      }

      if (tipAmount && tipAmount > 0) {
        requestBody.tipAmount = tipAmount;
      }

      const response = await this.client.post<{
        success: boolean;
        comment?: Comment;
        message?: string;
      }>(CommentService.ENDPOINTS.CREATE_COMMENT(postId), requestBody, { headers });

      if (response.success && response.data.success && response.data.comment) {
        return {
          success: true,
          data: response.data.comment,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Failed to create comment',
      };
    } catch (error) {
      return this.handleApiError(error, 'create comment');
    }
  }

  /**
   * Toggle like on a comment
   */
  public async toggleCommentLike(commentId: string): Promise<CommentResponse<{ liked: boolean }>> {
    const isAuthenticated = await this.validateAuthentication();
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication required to like comments' };
    }

    if (!commentId) {
      return { success: false, error: 'Comment ID is required' };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.post<{
        message: string;
        liked: boolean;
      }>(CommentService.ENDPOINTS.COMMENT_LIKE(commentId), {}, { headers });

      if (response.success && response.data) {
        return {
          success: true,
          data: { liked: response.data.liked },
        };
      }

      return {
        success: false,
        error: 'Failed to toggle comment like',
      };
    } catch (error) {
      return this.handleApiError(error, 'toggle comment like');
    }
  }

  /**
   * Delete a comment
   */
  public async deleteComment(commentId: string): Promise<CommentResponse<void>> {
    const isAuthenticated = await this.validateAuthentication();
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication required to delete comments' };
    }

    if (!commentId) {
      return { success: false, error: 'Comment ID is required' };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.delete<{
        success: boolean;
        message?: string;
      }>(CommentService.ENDPOINTS.COMMENT_DELETE(commentId), { headers });

      if (response.success && response.data.success) {
        return { success: true };
      }

      return {
        success: false,
        error: response.data.message || 'Failed to delete comment',
      };
    } catch (error) {
      return this.handleApiError(error, 'delete comment');
    }
  }

  /**
   * Update/edit a comment
   */
  public async updateComment(commentId: string, content: string): Promise<CommentResponse<Comment>> {
    const isAuthenticated = await this.validateAuthentication();
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication required to edit comments' };
    }

    if (!commentId || !content.trim()) {
      return { success: false, error: 'Comment ID and content are required' };
    }

    if (content.length > 500) {
      return { success: false, error: 'Comment cannot exceed 500 characters' };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.put<{
        success: boolean;
        comment?: Comment;
        message?: string;
      }>(CommentService.ENDPOINTS.COMMENT_UPDATE(commentId), { content: content.trim() }, { headers });

      if (response.success && response.data.success && response.data.comment) {
        return {
          success: true,
          data: response.data.comment,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Failed to update comment',
      };
    } catch (error) {
      return this.handleApiError(error, 'update comment');
    }
  }

  /**
   * Format comment date for display
   */
  public static formatCommentDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)}d`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Extract mentions from comment content
   */
  public static extractMentions(content: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  /**
   * Extract hashtags from comment content
   */
  public static extractHashtags(content: string): string[] {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const hashtags = [];
    let match;
    
    while ((match = hashtagRegex.exec(content)) !== null) {
      hashtags.push(match[1]);
    }
    
    return hashtags;
  }
}

export default CommentService;
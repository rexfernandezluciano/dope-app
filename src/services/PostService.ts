
import DOPEClient from "../api/config/DOPEClient";
import AuthService from "./AuthService";

export interface CreatePostData {
  content?: string;
  imageUrls?: string[];
  postType: "text" | "live_video" | "poll" | "repost";
  privacy?: "public" | "private" | "followers";
  liveVideoUrl?: string;
  originalPostId?: string;
  poll?: {
    question: string;
    options: Array<{ text: string }>;
    expiresIn?: number;
    allowMultiple?: boolean;
  };
}

export interface PostFilters {
  limit?: number;
  cursor?: string;
  author?: string;
  postType?: "text" | "live_video" | "poll" | "repost";
  hasImages?: boolean;
  hasLiveVideo?: boolean;
  search?: string;
  random?: boolean;
  quality?: boolean;
}

class PostService {
  private client: DOPEClient;

  constructor() {
    this.client = DOPEClient.getInstance();
  }

  private getAuthHeaders() {
    const token = AuthService.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getPosts(filters: PostFilters = {}): Promise<{ success: boolean; posts?: any[]; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${this.client.baseURL}/v1/posts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, posts: data.posts };
      } else {
        return { success: false, error: data.message || 'Failed to fetch posts' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getFollowingFeed(filters: PostFilters = {}): Promise<{ success: boolean; posts?: any[]; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${this.client.baseURL}/v1/posts/following${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, posts: data.posts };
      } else {
        return { success: false, error: data.message || 'Failed to fetch following feed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async createPost(postData: CreatePostData): Promise<{ success: boolean; post?: any; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, post: data };
      } else {
        return { success: false, error: data.message || 'Failed to create post' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async likePost(postId: string): Promise<{ success: boolean; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to like post' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async sharePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/posts/share/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to share post' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async repostPost(postId: string, content?: string): Promise<{ success: boolean; post?: any; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/posts/${postId}/repost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, post: data.post };
      } else {
        return { success: false, error: data.message || 'Failed to repost' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to delete post' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async voteOnPoll(pollId: string, optionIds: string[]): Promise<{ success: boolean; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ optionIds }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to vote on poll' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async trackPostView(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/posts/${postId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to track view' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

export default new PostService();

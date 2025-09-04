
import DOPEClient from "../api/config/DOPEClient";
import AuthService from "./AuthService";

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  photoURL?: string;
  coverPhotoURL?: string;
  gender?: "male" | "female" | "non_binary" | "prefer_not_to_say";
  birthday?: string;
  privacy?: {
    profile: "public" | "private";
    comments: "public" | "followers" | "private";
    sharing: boolean;
    chat: "public" | "followers" | "private";
  };
}

class UserService {
  private client: DOPEClient;

  constructor() {
    this.client = DOPEClient.getInstance();
  }

  private getAuthHeaders() {
    const token = AuthService.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getUserProfile(userId: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Failed to get user profile' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async updateProfile(profileData: UpdateProfileData): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Failed to update profile' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async followUser(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/users/${userId}/follow`, {
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
        return { success: false, error: data.message || 'Failed to follow user' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async unfollowUser(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/users/${userId}/unfollow`, {
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
        return { success: false, error: data.message || 'Failed to unfollow user' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getUserPosts(userId: string, limit = 20): Promise<{ success: boolean; posts?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/users/${userId}/posts?limit=${limit}`, {
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
        return { success: false, error: data.message || 'Failed to get user posts' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getFollowers(userId?: string, limit = 20): Promise<{ success: boolean; followers?: any[]; error?: string }> {
    const targetUserId = userId || AuthService.user?.uid;
    if (!targetUserId) {
      return { success: false, error: 'User ID required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/users/${targetUserId}/followers?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, followers: data.followers };
      } else {
        return { success: false, error: data.message || 'Failed to get followers' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getFollowing(userId?: string, limit = 20): Promise<{ success: boolean; following?: any[]; error?: string }> {
    const targetUserId = userId || AuthService.user?.uid;
    if (!targetUserId) {
      return { success: false, error: 'User ID required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/users/${targetUserId}/following?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, following: data.following };
      } else {
        return { success: false, error: data.message || 'Failed to get following' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getUserAnalytics(): Promise<{ success: boolean; analytics?: any; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/users/analytics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, analytics: data };
      } else {
        return { success: false, error: data.message || 'Failed to get analytics' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

export default new UserService();

/** @format */

import DOPEClient from '../api/config/DOPEClient';
import AuthService from './AuthService';

export interface AnalyticsOverview {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalReposts: number;
  totalShares: number;
  engagementRate: number;
  followerCount: number;
  followingCount: number;
  donationsReceived: number;
}

export interface MonetizationData {
  isEligible: boolean;
  requirements: {
    followers: {
      current: number;
      required: number;
      met: boolean;
    };
    recentActivity: {
      postsLast24h: number;
      required: number;
      met: boolean;
    };
    accountStatus: {
      blocked: boolean;
      restricted: boolean;
      verified: boolean;
    };
  };
}

export interface PostAnalytics {
  id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  earnings: number;
  createdAt: string;
}

export interface UserAnalytics {
  period: string;
  overview: AnalyticsOverview;
  monetization: MonetizationData;
  topPosts: PostAnalytics[];
}

export interface EarningsData {
  totalEarnings: number;
  totalEarningsInCents: number;
}

export interface AnalyticsResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class AnalyticsService {
  private client: DOPEClient;
  
  private static readonly ENDPOINTS = {
    USER_ANALYTICS: '/v1/analytics/user',
    USER_EARNINGS: '/v1/users/analytics/earnings',
    POST_ANALYTICS: (postId: string) => `/v1/analytics/post/${postId}`,
    PLATFORM_ANALYTICS: '/v1/analytics/platform',
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
    // Use the same pattern as other services
    return {
      'Authorization': `Bearer ${AuthService.token || ''}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Handle API errors consistently
   */
  private handleApiError(error: any, operation: string): AnalyticsResponse {
    console.error(`Analytics ${operation} failed:`, error);
    return {
      success: false,
      error: error.message || `Failed to ${operation}`,
    };
  }

  /**
   * Get comprehensive user analytics including monetization data
   */
  public async getUserAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsResponse<UserAnalytics>> {
    const isAuthenticated = await this.validateAuthentication();
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication required to view analytics' };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get<UserAnalytics>(
        `${AnalyticsService.ENDPOINTS.USER_ANALYTICS}?period=${period}`,
        { headers }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: 'Failed to fetch analytics',
      };
    } catch (error) {
      return this.handleApiError(error, 'fetch user analytics');
    }
  }

  /**
   * Get user earnings information
   */
  public async getUserEarnings(): Promise<AnalyticsResponse<EarningsData>> {
    const isAuthenticated = await this.validateAuthentication();
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication required to view earnings' };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get<EarningsData>(
        AnalyticsService.ENDPOINTS.USER_EARNINGS,
        { headers }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: 'Failed to fetch earnings',
      };
    } catch (error) {
      return this.handleApiError(error, 'fetch earnings');
    }
  }

  /**
   * Get analytics for a specific post
   */
  public async getPostAnalytics(postId: string): Promise<AnalyticsResponse<any>> {
    const isAuthenticated = await this.validateAuthentication();
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication required to view post analytics' };
    }

    if (!postId) {
      return { success: false, error: 'Post ID is required' };
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get<any>(
        AnalyticsService.ENDPOINTS.POST_ANALYTICS(postId),
        { headers }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Failed to fetch post analytics',
      };
    } catch (error) {
      return this.handleApiError(error, 'fetch post analytics');
    }
  }

  /**
   * Format numbers for display
   */
  public static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Format currency for display
   */
  public static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Calculate percentage change
   */
  public static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}

export default AnalyticsService;
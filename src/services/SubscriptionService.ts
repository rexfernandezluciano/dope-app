
import DOPEClient from "../api/config/DOPEClient";
import AuthService from "./AuthService";

class SubscriptionService {
  private client: DOPEClient;

  constructor() {
    this.client = DOPEClient.getInstance();
  }

  private getAuthHeaders() {
    const token = AuthService.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getAvailableSubscriptions(): Promise<{ success: boolean; subscriptions?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/subscriptions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, subscriptions: data.subscriptions };
      } else {
        return { success: false, error: data.message || 'Failed to get subscriptions' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async subscribe(subscriptionId: string): Promise<{ success: boolean; subscription?: any; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/subscriptions/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, subscription: data.subscription };
      } else {
        return { success: false, error: data.message || 'Subscription failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/subscriptions/cancel`, {
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
        return { success: false, error: data.message || 'Failed to cancel subscription' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getSubscriptionHistory(): Promise<{ success: boolean; history?: any[]; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/subscriptions/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, history: data.history };
      } else {
        return { success: false, error: data.message || 'Failed to get subscription history' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

export default new SubscriptionService();

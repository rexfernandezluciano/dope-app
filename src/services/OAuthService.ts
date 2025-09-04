
import DOPEClient from "../api/config/DOPEClient";
import AuthService from "./AuthService";

class OAuthService {
  private client: DOPEClient;

  constructor() {
    this.client = DOPEClient.getInstance();
  }

  private getAuthHeaders() {
    const token = AuthService.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getConnectedApps(): Promise<{ success: boolean; apps?: any[]; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/oauth/connected`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, apps: data.apps };
      } else {
        return { success: false, error: data.message || 'Failed to get connected apps' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getAvailableProviders(): Promise<{ success: boolean; providers?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/oauth/providers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, providers: data.providers };
      } else {
        return { success: false, error: data.message || 'Failed to get providers' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async initiateOAuth(provider: string): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/oauth/${provider}/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, authUrl: data.authUrl };
      } else {
        return { success: false, error: data.message || 'Failed to initiate OAuth' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async revokeOAuth(appId: string): Promise<{ success: boolean; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/oauth/revoke/${appId}`, {
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
        return { success: false, error: data.message || 'Failed to revoke OAuth' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async updatePermissions(appId: string, permissions: { [key: string]: boolean }): Promise<{ success: boolean; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/oauth/permissions/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ permissions }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to update permissions' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

export default new OAuthService();

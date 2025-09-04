
import DOPEClient from "../api/config/DOPEClient";
import AuthService from "./AuthService";

export interface BusinessProfileData {
  businessName: string;
  businessType: string;
  website?: string;
  phone?: string;
  address?: string;
  description?: string;
}

class BusinessService {
  private client: DOPEClient;

  constructor() {
    this.client = DOPEClient.getInstance();
  }

  private getAuthHeaders() {
    const token = AuthService.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getBusinessProfile(): Promise<{ success: boolean; business?: any; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/business/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, business: data.business };
      } else {
        return { success: false, error: data.message || 'Failed to get business profile' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async createBusinessProfile(businessData: BusinessProfileData): Promise<{ success: boolean; business?: any; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/business/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          name: businessData.businessName,
          type: businessData.businessType,
          website: businessData.website,
          phone: businessData.phone,
          address: businessData.address,
          description: businessData.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, business: data.business };
      } else {
        return { success: false, error: data.message || 'Failed to create business profile' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async updateBusinessProfile(businessData: Partial<BusinessProfileData>): Promise<{ success: boolean; business?: any; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/business/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          name: businessData.businessName,
          type: businessData.businessType,
          website: businessData.website,
          phone: businessData.phone,
          address: businessData.address,
          description: businessData.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, business: data.business };
      } else {
        return { success: false, error: data.message || 'Failed to update business profile' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async deleteBusinessProfile(): Promise<{ success: boolean; error?: string }> {
    if (!AuthService.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/business/profile`, {
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
        return { success: false, error: data.message || 'Failed to delete business profile' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

export default new BusinessService();

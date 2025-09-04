
import DOPEClient from "../api/config/DOPEClient";

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
  gender?: "male" | "female" | "non_binary" | "prefer_not_to_say";
  birthday?: string;
  subscription?: "free" | "premium" | "pro";
  privacy?: {
    profile: "public" | "private";
    comments: "public" | "followers" | "private";
    sharing: boolean;
    chat: "public" | "followers" | "private";
  };
}

class AuthService {
  private client: DOPEClient;
  private currentUser: User | null = null;
  private authToken: string | null = null;

  constructor() {
    this.client = DOPEClient.getInstance();
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        this.authToken = data.token;
        this.currentUser = data.user;
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async register(userData: RegisterData): Promise<{ success: boolean; verificationId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, verificationId: data.verificationId };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async verifyEmail(email: string, code: string, verificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, verificationId }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Verification failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getCurrentUser(): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!this.authToken) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${this.client.baseURL}/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        this.currentUser = data.user;
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Failed to get user' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    if (!this.authToken) {
      return { success: true };
    }

    try {
      await fetch(`${this.client.baseURL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.authToken = null;
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      // Clear local auth even if request fails
      this.authToken = null;
      this.currentUser = null;
      return { success: true };
    }
  }

  // User Management Methods
  async checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/auth/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      return { available: data.available };
    } catch (error) {
      return { available: false, error: 'Network error' };
    }
  }

  async checkEmailAvailability(email: string): Promise<{ available: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return { available: data.available };
    } catch (error) {
      return { available: false, error: 'Network error' };
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean; resetId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, resetId: data.resetId };
      } else {
        return { success: false, error: data.message || 'Failed to send reset code' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async resetPassword(email: string, code: string, resetId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, resetId, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Password reset failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Getters
  get user(): User | null {
    return this.currentUser;
  }

  get token(): string | null {
    return this.authToken;
  }

  get isAuthenticated(): boolean {
    return !!this.authToken && !!this.currentUser;
  }
}

export default new AuthService();

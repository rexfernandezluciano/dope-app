/** @format */

import DOPEClient, { ApiResponse, DOPEClientError } from "../api/config/DOPEClient";
import AuthService from "./AuthService";

// Types based on API documentation
export interface NotificationUser {
        uid: string;
        name: string;
        username: string;
        photoURL: string;
        hasBlueCheck: boolean;
}

export interface Notification {
        id: string;
        type: "like" | "comment" | "follow" | "mention" | "repost" | "reply";
        user: NotificationUser;
        content?: string;
        postId?: string;
        postContent?: string;
        timestamp: string;
        isRead: boolean;
        createdAt: string;
}

export interface NotificationSettings {
        emailNotifications: boolean;
        pushNotifications: boolean;
        smsNotifications: boolean;
        marketingEmails: boolean;
}

export interface NotificationResponse {
        success: boolean;
        data?: any;
        error?: string;
}

class NotificationService {
        private static instance: NotificationService;
        private client: DOPEClient;

        // API Endpoints
        private static readonly API_ENDPOINTS = {
                GET_NOTIFICATIONS: "/v1/notifications",
                GET_SETTINGS: "/v1/notifications/settings",
                UPDATE_SETTINGS: "/v1/notifications/settings",
                MARK_READ: "/v1/notifications/:notificationId/read",
                MARK_ALL_READ: "/v1/notifications/mark-all-read",
                DELETE_NOTIFICATION: "/v1/notifications/:notificationId",
        } as const;

        private constructor() {
                this.client = DOPEClient.getInstance();
        }

        public static getInstance(): NotificationService {
                if (!NotificationService.instance) {
                        NotificationService.instance = new NotificationService();
                }
                return NotificationService.instance;
        }

        /**
         * Get user notifications with optional filters
         */
        public async getNotifications(options?: {
                limit?: number;
                cursor?: string;
                type?: string;
                read?: boolean;
        }): Promise<NotificationResponse> {
                try {
                        const token = AuthService.token;

                        if (!token) {
                                return { success: false, error: "Authentication required" };
                        }

                        // Build query parameters
                        const queryParams = new URLSearchParams();
                        if (options?.limit) queryParams.append("limit", options.limit.toString());
                        if (options?.cursor) queryParams.append("cursor", options.cursor);
                        if (options?.type) queryParams.append("type", options.type);
                        if (options?.read !== undefined) queryParams.append("read", options.read.toString());

                        const url = `${NotificationService.API_ENDPOINTS.GET_NOTIFICATIONS}${
                                queryParams.toString() ? `?${queryParams.toString()}` : ""
                        }`;

                        const response = await this.client.get<{
                                notifications: Notification[];
                                nextCursor?: string;
                                hasMore: boolean;
                                limit: number;
                        }>(url, undefined, {
                                headers: { Authorization: `Bearer ${token}` },
                        });

                        if (response.success && response.data) {
                                return {
                                        success: true,
                                        data: {
                                                notifications: response.data.notifications,
                                                nextCursor: response.data.nextCursor,
                                                hasMore: response.data.hasMore,
                                                limit: response.data.limit,
                                        },
                                };
                        }

                        return { success: false, error: "Failed to fetch notifications" };
                } catch (error) {
                        return this.handleApiError(error, "fetch notifications");
                }
        }

        /**
         * Mark a notification as read
         */
        public async markAsRead(notificationId: string): Promise<NotificationResponse> {
                try {
                        const token = AuthService.token;

                        if (!token) {
                                return { success: false, error: "Authentication required" };
                        }

                        const url = NotificationService.API_ENDPOINTS.MARK_READ.replace(":notificationId", notificationId);

                        const response = await this.client.patch<{ message: string }>(url, {}, {
                                headers: { Authorization: `Bearer ${token}` },
                        });

                        if (response.success) {
                                return { success: true, data: response.data };
                        }

                        return { success: false, error: "Failed to mark notification as read" };
                } catch (error) {
                        return this.handleApiError(error, "mark notification as read");
                }
        }

        /**
         * Mark all notifications as read
         */
        public async markAllAsRead(): Promise<NotificationResponse> {
                try {
                        const token = AuthService.token;

                        if (!token) {
                                return { success: false, error: "Authentication required" };
                        }

                        const response = await this.client.patch<{ message: string; markedCount: number }>(
                                NotificationService.API_ENDPOINTS.MARK_ALL_READ,
                                {},
                                {
                                        headers: { Authorization: `Bearer ${token}` },
                                }
                        );

                        if (response.success) {
                                return { success: true, data: response.data };
                        }

                        return { success: false, error: "Failed to mark all notifications as read" };
                } catch (error) {
                        return this.handleApiError(error, "mark all notifications as read");
                }
        }

        /**
         * Delete a notification
         */
        public async deleteNotification(notificationId: string): Promise<NotificationResponse> {
                try {
                        const token = AuthService.token;

                        if (!token) {
                                return { success: false, error: "Authentication required" };
                        }

                        const url = NotificationService.API_ENDPOINTS.DELETE_NOTIFICATION.replace(":notificationId", notificationId);

                        const response = await this.client.delete<{ message: string }>(url, {
                                headers: { Authorization: `Bearer ${token}` },
                        });

                        if (response.success) {
                                return { success: true, data: response.data };
                        }

                        return { success: false, error: "Failed to delete notification" };
                } catch (error) {
                        return this.handleApiError(error, "delete notification");
                }
        }

        /**
         * Get notification settings
         */
        public async getSettings(): Promise<NotificationResponse> {
                try {
                        const token = AuthService.token;

                        if (!token) {
                                return { success: false, error: "Authentication required" };
                        }

                        const response = await this.client.get<NotificationSettings>(
                                NotificationService.API_ENDPOINTS.GET_SETTINGS,
                                undefined,
                                {
                                        headers: { Authorization: `Bearer ${token}` },
                                }
                        );

                        if (response.success) {
                                return { success: true, data: response.data };
                        }

                        return { success: false, error: "Failed to fetch notification settings" };
                } catch (error) {
                        return this.handleApiError(error, "fetch notification settings");
                }
        }

        /**
         * Update notification settings
         */
        public async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationResponse> {
                try {
                        const token = AuthService.token;

                        if (!token) {
                                return { success: false, error: "Authentication required" };
                        }

                        const response = await this.client.put<{ message: string; settings: NotificationSettings }>(
                                NotificationService.API_ENDPOINTS.UPDATE_SETTINGS,
                                settings,
                                {
                                        headers: { Authorization: `Bearer ${token}` },
                                }
                        );

                        if (response.success) {
                                return { success: true, data: response.data };
                        }

                        return { success: false, error: "Failed to update notification settings" };
                } catch (error) {
                        return this.handleApiError(error, "update notification settings");
                }
        }

        /**
         * Handle API errors consistently
         */
        private handleApiError(error: unknown, context: string): NotificationResponse {
                console.error(`NotificationService ${context} error:`, error);

                if (error instanceof DOPEClientError) {
                        switch (error.status) {
                                case 400:
                                        return { success: false, error: error.message || "Invalid request data" };
                                case 401:
                                        return { success: false, error: "Authentication required. Please log in again." };
                                case 403:
                                        return { success: false, error: "Access denied" };
                                case 404:
                                        return { success: false, error: "Notification not found" };
                                case 429:
                                        return { success: false, error: "Too many requests. Please try again later." };
                                case 500:
                                case 502:
                                case 503:
                                case 504:
                                        return { success: false, error: "Server error. Please try again later." };
                                default:
                                        return { success: false, error: error.message || `Error during ${context}` };
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

                return { success: false, error: `An unexpected error occurred during ${context}` };
        }
}

export { NotificationService };
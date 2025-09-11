/** @format */

import React, { useState, useCallback, useEffect } from "react";
import {
        View,
        Text,
        ScrollView,
        TouchableOpacity,
        StyleSheet,
        RefreshControl,
        Alert,
        ActivityIndicator,
} from "react-native";
import { Avatar, IconButton, Card, Badge } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NotificationService, Notification } from "../services/NotificationService";

// Remove duplicate interface - using imported one from NotificationService

const NotificationPage: React.FC = () => {
        const [notifications, setNotifications] = useState<Notification[]>([]);
        const [refreshing, setRefreshing] = useState(false);
        const [loading, setLoading] = useState(true);
        const [filter, setFilter] = useState<"all" | "mentions" | "verified">("all");
        const [nextCursor, setNextCursor] = useState<string | undefined>();
        const [hasMore, setHasMore] = useState(false);

        const notificationService = NotificationService.getInstance();

        // Load notifications on component mount
        useEffect(() => {
                loadNotifications();
        }, []);

        const loadNotifications = async (cursor?: string) => {
                try {
                        const response = await notificationService.getNotifications({
                                limit: 20,
                                cursor,
                                type: filter === "all" ? undefined : filter,
                        });

                        if (response.success && response.data) {
                                const newNotifications = response.data.notifications;
                                setNotifications(cursor ? [...notifications, ...newNotifications] : newNotifications);
                                setNextCursor(response.data.nextCursor);
                                setHasMore(response.data.hasMore);
                        } else {
                                Alert.alert("Error", response.error || "Failed to load notifications");
                        }
                } catch (error) {
                        console.error("Error loading notifications:", error);
                        Alert.alert("Error", "Failed to load notifications");
                } finally {
                        setLoading(false);
                        setRefreshing(false);
                }
        };

        const mockNotifications: Notification[] = [
                {
                        id: "1",
                        type: "like",
                        user: {
                                uid: "user1",
                                name: "Alice Smith",
                                username: "alice_smith",
                                photoURL: "https://via.placeholder.com/40",
                                hasBlueCheck: false,
                        },
                        postContent: "Just shared some amazing insights about React Native...",
                        timestamp: "2 hours ago",
                        isRead: false,
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                },
                {
                        id: "2",
                        type: "follow",
                        user: {
                                uid: "user2",
                                name: "Bob Johnson",
                                username: "bob_dev",
                                photoURL: "https://via.placeholder.com/40",
                                hasBlueCheck: false,
                        },
                        timestamp: "4 hours ago",
                        isRead: true,
                        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                },
                {
                        id: "3",
                        type: "comment",
                        user: {
                                uid: "user3",
                                name: "Carol Williams",
                                username: "carol_tech",
                                photoURL: "https://via.placeholder.com/40",
                                hasBlueCheck: false,
                        },
                        content: "This is really helpful! Thanks for sharing.",
                        postContent: "10 tips for better React development",
                        timestamp: "1 day ago",
                        isRead: true,
                        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                },
                {
                        id: "4",
                        type: "mention",
                        user: {
                                uid: "user4",
                                name: "David Brown",
                                username: "david_code",
                                photoURL: "https://via.placeholder.com/40",
                                hasBlueCheck: false,
                        },
                        content: "Great work on the latest update @user!",
                        timestamp: "2 days ago",
                        isRead: false,
                        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                },
        ];

        const onRefresh = useCallback(async () => {
                setRefreshing(true);
                await loadNotifications();
        }, []);

        const markAsRead = useCallback(async (notificationId: string) => {
                try {
                        const response = await notificationService.markAsRead(notificationId);
                        if (response.success) {
                                setNotifications(prev =>
                                        prev.map(notif =>
                                                notif.id === notificationId ? { ...notif, isRead: true } : notif
                                        )
                                );
                        } else {
                                Alert.alert("Error", response.error || "Failed to mark notification as read");
                        }
                } catch (error) {
                        console.error("Error marking notification as read:", error);
                        Alert.alert("Error", "Failed to mark notification as read");
                }
        }, [notificationService]);

        const markAllAsRead = useCallback(async () => {
                try {
                        const response = await notificationService.markAllAsRead();
                        if (response.success) {
                                setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
                        } else {
                                Alert.alert("Error", response.error || "Failed to mark all notifications as read");
                        }
                } catch (error) {
                        console.error("Error marking all notifications as read:", error);
                        Alert.alert("Error", "Failed to mark all notifications as read");
                }
        }, [notificationService]);

        const getNotificationIcon = (type: Notification["type"]) => {
                switch (type) {
                        case "like":
                                return "heart";
                        case "comment":
                                return "comment-outline";
                        case "follow":
                                return "account-plus";
                        case "mention":
                                return "at";
                        case "repost":
                                return "repeat";
                        default:
                                return "bell";
                }
        };

        const getNotificationColor = (type: Notification["type"]) => {
                switch (type) {
                        case "like":
                                return "#e91e63";
                        case "comment":
                                return "#2196f3";
                        case "follow":
                                return "#4caf50";
                        case "mention":
                                return "#ff9800";
                        case "repost":
                                return "#9c27b0";
                        default:
                                return "#757575";
                }
        };

        const getNotificationText = (notification: Notification) => {
                switch (notification.type) {
                        case "like":
                                return `${notification.user.name} liked your post`;
                        case "comment":
                                return `${notification.user.name} commented on your post`;
                        case "follow":
                                return `${notification.user.name} started following you`;
                        case "mention":
                                return `${notification.user.name} mentioned you`;
                        case "repost":
                                return `${notification.user.name} reposted your post`;
                        default:
                                return "New notification";
                }
        };

        const filteredNotifications = notifications.filter(notification => {
                if (filter === "mentions") return notification.type === "mention";
                if (filter === "verified") return notification.user.username.includes("verified");
                return true;
        });

        const unreadCount = notifications.filter(n => !n.isRead).length;

        const renderNotification = (notification: Notification) => (
                <TouchableOpacity
                        key={notification.id}
                        onPress={() => markAsRead(notification.id)}
                        style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}>
                        <View style={styles.notificationContent}>
                                <View style={styles.avatarContainer}>
                                        <Avatar.Image
                                                size={40}
                                                source={{ uri: notification.user.photoURL }}
                                        />
                                        <View style={[
                                                styles.iconBadge,
                                                { backgroundColor: getNotificationColor(notification.type) }
                                        ]}>
                                                <IconButton
                                                        icon={getNotificationIcon(notification.type)}
                                                        size={16}
                                                        iconColor="#ffffff"
                                                        style={styles.iconBadgeIcon}
                                                />
                                        </View>
                                </View>
                                <View style={styles.notificationDetails}>
                                        <Text style={styles.notificationText}>
                                                {getNotificationText(notification)}
                                        </Text>
                                        {notification.content && (
                                                <Text style={styles.notificationContent}>
                                                        "{notification.content}"
                                                </Text>
                                        )}
                                        {notification.postContent && (
                                                <Text style={styles.postContent}>
                                                        {notification.postContent}
                                                </Text>
                                        )}
                                        <Text style={styles.timestamp}>{notification.timestamp}</Text>
                                </View>
                                {!notification.isRead && <View style={styles.unreadDot} />}
                        </View>
                </TouchableOpacity>
        );

        if (loading && notifications.length === 0) {
                return (
                        <SafeAreaView style={styles.container}>
                                <View style={styles.header}>
                                        <Text style={styles.headerTitle}>Notifications</Text>
                                </View>
                                <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#0069B5" />
                                        <Text style={styles.loadingText}>Loading notifications...</Text>
                                </View>
                        </SafeAreaView>
                );
        }

        return (
                <SafeAreaView style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                                <Text style={styles.headerTitle}>Notifications</Text>
                                <View style={styles.headerActions}>
                                        {unreadCount > 0 && (
                                                <Badge style={styles.badge}>{unreadCount}</Badge>
                                        )}
                                        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                                                <Text style={styles.markAllText}>Mark all read</Text>
                                        </TouchableOpacity>
                                        <IconButton icon="cog-outline" size={24} onPress={() => {}} />
                                </View>
                        </View>

                        {/* Filter Tabs */}
                        <View style={styles.filterContainer}>
                                {["all", "mentions", "verified"].map((filterType) => (
                                        <TouchableOpacity
                                                key={filterType}
                                                onPress={() => setFilter(filterType as any)}
                                                style={[
                                                        styles.filterTab,
                                                        filter === filterType && styles.activeFilterTab
                                                ]}>
                                                <Text style={[
                                                        styles.filterText,
                                                        filter === filterType && styles.activeFilterText
                                                ]}>
                                                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                                                </Text>
                                        </TouchableOpacity>
                                ))}
                        </View>

                        {/* Notifications List */}
                        <ScrollView
                                style={styles.scrollView}
                                refreshControl={
                                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                                }>
                                {filteredNotifications.length > 0 ? (
                                        filteredNotifications.map(renderNotification)
                                ) : (
                                        <View style={styles.emptyContainer}>
                                                <IconButton icon="bell-outline" size={48} iconColor="#9E9E9E" />
                                                <Text style={styles.emptyText}>No notifications yet</Text>
                                                <Text style={styles.emptySubtext}>
                                                        When someone likes, comments, or follows you, you'll see it here.
                                                </Text>
                                        </View>
                                )}
                        </ScrollView>
                </SafeAreaView>
        );
};

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: "#FFFFFF",
        },
        header: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#E5E5E7",
        },
        headerTitle: {
                fontSize: 20,
                fontWeight: "700",
                color: "#000",
        },
        headerActions: {
                flexDirection: "row",
                alignItems: "center",
        },
        badge: {
                backgroundColor: "#FF3B30",
                color: "#FFFFFF",
                marginRight: 8,
        },
        markAllButton: {
                marginRight: 8,
        },
        markAllText: {
                fontSize: 14,
                color: "#007AFF",
                fontWeight: "500",
        },
        filterContainer: {
                flexDirection: "row",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#E5E5E7",
        },
        filterTab: {
                paddingVertical: 8,
                paddingHorizontal: 16,
                marginRight: 16,
                borderBottomWidth: 2,
                borderBottomColor: "transparent",
        },
        activeFilterTab: {
                borderBottomColor: "#007AFF",
        },
        filterText: {
                fontSize: 16,
                color: "#8E8E93",
                fontWeight: "500",
        },
        activeFilterText: {
                color: "#007AFF",
        },
        scrollView: {
                flex: 1,
        },
        notificationCard: {
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#F0F0F0",
        },
        unreadCard: {
                backgroundColor: "#F8F9FA",
        },
        notificationContent: {
                flexDirection: "row",
                alignItems: "flex-start",
        },
        avatarContainer: {
                position: "relative",
                marginRight: 12,
        },
        iconBadge: {
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 20,
                height: 20,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#FFFFFF",
        },
        iconBadgeIcon: {
                margin: 0,
        },
        notificationDetails: {
                flex: 1,
        },
        notificationText: {
                fontSize: 15,
                color: "#000",
                fontWeight: "500",
                lineHeight: 20,
        },
        notificationContentText: {
                fontSize: 14,
                color: "#666",
                marginTop: 4,
                fontStyle: "italic",
        },
        postContent: {
                fontSize: 14,
                color: "#666",
                marginTop: 4,
                backgroundColor: "#F5F5F5",
                padding: 8,
                borderRadius: 8,
        },
        timestamp: {
                fontSize: 12,
                color: "#8E8E93",
                marginTop: 6,
        },
        unreadDot: {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#007AFF",
                marginLeft: 8,
                marginTop: 6,
        },
        emptyContainer: {
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 60,
                paddingHorizontal: 40,
        },
        emptyText: {
                fontSize: 18,
                fontWeight: "600",
                color: "#000",
                marginTop: 16,
                textAlign: "center",
        },
        emptySubtext: {
                fontSize: 14,
                color: "#8E8E93",
                marginTop: 8,
                textAlign: "center",
                lineHeight: 20,
        },
        loadingContainer: {
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 50,
        },
        loadingText: {
                marginTop: 16,
                fontSize: 16,
                color: "#666",
                textAlign: "center",
        },
});

export default React.memo(NotificationPage);
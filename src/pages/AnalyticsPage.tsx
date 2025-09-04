
/** @format */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { Card, Button, Divider } from "react-native-paper";
import styles from "../css/styles";
import UserService from "../services/UserService";

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const result = await UserService.getUserAnalytics();
      if (result.success) {
        setAnalytics(result.analytics);
      } else {
        Alert.alert("Error", result.error || "Failed to load analytics");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>Analytics not available</Text>
        <Text style={styles.emptyStateSubtitle}>Try again later</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.home} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.h1, { marginBottom: 24 }]}>Your Analytics</Text>

      {/* Overview Stats */}
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <Text style={[styles.h3, { marginBottom: 16 }]}>Overview</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.h2, { color: "#1DA1F2" }]}>
              {analytics.totalPosts || 0}
            </Text>
            <Text style={styles.statText}>Total Posts</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.h2, { color: "#e91e63" }]}>
              {analytics.totalLikes || 0}
            </Text>
            <Text style={styles.statText}>Total Likes</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.h2, { color: "#4CAF50" }]}>
              {analytics.totalViews || 0}
            </Text>
            <Text style={styles.statText}>Total Views</Text>
          </View>
        </View>
      </Card>

      {/* Engagement Stats */}
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <Text style={[styles.h3, { marginBottom: 16 }]}>Engagement</Text>
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text>Comments</Text>
            <Text style={styles.bold}>{analytics.totalComments || 0}</Text>
          </View>
        </View>
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text>Reposts</Text>
            <Text style={styles.bold}>{analytics.totalReposts || 0}</Text>
          </View>
        </View>
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text>Shares</Text>
            <Text style={styles.bold}>{analytics.totalShares || 0}</Text>
          </View>
        </View>
        <Divider style={{ marginVertical: 12 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.bold}>Engagement Rate</Text>
          <Text style={[styles.bold, { color: "#4CAF50" }]}>
            {analytics.engagementRate || 0}%
          </Text>
        </View>
      </Card>

      {/* Growth Stats */}
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <Text style={[styles.h3, { marginBottom: 16 }]}>Growth</Text>
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text>Followers this month</Text>
            <Text style={styles.bold}>+{analytics.followersGrowth || 0}</Text>
          </View>
        </View>
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text>Posts this month</Text>
            <Text style={styles.bold}>{analytics.postsThisMonth || 0}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text>Average likes per post</Text>
          <Text style={styles.bold}>{analytics.avgLikesPerPost || 0}</Text>
        </View>
      </Card>

      {/* Top Performing Posts */}
      {analytics.topPosts && analytics.topPosts.length > 0 && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text style={[styles.h3, { marginBottom: 16 }]}>Top Performing Posts</Text>
          {analytics.topPosts.map((post: any, index: number) => (
            <View key={post.id} style={{ marginBottom: 12 }}>
              <Text numberOfLines={2}>{post.content || "Image post"}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                <Text style={styles.statText}>{post.stats.likes} likes</Text>
                <Text style={styles.statText}>{post.stats.views} views</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      <Button mode="contained" onPress={loadAnalytics}>
        Refresh Analytics
      </Button>
    </ScrollView>
  );
};

export default AnalyticsPage;

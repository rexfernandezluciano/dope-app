
/** @format */

import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, Alert, Dimensions } from "react-native";
import { Card, Button, Divider, Chip, ProgressBar } from "react-native-paper";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import styles from "../css/styles";
import AnalyticsService, { UserAnalytics, EarningsData } from "../services/AnalyticsService";

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const analyticsService = useMemo(() => new AnalyticsService(), []);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsResult, earningsResult] = await Promise.all([
        analyticsService.getUserAnalytics(selectedPeriod),
        analyticsService.getUserEarnings(),
      ]);

      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      } else {
        Alert.alert("Error", analyticsResult.error || "Failed to load analytics");
      }

      if (earningsResult.success && earningsResult.data) {
        setEarnings(earningsResult.data);
      } else {
        console.warn("Failed to load earnings:", earningsResult.error);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Analytics loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(29, 161, 242, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#1DA1F2',
    },
  };

  // Prepare data for charts
  const engagementData = useMemo(() => {
    if (!analytics?.overview) return null;
    const { totalLikes, totalComments, totalReposts, totalShares } = analytics.overview;
    
    return {
      labels: ['Likes', 'Comments', 'Reposts', 'Shares'],
      datasets: [
        {
          data: [totalLikes, totalComments, totalReposts, totalShares],
        },
      ],
    };
  }, [analytics?.overview]);

  const topPostsData = useMemo(() => {
    if (!analytics?.topPosts?.length) return null;
    
    return {
      labels: analytics.topPosts.slice(0, 5).map((_, i) => `Post ${i + 1}`),
      datasets: [
        {
          data: analytics.topPosts.slice(0, 5).map((post) => post.views || 0),
        },
      ],
    };
  }, [analytics?.topPosts]);

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
        <Button mode="contained" onPress={loadAnalytics} style={{ marginTop: 16 }}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.home} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.h1, { marginBottom: 16 }]}>Analytics Dashboard</Text>

      {/* Period Selector */}
      <View style={{ flexDirection: 'row', marginBottom: 20, justifyContent: 'center' }}>
        {(['7d', '30d', '90d'] as const).map((period) => (
          <Chip
            key={period}
            selected={selectedPeriod === period}
            onPress={() => setSelectedPeriod(period)}
            style={{ marginHorizontal: 4 }}
            mode={selectedPeriod === period ? 'flat' : 'outlined'}
          >
            {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
          </Chip>
        ))}
      </View>

      {/* Monetization Section */}
      {earnings && (
        <Card style={{ padding: 16, marginBottom: 16, backgroundColor: '#f8f9fa' }}>
          <Text style={[styles.h3, { marginBottom: 16, color: '#2e7d32' }]}>💰 Monetization</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[styles.h2, { color: '#2e7d32' }]}>
                {AnalyticsService.formatCurrency(earnings.totalEarnings)}
              </Text>
              <Text style={styles.statText}>Total Earnings</Text>
            </View>
            
            {analytics.monetization && (
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Chip 
                  mode="flat" 
                  style={{ 
                    backgroundColor: analytics.monetization.isEligible ? '#4caf50' : '#ff9800' 
                  }}
                >
                  {analytics.monetization.isEligible ? 'Eligible' : 'Not Eligible'}
                </Chip>
                <Text style={[styles.statText, { marginTop: 4 }]}>Monetization Status</Text>
              </View>
            )}
          </View>

          {analytics.monetization && (
            <View>
              <Text style={[styles.bold, { marginBottom: 8 }]}>Requirements Progress:</Text>
              
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>Followers</Text>
                  <Text style={styles.bold}>
                    {AnalyticsService.formatNumber(analytics.monetization.requirements.followers.current)} / {AnalyticsService.formatNumber(analytics.monetization.requirements.followers.required)}
                  </Text>
                </View>
                <ProgressBar 
                  progress={Math.min(analytics.monetization.requirements.followers.current / analytics.monetization.requirements.followers.required, 1)} 
                  color={analytics.monetization.requirements.followers.met ? '#4caf50' : '#ff9800'}
                />
              </View>

              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>Recent Activity (24h)</Text>
                  <Text style={styles.bold}>
                    {analytics.monetization.requirements.recentActivity.postsLast24h} / {analytics.monetization.requirements.recentActivity.required} posts
                  </Text>
                </View>
                <ProgressBar 
                  progress={Math.min(analytics.monetization.requirements.recentActivity.postsLast24h / analytics.monetization.requirements.recentActivity.required, 1)} 
                  color={analytics.monetization.requirements.recentActivity.met ? '#4caf50' : '#ff9800'}
                />
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Overview Stats */}
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <Text style={[styles.h3, { marginBottom: 16 }]}>📊 Overview ({analytics.period})</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.h2, { color: "#1DA1F2" }]}>
              {AnalyticsService.formatNumber(analytics.overview.totalPosts)}
            </Text>
            <Text style={styles.statText}>Posts</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.h2, { color: "#e91e63" }]}>
              {AnalyticsService.formatNumber(analytics.overview.totalViews)}
            </Text>
            <Text style={styles.statText}>Views</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.h2, { color: "#4CAF50" }]}>
              {AnalyticsService.formatNumber(analytics.overview.totalLikes)}
            </Text>
            <Text style={styles.statText}>Likes</Text>
          </View>
        </View>
      </Card>

      {/* Engagement Chart */}
      {engagementData && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text style={[styles.h3, { marginBottom: 16 }]}>📈 Engagement Breakdown</Text>
          <BarChart
            data={engagementData}
            width={screenWidth - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
            <Text style={styles.bold}>Engagement Rate</Text>
            <Text style={[styles.bold, { color: "#4CAF50" }]}>
              {analytics.overview.engagementRate.toFixed(1)}%
            </Text>
          </View>
        </Card>
      )}

      {/* Top Posts Performance */}
      {topPostsData && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text style={[styles.h3, { marginBottom: 16 }]}>🚀 Top Posts Performance</Text>
          <LineChart
            data={topPostsData}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          
          {/* Top Posts List */}
          <View style={{ marginTop: 16 }}>
            {analytics.topPosts.slice(0, 3).map((post, index) => (
              <View key={post.id} style={{ 
                marginBottom: 12, 
                padding: 12, 
                backgroundColor: '#f5f5f5', 
                borderRadius: 8 
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.bold, { marginRight: 8 }]}>#{index + 1}</Text>
                  <Text numberOfLines={1} style={{ flex: 1 }}>
                    Post #{index + 1}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.statText}>{AnalyticsService.formatNumber(post.views)} views</Text>
                  <Text style={styles.statText}>{AnalyticsService.formatNumber(post.likes)} likes</Text>
                  <Text style={styles.statText}>{AnalyticsService.formatCurrency(post.earnings)} earned</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Social Growth */}
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <Text style={[styles.h3, { marginBottom: 16 }]}>📊 Social Growth</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.h2, { color: "#9c27b0" }]}>
              {AnalyticsService.formatNumber(analytics.overview.followerCount)}
            </Text>
            <Text style={styles.statText}>Followers</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.h2, { color: "#ff9800" }]}>
              {AnalyticsService.formatNumber(analytics.overview.followingCount)}
            </Text>
            <Text style={styles.statText}>Following</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.h2, { color: "#4caf50" }]}>
              {AnalyticsService.formatCurrency(analytics.overview.donationsReceived)}
            </Text>
            <Text style={styles.statText}>Donations</Text>
          </View>
        </View>
      </Card>

      <Button mode="contained" onPress={loadAnalytics} style={{ marginTop: 8 }}>
        Refresh Analytics
      </Button>
    </ScrollView>
  );
};

export default AnalyticsPage;

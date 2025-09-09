
/** @format */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { Card, Button, Chip, Divider } from "react-native-paper";
import styles from "../css/styles";
import SubscriptionService from "../services/SubscriptionService";
import AuthService from "../services/AuthService";

const SubscriptionPage = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      // Load available subscriptions
      const subsResult = await SubscriptionService.getAvailableSubscriptions();
      if (subsResult.success) {
        setSubscriptions(subsResult.subscriptions || []);
      }

      // Load current user subscription
      const currentUser = AuthService.user;
      if (currentUser) {
        setCurrentSubscription(currentUser.membership);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (subscriptionId: string) => {
    Alert.alert(
      "Confirm Subscription",
      "Are you sure you want to subscribe to this plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Subscribe",
          onPress: async () => {
            try {
              const result = await SubscriptionService.subscribe(subscriptionId);
              if (result.success) {
                Alert.alert("Success", "Subscription activated successfully!");
                loadSubscriptionData();
              } else {
                Alert.alert("Error", result.error || "Subscription failed");
              }
            } catch (error) {
              Alert.alert("Error", "An unexpected error occurred");
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You'll lose access to premium features.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await SubscriptionService.cancelSubscription();
              if (result.success) {
                Alert.alert("Success", "Subscription cancelled successfully");
                loadSubscriptionData();
              } else {
                Alert.alert("Error", result.error || "Failed to cancel subscription");
              }
            } catch (error) {
              Alert.alert("Error", "An unexpected error occurred");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading subscriptions...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.home, { padding: 16 }]}>
      <Text style={[styles.h1, { marginBottom: 24 }]}>Subscription Plans</Text>

      {/* Current Subscription */}
      {currentSubscription && (
        <Card style={{ padding: 16, marginBottom: 24 }}>
          <Text style={[styles.h3, { marginBottom: 16 }]}>Current Plan</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Chip
              icon="crown"
              style={{ marginRight: 8, backgroundColor: "#FFD700" }}
            >
              {currentSubscription.subscription.toUpperCase()}
            </Chip>
            {currentSubscription.subscription !== "free" && (
              <Text style={styles.statText}>
                Next billing: {currentSubscription.nextBillingDate ? 
                  new Date(currentSubscription.nextBillingDate).toLocaleDateString() : 
                  "N/A"
                }
              </Text>
            )}
          </View>
          
          {currentSubscription.subscription !== "free" && (
            <Button
              mode="outlined"
              onPress={handleCancelSubscription}
              style={{ marginTop: 8 }}
            >
              Cancel Subscription
            </Button>
          )}
        </Card>
      )}

      {/* Available Subscriptions */}
      {subscriptions.map((subscription) => (
        <Card key={subscription.id} style={{ padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={[styles.h2, { color: subscription.type === "pro" ? "#FFD700" : "#1DA1F2" }]}>
              {subscription.name}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.h2, { color: "#4CAF50" }]}>
                ${subscription.price}
              </Text>
              <Text style={styles.statText}>/{subscription.interval}</Text>
            </View>
          </View>

          <Text style={{ marginBottom: 16, color: "#666" }}>
            {subscription.description}
          </Text>

          <Text style={[styles.h4, { marginBottom: 12 }]}>Features:</Text>
          {subscription.features?.map((feature: string, index: number) => (
            <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: "#4CAF50", marginRight: 8 }}>✓</Text>
              <Text>{feature}</Text>
            </View>
          ))}

          <Divider style={{ marginVertical: 16 }} />

          <Button
            mode="contained"
            onPress={() => handleSubscribe(subscription.id)}
            disabled={currentSubscription?.subscription === subscription.type}
            style={{
              backgroundColor: subscription.type === "pro" ? "#FFD700" : "#1DA1F2",
            }}
          >
            {currentSubscription?.subscription === subscription.type
              ? "Current Plan"
              : `Subscribe to ${subscription.name}`
            }
          </Button>
        </Card>
      ))}

      {/* Benefits Section */}
      <Card style={{ padding: 16, marginTop: 16 }}>
        <Text style={[styles.h3, { marginBottom: 16 }]}>Why Upgrade?</Text>
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.h4, { marginBottom: 8 }]}>Premium Features</Text>
          <Text>• Advanced analytics and insights</Text>
          <Text>• Priority customer support</Text>
          <Text>• Enhanced profile customization</Text>
          <Text>• Exclusive content creation tools</Text>
        </View>
        <View>
          <Text style={[styles.h4, { marginBottom: 8 }]}>Pro Features</Text>
          <Text>• Everything in Premium</Text>
          <Text>• Business profile tools</Text>
          <Text>• Advanced advertising options</Text>
          <Text>• API access for integrations</Text>
          <Text>• White-label solutions</Text>
        </View>
      </Card>
    </ScrollView>
  );
};

export default SubscriptionPage;

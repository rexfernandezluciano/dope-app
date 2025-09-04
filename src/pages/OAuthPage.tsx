
/** @format */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { Card, Button, List, Switch, Divider } from "react-native-paper";
import styles from "../css/styles";
import OAuthService from "../services/OAuthService";

const OAuthPage = () => {
  const [connectedApps, setConnectedApps] = useState<any[]>([]);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOAuthData();
  }, []);

  const loadOAuthData = async () => {
    try {
      const [appsResult, providersResult] = await Promise.all([
        OAuthService.getConnectedApps(),
        OAuthService.getAvailableProviders(),
      ]);

      if (appsResult.success) {
        setConnectedApps(appsResult.apps || []);
      }

      if (providersResult.success) {
        setAvailableProviders(providersResult.providers || []);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load OAuth data");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      const result = await OAuthService.initiateOAuth(provider);
      if (result.success && result.authUrl) {
        // In a real app, you'd open this URL in a web browser or WebView
        Alert.alert(
          "Connect Account",
          `Please visit the following URL to connect your ${provider} account:\n\n${result.authUrl}`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Copy URL", onPress: () => {
              // Copy URL to clipboard
              console.log("Copied URL:", result.authUrl);
            }},
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to initiate OAuth");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const handleDisconnect = async (appId: string, provider: string) => {
    Alert.alert(
      "Disconnect Account",
      `Are you sure you want to disconnect your ${provider} account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await OAuthService.revokeOAuth(appId);
              if (result.success) {
                Alert.alert("Success", "Account disconnected successfully");
                loadOAuthData();
              } else {
                Alert.alert("Error", result.error || "Failed to disconnect account");
              }
            } catch (error) {
              Alert.alert("Error", "An unexpected error occurred");
            }
          },
        },
      ]
    );
  };

  const handleTogglePermission = async (appId: string, permission: string, enabled: boolean) => {
    try {
      const result = await OAuthService.updatePermissions(appId, { [permission]: enabled });
      if (result.success) {
        loadOAuthData();
      } else {
        Alert.alert("Error", result.error || "Failed to update permissions");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading OAuth settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.home} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.h1, { marginBottom: 24 }]}>Connected Apps & Services</Text>

      {/* Connected Apps */}
      {connectedApps.length > 0 && (
        <Card style={{ padding: 16, marginBottom: 24 }}>
          <Text style={[styles.h3, { marginBottom: 16 }]}>Connected Accounts</Text>
          {connectedApps.map((app) => (
            <View key={app.id}>
              <List.Item
                title={app.provider}
                description={`Connected on ${new Date(app.connectedAt).toLocaleDateString()}`}
                left={(props) => <List.Icon {...props} icon={getProviderIcon(app.provider)} />}
                right={() => (
                  <Button
                    mode="outlined"
                    onPress={() => handleDisconnect(app.id, app.provider)}
                    compact
                  >
                    Disconnect
                  </Button>
                )}
              />
              
              {/* Permissions */}
              {app.permissions && (
                <View style={{ marginLeft: 16, marginBottom: 16 }}>
                  <Text style={[styles.h5, { marginBottom: 8 }]}>Permissions:</Text>
                  {Object.entries(app.permissions).map(([permission, enabled]) => (
                    <View key={permission} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text>{formatPermissionName(permission)}</Text>
                      <Switch
                        value={enabled as boolean}
                        onValueChange={(value) => handleTogglePermission(app.id, permission, value)}
                      />
                    </View>
                  ))}
                </View>
              )}
              
              <Divider style={{ marginVertical: 16 }} />
            </View>
          ))}
        </Card>
      )}

      {/* Available Providers */}
      <Card style={{ padding: 16 }}>
        <Text style={[styles.h3, { marginBottom: 16 }]}>Connect New Account</Text>
        <Text style={{ marginBottom: 16, color: "#666" }}>
          Connect your social media accounts to cross-post content and sync your audience.
        </Text>
        
        {availableProviders.map((provider) => (
          <List.Item
            key={provider.name}
            title={provider.displayName}
            description={provider.description}
            left={(props) => <List.Icon {...props} icon={getProviderIcon(provider.name)} />}
            right={() => (
              <Button
                mode="contained"
                onPress={() => handleConnect(provider.name)}
                disabled={connectedApps.some(app => app.provider === provider.name)}
                compact
              >
                {connectedApps.some(app => app.provider === provider.name) ? "Connected" : "Connect"}
              </Button>
            )}
          />
        ))}
      </Card>

      {/* OAuth Apps (for developers) */}
      <Card style={{ padding: 16, marginTop: 16 }}>
        <Text style={[styles.h3, { marginBottom: 16 }]}>Developer Settings</Text>
        <Text style={{ marginBottom: 16, color: "#666" }}>
          Manage OAuth applications that have access to your account.
        </Text>
        
        <Button
          mode="outlined"
          onPress={() => Alert.alert("Coming Soon", "OAuth app management coming soon")}
          style={{ marginBottom: 8 }}
        >
          Manage OAuth Apps
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => Alert.alert("Coming Soon", "Developer dashboard coming soon")}
        >
          Developer Dashboard
        </Button>
      </Card>
    </ScrollView>
  );
};

const getProviderIcon = (provider: string): string => {
  const iconMap: { [key: string]: string } = {
    google: "google",
    facebook: "facebook",
    twitter: "twitter",
    linkedin: "linkedin",
    github: "github",
    instagram: "instagram",
    youtube: "youtube",
    tiktok: "music-note",
    discord: "discord",
  };
  return iconMap[provider.toLowerCase()] || "link";
};

const formatPermissionName = (permission: string): string => {
  return permission
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export default OAuthPage;

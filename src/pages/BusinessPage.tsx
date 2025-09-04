
/** @format */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { Card, Button, Switch, TextInput } from "react-native-paper";
import styles from "../css/styles";
import BusinessService from "../services/BusinessService";

const BusinessPage = () => {
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    website: "",
    phone: "",
    address: "",
    description: "",
    isVerified: false,
  });

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      const result = await BusinessService.getBusinessProfile();
      if (result.success) {
        setBusinessProfile(result.business);
        setFormData({
          businessName: result.business?.name || "",
          businessType: result.business?.type || "",
          website: result.business?.website || "",
          phone: result.business?.phone || "",
          address: result.business?.address || "",
          description: result.business?.description || "",
          isVerified: result.business?.isVerified || false,
        });
      }
    } catch (error) {
      console.error("Error loading business profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const result = businessProfile
        ? await BusinessService.updateBusinessProfile(formData)
        : await BusinessService.createBusinessProfile(formData);

      if (result.success) {
        setBusinessProfile(result.business);
        setEditMode(false);
        Alert.alert("Success", "Business profile saved successfully");
      } else {
        Alert.alert("Error", result.error || "Failed to save business profile");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading business profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.home} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Text style={styles.h1}>Business Profile</Text>
        <Button
          mode={editMode ? "outlined" : "contained"}
          onPress={() => editMode ? setEditMode(false) : setEditMode(true)}
        >
          {editMode ? "Cancel" : "Edit"}
        </Button>
      </View>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <Text style={[styles.h3, { marginBottom: 16 }]}>Business Information</Text>

        <TextInput
          label="Business Name"
          value={formData.businessName}
          onChangeText={(text) => setFormData({ ...formData, businessName: text })}
          disabled={!editMode}
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Business Type"
          value={formData.businessType}
          onChangeText={(text) => setFormData({ ...formData, businessType: text })}
          disabled={!editMode}
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Website"
          value={formData.website}
          onChangeText={(text) => setFormData({ ...formData, website: text })}
          disabled={!editMode}
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Phone"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          disabled={!editMode}
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          disabled={!editMode}
          multiline
          numberOfLines={3}
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Description"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          disabled={!editMode}
          multiline
          numberOfLines={4}
          style={{ marginBottom: 16 }}
        />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text>Verified Business</Text>
          <Switch
            value={formData.isVerified}
            disabled={true} // Only admins can verify
          />
        </View>

        {editMode && (
          <Button
            mode="contained"
            onPress={handleSave}
            style={{ marginTop: 16 }}
          >
            Save Changes
          </Button>
        )}
      </Card>

      {businessProfile && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text style={[styles.h3, { marginBottom: 16 }]}>Business Stats</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.h2, { color: "#1DA1F2" }]}>
                {businessProfile.stats?.totalViews || 0}
              </Text>
              <Text style={styles.statText}>Total Views</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.h2, { color: "#4CAF50" }]}>
                {businessProfile.stats?.totalClicks || 0}
              </Text>
              <Text style={styles.statText}>Profile Clicks</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.h2, { color: "#e91e63" }]}>
                {businessProfile.stats?.totalContacts || 0}
              </Text>
              <Text style={styles.statText}>Contacts</Text>
            </View>
          </View>
        </Card>
      )}

      <Card style={{ padding: 16 }}>
        <Text style={[styles.h3, { marginBottom: 16 }]}>Business Tools</Text>
        <Button
          mode="outlined"
          style={{ marginBottom: 8 }}
          onPress={() => Alert.alert("Coming Soon", "Promoted posts feature coming soon")}
        >
          Create Promoted Post
        </Button>
        <Button
          mode="outlined"
          style={{ marginBottom: 8 }}
          onPress={() => Alert.alert("Coming Soon", "Business analytics feature coming soon")}
        >
          View Business Analytics
        </Button>
        <Button
          mode="outlined"
          onPress={() => Alert.alert("Coming Soon", "Ad manager feature coming soon")}
        >
          Manage Ads
        </Button>
      </Card>
    </ScrollView>
  );
};

export default BusinessPage;

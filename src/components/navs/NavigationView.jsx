
/** @format */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity, ScrollView } from "react-native";
import { Appbar, Avatar, useTheme, Text } from "react-native-paper";

const NavigationView = ({ children, logo, avatar, onTabChange, ...props }) => {
  const theme = useTheme();
  const [isDesktop, setIsDesktop] = useState(false);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const tabs = [
    { title: "Feed" },
    { title: "Following" },
    { title: "Trending" }
  ];

  useEffect(() => {
    const handleResize = () => {
      const width = Dimensions.get('window').width;
      setWindowWidth(width);
      setIsDesktop(width > 768);
    };

    const subscription = Dimensions.addEventListener('change', handleResize);
    handleResize();

    return () => subscription?.remove?.();
  }, []);

  const handleTabPress = (index) => {
    setActiveTabIndex(index);
    if (onTabChange) {
      onTabChange(index);
    }
  };

  const renderTabButton = (tab, index) => {
    const isActive = activeTabIndex === index;
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.tabButton,
          isActive && styles.activeTabButton,
          isDesktop && styles.desktopTabButton
        ]}
        onPress={() => handleTabPress(index)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.tabText,
          isActive && styles.activeTabText,
          isDesktop && styles.desktopTabText
        ]}>
          {tab.title}
        </Text>
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  const renderMobileLayout = () => (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.mobileHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.logoText}>{logo || "DOPE"}</Text>
          {avatar && (
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => console.log("Avatar pressed")}
              activeOpacity={0.8}
            >
              <Avatar.Image size={32} source={avatar} style={styles.avatar} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabRow}>
          {tabs.map(renderTabButton)}
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );

  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.desktopLogo}>{logo || "DOPE"}</Text>
        </View>
        
        <View style={styles.sidebarTabs}>
          {tabs.map(renderTabButton)}
        </View>

        {avatar && (
          <View style={styles.sidebarFooter}>
            <TouchableOpacity
              style={styles.desktopAvatarContainer}
              onPress={() => console.log("Avatar pressed")}
              activeOpacity={0.8}
            >
              <Avatar.Image size={40} source={avatar} style={styles.desktopAvatar} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.desktopContent}>
        {children}
      </View>
    </View>
  );

  return isDesktop ? renderDesktopLayout() : renderMobileLayout();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  
  // Mobile Header
  mobileHeader: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  avatarContainer: {
    padding: 2,
  },
  avatar: {
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },

  // Tab Navigation
  tabContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeTabButton: {
    // Active state styling handled by indicator
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
    textAlign: "center",
  },
  activeTabText: {
    color: "#1a1a1a",
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },

  // Content
  contentContainer: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  // Desktop Layout
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fafafa",
  },
  sidebar: {
    width: 240,
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderRightColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  sidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  desktopLogo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.8,
  },
  sidebarTabs: {
    flex: 1,
    paddingTop: 16,
  },
  desktopTabButton: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 2,
    marginHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
  desktopTabText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  sidebarFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  desktopAvatarContainer: {
    padding: 4,
    alignSelf: "flex-start",
  },
  desktopAvatar: {
    borderWidth: 2,
    borderColor: "#e5e5e5",
  },
  desktopContent: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  // Active states for desktop
  activeDesktopTab: {
    backgroundColor: "#f0f8ff",
  },
});

export default NavigationView;

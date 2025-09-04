/** @format */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Platform, Dimensions } from "react-native";
import { Appbar, Avatar, useTheme, Text, Tabs, Tab } from "react-native-paper";

const NavigationView = ({ children, logo, avatar, tabs, onTabChange, ...props }) => {
  const theme = useTheme();
  const [isDesktop, setIsDesktop] = useState(false);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(Dimensions.get('window').width);
      setIsDesktop(Dimensions.get('window').width > 768); // Adjust breakpoint as needed
    };

    Dimensions.addEventListener('change', handleResize);
    handleResize(); // Initial check

    return () => {
      Dimensions.removeEventListener('change', handleResize);
    };
  }, []);

  useEffect(() => {
    setIsDesktop(windowWidth > 768);
  }, [windowWidth]);

  const handleTabPress = (index) => {
    setActiveTabIndex(index);
    if (onTabChange) {
      onTabChange(index);
    }
  };

  const renderMobileAppbar = () => (
    <Appbar.Header style={styles.appbar}>
      <Appbar.Content title={logo || "DOPE"} />
      {avatar && (
        <Appbar.Action
          icon={() => (
            <Avatar.Image size={35} source={avatar} />
          )}
          style={styles.avatar}
          onPress={() => console.log("Avatar pressed")}
        />
      )}
    </Appbar.Header>
  );

  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      <View style={styles.desktopSidebar}>
        {logo && <Text style={styles.logo}>{logo}</Text>}
        <Tabs
          style={styles.desktopTabs}
          theme={theme}
          onChange={handleTabPress}
          selectedIndex={activeTabIndex}
        >
          {tabs &&
            tabs.map((tab, index) => (
              <Tab key={index} text={tab.title} />
            ))}
        </Tabs>
        {avatar && (
          <Avatar.Image
            size={35}
            source={avatar}
            style={styles.desktopAvatar}
          />
        )}
      </View>
      <View style={styles.desktopContent}>{children}</View>
    </View>
  );

  return (
    <View style={styles.container} {...props}>
      {isDesktop ? renderDesktopLayout() : renderMobileAppbar()}
      {!isDesktop && children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0
  },
  appbar: {
    backgroundColor: "#fff",
    height: "auto"
  },
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
  },
  desktopSidebar: {
    width: 200, // Adjust as needed
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  desktopTabs: {
    marginTop: 16,
  },
  desktopContent: {
    flex: 1,
    padding: 16,
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  desktopAvatar: {
    marginTop: 'auto',
  },
  avatar: {
    border: 1,
    borderColor: '#eeeeee',
    borderRadius: "60px !important"
  }
});

export default NavigationView;
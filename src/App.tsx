/** @format */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import { MD3LightTheme as DefaultTheme, PaperProvider, configureFonts } from "react-native-paper";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import AppNavigator from "./navigation/AppNavigator";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure custom fonts
const fontConfig = {
        web: {
                regular: {
                        fontFamily: "System, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontWeight: "400" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
                medium: {
                        fontFamily: "System, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontWeight: "500" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
                light: {
                        fontFamily: "System, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontWeight: "300" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
                thin: {
                        fontFamily: "System, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontWeight: "100" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
        },
        ios: {
                regular: {
                        fontFamily: "System",
                        fontWeight: "400" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
                medium: {
                        fontFamily: "System",
                        fontWeight: "500" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
                light: {
                        fontFamily: "System",
                        fontWeight: "300" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
                thin: {
                        fontFamily: "System",
                        fontWeight: "100" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
        },
        android: {
                regular: {
                        fontFamily: "System",
                        fontWeight: "400" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
                medium: {
                        fontFamily: "System",
                        fontWeight: "500" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
                light: {
                        fontFamily: "System",
                        fontWeight: "300" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
                thin: {
                        fontFamily: "System",
                        fontWeight: "100" as any,
                        fontSize: 14,
                        lineHeight: 20,
                        letterSpacing: 0,
                },
        },
};

const theme = {
        ...DefaultTheme,
        colors: {
                ...DefaultTheme.colors,
                primary: "#0069B5",
                secondary: "#0c57aa",
                background: "#ffffff",
        },
        fonts: configureFonts({}),
        components: {
                Card: {
                        elevation: 0,
                        style: {
                                elevation: 0,
                                shadowColor: "transparent",
                        },
                },
                TextInput: {
                        style: {
                                borderRadius: 16,
                                borderWidth: 1,
                        },
                },
        },
};

const App = () => {
        const [appIsReady, setAppIsReady] = useState(false);
        const [progress] = useState(new Animated.Value(0));

        useEffect(() => {
                async function prepare() {
                        try {
                                // Pre-load fonts, make any API calls you need to do here
                                await Font.loadAsync({
                                        Default: require("./fonts/default/default.ttf"),
                                        System: require("./fonts/system/system.ttf"),
                                        Dope: require("./fonts/dope.ttf"),
                                });

                                // Artificially delay for two seconds to simulate the loading process
                                await new Promise(resolve => setTimeout(resolve, 2000));
                        } catch (e) {
                                console.warn(e);
                        } finally {
                                // Tell the application to render
                                setAppIsReady(true);
                        }
                }

                prepare();
        }, []);

        useEffect(() => {
                if (appIsReady) {
                        // Hide splash screen once app is ready
                        SplashScreen.hideAsync();
                }
        }, [appIsReady]);

        if (!appIsReady) {
                return (
                        <View style={styles.splashContainer}>
                                <Image
                                        source={require("../assets/icon.png")}
                                        style={styles.splashImage}
                                        resizeMode="contain"
                                />
                                <ActivityIndicator
                                        size="large"
                                        color="#0069B5"
                                        style={styles.loader}
                                />
                                <Animated.View
                                        style={[
                                                styles.progressBar,
                                                {
                                                        width: progress.interpolate({
                                                                inputRange: [0, 100],
                                                                outputRange: ["0%", "100%"],
                                                        }),
                                                },
                                        ]}
                                />
                        </View>
                );
        }

        return (
                <PaperProvider theme={theme}>
                        <StatusBar style="auto" />
                        <AppNavigator />
                </PaperProvider>
        );
};

const styles = StyleSheet.create({
        splashContainer: {
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#ffffff",
        },
        splashImage: {
                width: 150,
                height: 150,
                marginBottom: 20,
        },
        splashText: {
                fontSize: 32,
                color: "#0069B5",
                marginBottom: 40,
                letterSpacing: 2,
        },
        loader: {
                marginBottom: 20,
        },
        progressBar: {
                height: 4,
                backgroundColor: "#0069B5",
                width: "0%",
        },
});

export default App;

/** @format */

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { IconButton } from "react-native-paper";

// Import pages
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import ProfilePage from "../pages/ProfilePage";
import AnalyticsPage from "../pages/AnalyticsPage";
import BusinessPage from "../pages/BusinessPage";
import SubscriptionPage from "../pages/SubscriptionPage";
import OAuthPage from "../pages/OAuthPage";
import SearchPage from "../pages/SearchPage";

// Import services
import AuthService from "../services/AuthService";

// Types for better type safety
type TabIconName = "home-variant" | "account" | "chart-line" | "briefcase" | "crown" | "link";

interface TabIconProps {
	focused: boolean;
	color: string;
	size: number;
}

interface RouteParams {
	route: {
		name: string;
	};
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Configuration constants
const TAB_CONFIG = {
	activeTintColor: "#0069b5",
	inactiveTintColor: "#6B7280",
	iconSize: 24,
} as const;

const ICON_MAP: Record<string, TabIconName> = {
	home: "home-variant",
	profile: "account",
	analytics: "chart-line",
	business: "briefcase",
	subscription: "crown",
	oauth: "link",
} as const;

const STACK_SCREEN_OPTIONS = {
	headerShown: false,
	cardStyle: { backgroundColor: "#FFFFFF" },
	animationEnabled: true,
} as const;

const TAB_SCREEN_OPTIONS = {
	headerShown: false,
	tabBarStyle: {
		paddingBottom: 5,
		paddingTop: 5,
		height: 60,
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
	},
	tabBarLabelStyle: {
		fontSize: 12,
		fontWeight: "500" as const,
	},
} as const;

// Optimized tab icon component
const TabIcon: React.FC<TabIconProps & { iconName: TabIconName }> = React.memo(({ iconName, size, color }) => (
	<IconButton
		icon={iconName}
		size={size}
		iconColor={color}
		style={{ margin: 0 }}
	/>
));

// Tab Navigator Component
const MainTabNavigator: React.FC = React.memo(() => {
	const tabScreenOptions = useCallback(
		({ route }: RouteParams) => ({
			...TAB_SCREEN_OPTIONS,
			tabBarIcon: ({ focused, color, size }: TabIconProps) => {
				const iconName = ICON_MAP[route.name] || ICON_MAP.home;
				return (
					<TabIcon
						iconName={iconName}
						focused={focused}
						color={color}
						size={size}
					/>
				);
			},
			tabBarActiveTintColor: TAB_CONFIG.activeTintColor,
			tabBarInactiveTintColor: TAB_CONFIG.inactiveTintColor,
		}),
		[],
	);

	return (
		<Tab.Navigator
			screenOptions={tabScreenOptions}
			initialRouteName="home">
			<Tab.Screen
				name="home"
				component={HomePage}
				options={{
					tabBarLabel: "Home",
				}}
			/>
			<Tab.Screen
				name="profile"
				component={ProfilePage}
				options={{ tabBarLabel: "Profile" }}
			/>
			<Tab.Screen
				name="analytics"
				component={AnalyticsPage}
				options={{ tabBarLabel: "Analytics" }}
			/>
			<Tab.Screen
				name="business"
				component={BusinessPage}
				options={{ tabBarLabel: "Business" }}
			/>
			<Tab.Screen
				name="subscription"
				component={SubscriptionPage}
				options={{ tabBarLabel: "Premium" }}
			/>
			<Tab.Screen
				name="oauth"
				component={OAuthPage}
				options={{ tabBarLabel: "Connect" }}
			/>
		</Tab.Navigator>
	);
});

// Main Stack Navigator for authenticated users
const AuthenticatedStack: React.FC = React.memo(() => {
	return (
		<Stack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
			<Stack.Screen
				name="main"
				component={MainTabNavigator}
				options={{
					gestureEnabled: false, // Prevent swiping back to login
				}}
			/>
			<Stack.Screen
				name="search"
				component={SearchPage}
				options={{
					title: "Search",
					headerShown: false,
					headerStyle: {
						backgroundColor: TAB_CONFIG.activeTintColor,
					},
					headerTintColor: "#FFFFFF",
					headerTitleStyle: {
						fontWeight: "600",
					},
					presentation: "modal", // Optional: makes it feel like an overlay
					animationTypeForReplace: "push",
				}}
			/>
		</Stack.Navigator>
	);
});

// Authentication Stack Navigator
const AuthStack: React.FC = React.memo(() => {
	return (
		<Stack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
			<Stack.Screen
				name="login"
				component={LoginPage}
				options={{
					title: "Sign In",
				}}
			/>
			<Stack.Screen
				name="signup"
				component={SignupPage}
				options={{
					title: "Create Account",
					presentation: "modal",
				}}
			/>
		</Stack.Navigator>
	);
});

// Main App Navigator
const AppNavigator: React.FC = () => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// Move checkAuthenticationStatus outside useEffect and memoize it
	const checkAuthenticationStatus = useCallback(async () => {
		try {
			setIsLoading(true);
			const authStatus = await AuthService.checkAuthStatus();
			setIsAuthenticated(authStatus);
		} catch (error) {
			console.error("Authentication check failed:", error);
			setIsAuthenticated(false);
		} finally {
			setIsLoading(false);
		}
	}, []); // Empty dependency array since AuthService should be stable

	useEffect(() => {
		checkAuthenticationStatus();

		// Set up auth state listener if AuthService supports it
		const unsubscribe = AuthService.onAuthStateChanged?.(setIsAuthenticated);

		return () => {
			unsubscribe?.();
		};
	}, []); // Remove checkAuthenticationStatus from dependencies

	// Memoize navigation structure to prevent unnecessary re-renders
	const NavigationStructure = useMemo(() => {
		if (isLoading) {
			return null; // Or return a loading component
		}

		return isAuthenticated ? <AuthenticatedStack /> : <AuthStack />;
	}, [isAuthenticated, isLoading]);

	return <NavigationContainer>{NavigationStructure}</NavigationContainer>;
};

// Add display names for better debugging
MainTabNavigator.displayName = "MainTabNavigator";
AuthenticatedStack.displayName = "AuthenticatedStack";
AuthStack.displayName = "AuthStack";
TabIcon.displayName = "TabIcon";

export default AppNavigator;

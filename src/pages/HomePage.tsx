/** @format */

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, Alert, Dimensions, ScrollView } from "react-native";
import { FAB, IconButton, Modal, Portal, Chip, Surface, Button, Divider, ActivityIndicator } from "react-native-paper";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useNavigation } from "@react-navigation/native";

import styles from "../css/styles";
import PostView from "../components/PostView";
import PostService from "../services/PostService";
import AuthService from "../services/AuthService";
import { Post, PostFilters, FilterState } from "../api/interface/post.interface";

interface TabRoute {
	key: string;
	title: string;
}

interface HomePagePost extends Post {
	// Add any additional properties if needed
}

const initialWidth = Dimensions.get("window").width;

const HomePage: React.FC = () => {
	const navigation = useNavigation();

	// State management for posts and UI
	const [feedPosts, setFeedPosts] = useState<HomePagePost[]>([]);
	const [followingPosts, setFollowingPosts] = useState<HomePagePost[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

	// Tab navigation state
	const [tabIndex, setTabIndex] = useState<number>(0);
	const routes = useMemo<TabRoute[]>(
		() => [
			{ key: "feed", title: "Feed" },
			{ key: "following", title: "Following" },
		],
		[],
	);

	// Filter state management
	const [filters, setFilters] = useState<FilterState>({
		postType: "all",
		sortBy: "asc",
		timeRange: "day",
		hasImages: false,
		quality: false,
		random: true,
	});

	// Temporary filter state for modal
	const [tempFilters, setTempFilters] = useState<FilterState>(filters);

	// Memoized filter building function
	const buildPostFilters = useCallback((currentFilters: FilterState): PostFilters => {
		const postFilters: PostFilters = {
			limit: 20,
			sortBy: currentFilters.sortBy,
			timeRange: currentFilters.timeRange,
			random: true,
		};

		if (currentFilters.postType !== "all") {
			postFilters.postType = currentFilters.postType;
		}

		if (currentFilters.hasImages) {
			postFilters.hasImages = true;
		}

		if (currentFilters.quality) {
			postFilters.quality = true;
		}

		return postFilters;
	}, []);

	// Enhanced post fetching with proper error handling and retry logic
	const fetchPosts = useCallback(
		async (feedType: "feed" | "following", refresh = false, retryCount = 0): Promise<void> => {
			try {
				if (refresh) {
					setRefreshing(true);
				} else if (retryCount === 0) {
					setLoading(true);
				}

				const postFilters = buildPostFilters(filters);
				let result;

				if (feedType === "following" && isAuthenticated) {
					result = await PostService.getFollowingFeed(postFilters);
				} else {
					result = await PostService.getPosts(postFilters);
				}

				if (result.success && result.data) {
					const posts = Array.isArray(result.data) ? result.data : [];

					if (feedType === "feed") {
						setFeedPosts(posts);
					} else {
						setFollowingPosts(posts);
					}

					console.log(`${feedType} posts loaded:`, posts.length);
				} else {
					const errorMessage = result.error || `Failed to load ${feedType} posts. Please try again.`;
					if (retryCount < 2) {
						// Auto retry up to 2 times
						setTimeout(() => fetchPosts(feedType, refresh, retryCount + 1), 1000 * (retryCount + 1));
						return;
					}
					Alert.alert("Loading Error", errorMessage, [{ text: "OK", style: "default" }]);
				}
			} catch (error) {
				console.error(`Error fetching ${feedType} posts:`, error);
				if (retryCount < 2) {
					// Auto retry on network errors
					setTimeout(() => fetchPosts(feedType, refresh, retryCount + 1), 1000 * (retryCount + 1));
					return;
				}
				Alert.alert("Network Error", "Unable to connect to the server. Please check your internet connection and try again.", [
					{ text: "Retry", onPress: () => fetchPosts(feedType, refresh, 0) },
					{ text: "Cancel" },
				]);
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[buildPostFilters, filters, isAuthenticated],
	);

	// Authentication status monitoring
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const authStatus = await AuthService.checkAuthStatus();
				setIsAuthenticated(authStatus);
			} catch (error) {
				console.error("Auth status check failed:", error);
				setIsAuthenticated(false);
			}
		};

		checkAuthStatus();
		const unsubscribe = AuthService.onAuthStateChanged?.(user => {
			setIsAuthenticated(!!user);
		});

		return () => unsubscribe?.();
	}, []);

	// Load initial data based on authentication status
	useEffect(() => {
		fetchPosts("feed");
		if (isAuthenticated) {
			fetchPosts("following");
		}
	}, [isAuthenticated, fetchPosts]);

	// Effect for handling filter changes
	useEffect(() => {
		const currentFeedType = routes[tabIndex].key as "feed" | "following";
		fetchPosts(currentFeedType);
	}, [filters, routes, tabIndex, fetchPosts]);

	// Handle tab change with data loading
	const handleIndexChange = useCallback(
		(index: number) => {
			setTabIndex(index);
			const feedType = routes[index].key as "feed" | "following";

			if (feedType === "following" && !isAuthenticated) {
				return;
			}

			// Only fetch if we don't have data
			const posts = feedType === "feed" ? feedPosts : followingPosts;
			if (posts.length === 0) {
				fetchPosts(feedType);
			}
		},
		[routes, isAuthenticated, feedPosts, followingPosts, fetchPosts],
	);

	// Pull-to-refresh functionality
	const onRefresh = useCallback(() => {
		const currentFeedType = routes[tabIndex].key as "feed" | "following";
		fetchPosts(currentFeedType, true);
	}, [routes, tabIndex, fetchPosts]);

	// Filter application with validation
	const applyFilters = useCallback(() => {
		setFilterModalVisible(false);
		setFilters(tempFilters);
	}, [tempFilters]);

	// Reset filters to default state
	const resetFilters = useCallback(() => {
		const defaultFilters: FilterState = {
			postType: "all",
			sortBy: "asc",
			timeRange: "day",
			hasImages: false,
			quality: false,
			random: true,
		};
		setTempFilters(defaultFilters);
	}, []);

	// Post creation navigation
	const handleCreatePost = useCallback(() => {
		if (!isAuthenticated) {
			Alert.alert("Authentication Required", "Please log in to create and share posts with the community.", [
				{
					text: "Log In",
					onPress: () => navigation.navigate("auth" as never),
				},
				{ text: "Cancel", style: "cancel" },
			]);
			return;
		}

		navigation.navigate("createPost" as never);
	}, [isAuthenticated, navigation]);

	// Optimized post renderer with error boundary
	const renderPost = useCallback(
		({ item }: { item: Post }) => {
			try {
				return (
					<PostView
						post={item}
						onComment={postId => navigation.navigate("postDetails" as never, { postId } as never)}
						onRepostWithComment={postId => navigation.navigate("createPost" as never, { repostId: postId } as never)}
						onNavigateToProfile={userId => navigation.navigate("profile" as never, { userId } as never)}
					/>
				);
			} catch (error) {
				console.error("Error rendering post:", error);
				return null;
			}
		},
		[navigation],
	);

	// Enhanced empty state component with contextual messaging
	const renderEmptyState = useCallback(
		(feedType: "feed" | "following") => (
			<View style={styles.emptyState}>
				<Text style={styles.emptyStateTitle}>{feedType === "following" ? "No posts from people you follow" : "No posts found"}</Text>
				<Text style={styles.emptyStateSubtitle}>
					{feedType === "following"
						? "Follow some users to see their posts here, or switch to the Feed tab to discover new content."
						: "Try adjusting your filters or check back later for new content."}
				</Text>
				{feedType === "following" && (
					<Button
						mode="outlined"
						onPress={() => setTabIndex(0)}
						style={{ marginTop: 16 }}>
						Browse Feed
					</Button>
				)}
			</View>
		),
		[],
	);

	// Optimized FlatList configuration
	const flatListConfig = useMemo(
		() => ({
			removeClippedSubviews: true,
			maxToRenderPerBatch: 8,
			updateCellsBatchingPeriod: 50,
			windowSize: 10,
			initialNumToRender: 5,
			getItemLayout: undefined,
		}),
		[],
	);

	// FIXED: Create proper React components instead of functions
	const FeedRoute = useCallback(
		() => (
			<FlatList
				data={feedPosts}
				renderItem={renderPost}
				keyExtractor={item => item.id}
				ListEmptyComponent={() => renderEmptyState("feed")}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={["#0069b5"]}
						tintColor="#0069b5"
					/>
				}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={feedPosts.length === 0 ? styles.emptyContainer : styles.postList}
				{...flatListConfig}
			/>
		),
		[feedPosts, renderPost, renderEmptyState, refreshing, onRefresh, flatListConfig],
	);

	const FollowingRoute = useCallback(() => {
		if (!isAuthenticated) {
			return (
				<View style={styles.emptyState}>
					<Text style={styles.emptyStateTitle}>Authentication Required</Text>
					<Text style={styles.emptyStateSubtitle}>Please log in to view posts from people you follow.</Text>
					<Button
						mode="contained"
						onPress={() => navigation.navigate("login" as never)}
						style={{ marginTop: 16 }}>
						Log In
					</Button>
				</View>
			);
		}

		return (
			<FlatList
				data={followingPosts}
				renderItem={renderPost}
				keyExtractor={item => item.id}
				ListEmptyComponent={() => renderEmptyState("following")}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={["#0069b5"]}
						tintColor="#0069b5"
					/>
				}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={followingPosts.length === 0 ? styles.emptyContainer : styles.postList}
				{...flatListConfig}
			/>
		);
	}, [isAuthenticated, followingPosts, renderPost, renderEmptyState, refreshing, onRefresh, flatListConfig, navigation]);

	// FIXED: Use the components directly in SceneMap
	const renderScene = SceneMap({
		feed: FeedRoute,
		following: FollowingRoute,
	});

	// Custom tab bar component
	const renderTabBar = useCallback(
		(props: any) => (
			<TabBar
				{...props}
				indicatorStyle={styles.tabIndicator}
				style={styles.tabBar}
				labelStyle={styles.tabLabel}
				activeColor="#0069b5"
				inactiveColor="#666666"
				pressColor="rgba(0, 105, 181, 0.12)"
			/>
		),
		[],
	);

	// Enhanced filter modal content with better UX
	const renderFilterModal = useMemo(
		() => (
			<Portal>
				<Modal
					visible={filterModalVisible}
					onDismiss={() => setFilterModalVisible(false)}
					contentContainerStyle={styles.modalContainer}>
					<Surface style={styles.modalSurface}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Filter Posts</Text>
							<IconButton
								icon="close"
								size={24}
								onPress={() => setFilterModalVisible(false)}
							/>
						</View>

						<Divider />
						<ScrollView
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingBottom: 20 }}>
							<View style={styles.filterSection}>
								<Text style={styles.filterSectionTitle}>Post Type</Text>
								<View style={styles.filterChipContainer}>
									{(["all", "text", "poll", "live_video", "repost"] as const).map(type => (
										<Chip
											key={type}
											selected={tempFilters.postType === type}
											onPress={() => setTempFilters(prev => ({ ...prev, postType: type }))}
											style={[styles.filterChip, tempFilters.postType === type && { backgroundColor: "#0069b5" }]}
											textStyle={tempFilters.postType === type ? { color: "#ffffff" } : undefined}>
											{type === "all" ? "All" : type === "live_video" ? "Live" : type.charAt(0).toUpperCase() + type.slice(1)}
										</Chip>
									))}
								</View>
							</View>

							<View style={styles.filterSection}>
								<Text style={styles.filterSectionTitle}>Sort By</Text>
								<View style={styles.filterChipContainer}>
									{(
										[
											{ key: "desc", name: "Recent" },
											{ key: "asc", name: "Older" },
										] as const
									).map(sort => (
										<Chip
											key={sort.key}
											selected={tempFilters.sortBy === sort.key}
											onPress={() => setTempFilters(prev => ({ ...prev, sortBy: sort.key }))}
											style={[styles.filterChip, tempFilters.sortBy === sort.key && { backgroundColor: "#0069b5", color: "#ffffff" }]}
											textStyle={tempFilters.sortBy === sort.key ? { color: "#ffffff" } : undefined}>
											{sort.name}
										</Chip>
									))}
								</View>
							</View>

							<View style={styles.filterSection}>
								<Text style={styles.filterSectionTitle}>Time Range</Text>
								<View style={styles.filterChipContainer}>
									{(["hour", "day", "week", "month", "all"] as const).map(range => (
										<Chip
											key={range}
											selected={tempFilters.timeRange === range}
											onPress={() => setTempFilters(prev => ({ ...prev, timeRange: range }))}
											style={[styles.filterChip, tempFilters.timeRange === range && { backgroundColor: "#0069b5" }]}
											textStyle={tempFilters.timeRange === range ? { color: "#ffffff" } : undefined}>
											{range === "all" ? "All Time" : `Past ${range.charAt(0).toUpperCase() + range.slice(1)}`}
										</Chip>
									))}
								</View>
							</View>

							<View style={styles.filterSection}>
								<Text style={styles.filterSectionTitle}>Content Options</Text>
								<View style={styles.filterChipContainer}>
									<Chip
										selected={tempFilters.hasImages}
										onPress={() => setTempFilters(prev => ({ ...prev, hasImages: !prev.hasImages }))}
										style={[styles.filterChip, tempFilters.hasImages && { backgroundColor: "#0069b5" }]}
										textStyle={tempFilters.hasImages ? { color: "#ffffff" } : undefined}>
										With Images
									</Chip>
									<Chip
										selected={tempFilters.quality}
										onPress={() => setTempFilters(prev => ({ ...prev, quality: !prev.quality }))}
										style={[styles.filterChip, tempFilters.quality && { backgroundColor: "#0069b5" }]}
										textStyle={tempFilters.quality ? { color: "#ffffff" } : undefined}>
										High Quality
									</Chip>
								</View>
							</View>

							<View style={styles.modalActions}>
								<Button
									mode="outlined"
									onPress={resetFilters}
									style={[styles.modalButton, { flex: 1, marginRight: 8 }]}>
									Reset
								</Button>
								<Button
									mode="contained"
									onPress={applyFilters}
									style={[styles.modalButton, { flex: 1, backgroundColor: "#0069b5" }]}>
									Apply Filters
								</Button>
							</View>
						</ScrollView>
					</Surface>
				</Modal>
			</Portal>
		),
		[filterModalVisible, tempFilters, resetFilters, applyFilters],
	);

	// Loading state component with better UX
	if (loading && feedPosts.length === 0 && followingPosts.length === 0) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator
					size="large"
					color="#0069b5"
				/>
				<Text style={{ marginTop: 16, color: "#666666" }}>Loading posts...</Text>
			</View>
		);
	}

	return (
		<View style={[styles.home, { backgroundColor: "#ffffff" }]}>
			{/* Header with filter button */}
			<View style={styles.headerContainer}>
				<Text style={styles.headerTitle}>Home</Text>
				<View style={styles.headerActions}>
					<IconButton
						icon="filter-variant"
						size={24}
						onPress={() => {
							setTempFilters(filters);
							setFilterModalVisible(true);
						}}
						style={styles.filterButton}
					/>
					<IconButton
						icon="magnify"
						size={24}
						onPress={() => navigation.navigate("search" as never)}
						style={styles.filterButton}
					/>
				</View>
			</View>

			{/* Tab view for Feed and Following */}
			<TabView
				navigationState={{ index: tabIndex, routes }}
				renderScene={renderScene}
				onIndexChange={handleIndexChange}
				initialLayout={{ width: initialWidth }}
				renderTabBar={renderTabBar}
				sceneContainerStyle={styles.sceneContainer}
				lazy={true}
				lazyPreloadDistance={1}
			/>

			{/* Filter modal */}
			{renderFilterModal}

			{/* Create post FAB with fixed colors */}
			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: "#0069b5" }]}
				onPress={handleCreatePost}
				color="#ffffff"
				customSize={56}
				visible={true}
			/>
		</View>
	);
};

export default React.memo(HomePage);

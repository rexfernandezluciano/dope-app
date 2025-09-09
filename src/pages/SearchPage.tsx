/** @format */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	ScrollView,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	FlatList,
	Image,
	StyleSheet,
	Dimensions,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import SearchService, { SearchType, SearchFilters, SearchResults, SearchUser, SearchComment } from "../services/SearchService";
import { Post } from "../api/interface/post.interface";

const { width } = Dimensions.get("window");

interface SearchPageProps {
	navigation: any;
	route?: {
		params?: {
			initialQuery?: string;
			searchType?: SearchType;
		};
	};
}

const SearchPage: React.FC<SearchPageProps> = ({ navigation, route }) => {
	// State management
	const [searchQuery, setSearchQuery] = useState<string>(route?.params?.initialQuery || "");
	const [activeTab, setActiveTab] = useState<SearchType>(route?.params?.searchType || "all");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
	const [hasSearched, setHasSearched] = useState<boolean>(false);

	// Search results state
	const [searchResults, setSearchResults] = useState<SearchResults>({
		posts: [],
		users: [],
		comments: [],
		totalResults: 0,
	});

	// Pagination and additional data
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
	const [hasMore, setHasMore] = useState<boolean>(false);
	const [nextCursor, setNextCursor] = useState<string | undefined>();

	// Error handling
	const [error, setError] = useState<string | null>(null);

	// Refs
	const searchInputRef = useRef<TextInput>(null);
	const debounceTimeoutRef = useRef<NodeJS.Timeout>();

	// Load initial data
	useEffect(() => {
		loadTrendingSearches();

		// Auto-focus search input
		const focusTimeout = setTimeout(() => {
			searchInputRef.current?.focus();
		}, 300);

		// Perform initial search if query provided
		if (route?.params?.initialQuery) {
			handleSearch(route.params.initialQuery);
		}

		return () => {
			clearTimeout(focusTimeout);
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, []);

	// Handle search input changes with debouncing
	const handleSearchInputChange = useCallback((text: string) => {
		setSearchQuery(text);

		// Clear previous timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Set new timeout for suggestions
		if (text.trim().length >= 2) {
			debounceTimeoutRef.current = setTimeout(() => {
				loadSearchSuggestions(text);
			}, 300);
		} else {
			setSuggestions([]);
		}
	}, []);

	// Load search suggestions
	const loadSearchSuggestions = async (query: string) => {
		try {
			const response = await SearchService.getSearchSuggestions(query, 5);
			if (response.success && response.data) {
				setSuggestions(response.data);
			}
		} catch (error) {
			console.warn("Failed to load search suggestions:", error);
		}
	};

	// Load trending searches
	const loadTrendingSearches = async () => {
		try {
			const response = await SearchService.getTrendingSearches(10);
			if (response.success && response.data) {
				setTrendingSearches(response.data);
			}
		} catch (error) {
			console.warn("Failed to load trending searches:", error);
		}
	};

	// Perform search based on active tab
	const handleSearch = async (query: string = searchQuery, loadMore: boolean = false) => {
		if (!query.trim()) {
			setError("Please enter a search query");
			return;
		}

		const searchFilters: SearchFilters = {
			query: query.trim(),
			limit: 20,
			sortBy: "desc",
			cursor: loadMore ? nextCursor : undefined,
		};

		try {
			if (!loadMore) {
				setIsLoading(true);
				setError(null);
			}

			let response;

			switch (activeTab) {
				case "posts":
					response = await SearchService.searchPosts(searchFilters);
					if (response.success && response.data) {
						setSearchResults(prev => ({
							...prev,
							posts: loadMore ? [...prev.posts, ...response.data!] : response.data!,
							totalResults: response.data.length,
						}));
					}
					break;

				case "users":
					response = await SearchService.searchUsers(searchFilters);
					if (response.success && response.data) {
						setSearchResults(prev => ({
							...prev,
							users: loadMore ? [...prev.users, ...response.data!] : response.data!,
							totalResults: response.data.length,
						}));
					}
					break;

				case "comments":
					response = await SearchService.searchComments(searchFilters);
					if (response.success && response.data) {
						setSearchResults(prev => ({
							...prev,
							comments: loadMore ? [...prev.comments, ...response.data!] : response.data!,
							totalResults: response.data.length,
						}));
					}
					break;

				default: // "all"
					response = await SearchService.searchAll(searchFilters);
					if (response.success && response.data) {
						const newResults = response.data;
						setSearchResults(
							loadMore
								? {
										posts: [...searchResults.posts, ...newResults.posts],
										users: [...searchResults.users, ...newResults.users],
										comments: [...searchResults.comments, ...newResults.comments],
										totalResults: searchResults.totalResults + newResults.totalResults,
								  }
								: newResults,
						);
					}
					break;
			}

			if (response?.success) {
				setHasMore(response.pagination?.hasMore || false);
				setNextCursor(response.pagination?.nextCursor);
				setHasSearched(true);
				setSuggestions([]); // Clear suggestions after search
			} else {
				setError(response?.error || "Search failed. Please try again.");
			}
		} catch (error) {
			setError("An unexpected error occurred. Please try again.");
			console.error("Search error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle refresh
	const handleRefresh = async () => {
		if (!hasSearched || !searchQuery.trim()) return;

		setIsRefreshing(true);
		await handleSearch(searchQuery);
		setIsRefreshing(false);
	};

	// Handle load more
	const handleLoadMore = () => {
		if (hasMore && !isLoading && nextCursor) {
			handleSearch(searchQuery, true);
		}
	};

	// Handle tab change
	const handleTabChange = (tab: SearchType) => {
		setActiveTab(tab);
		if (hasSearched && searchQuery.trim()) {
			// Reset results and search with new tab
			setSearchResults({ posts: [], users: [], comments: [], totalResults: 0 });
			handleSearch(searchQuery);
		}
	};

	// Handle suggestion tap
	const handleSuggestionTap = (suggestion: string) => {
		setSearchQuery(suggestion);
		setSuggestions([]);
		handleSearch(suggestion);
	};

	// Render search header
	const renderSearchHeader = () => (
		<View style={styles.searchHeader}>
			<TouchableOpacity
				style={styles.backButton}
				onPress={() => navigation.goBack()}
				hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
				<Icon
					name="arrow-back"
					size={24}
					color="#333"
				/>
			</TouchableOpacity>

			<View style={styles.searchInputContainer}>
				<TextInput
					ref={searchInputRef}
					style={styles.searchInput}
					placeholder="Search posts, users, and comments..."
					value={searchQuery}
					onChangeText={handleSearchInputChange}
					onSubmitEditing={() => handleSearch()}
					returnKeyType="search"
					placeholderTextColor="#999"
					autoCapitalize="none"
					autoCorrect={false}
				/>

				{searchQuery.length > 0 && (
					<TouchableOpacity
						style={styles.clearButton}
						onPress={() => {
							setSearchQuery("");
							setSuggestions([]);
							setSearchResults({ posts: [], users: [], comments: [], totalResults: 0 });
							setHasSearched(false);
							setError(null);
						}}>
						<Icon
							name="clear"
							size={20}
							color="#999"
						/>
					</TouchableOpacity>
				)}
			</View>

			<TouchableOpacity
				style={styles.searchButton}
				onPress={() => handleSearch()}
				disabled={!searchQuery.trim() || isLoading}>
				{isLoading ? (
					<ActivityIndicator
						size="small"
						color="#007AFF"
					/>
				) : (
					<Icon
						name="search"
						size={24}
						color={searchQuery.trim() ? "#007AFF" : "#999"}
					/>
				)}
			</TouchableOpacity>
		</View>
	);

	// Render search suggestions
	const renderSuggestions = () => {
		if (suggestions.length === 0) return null;

		return (
			<View style={styles.suggestionsContainer}>
				{suggestions.map((suggestion, index) => (
					<TouchableOpacity
						key={index}
						style={styles.suggestionItem}
						onPress={() => handleSuggestionTap(suggestion)}>
						<Icon
							name="search"
							size={16}
							color="#666"
						/>
						<Text style={styles.suggestionText}>{suggestion}</Text>
					</TouchableOpacity>
				))}
			</View>
		);
	};

	// Render search tabs
	const renderSearchTabs = () => {
		if (!hasSearched) return null;

		const tabs: Array<{ key: SearchType; label: string }> = [
			{ key: "all", label: "All" },
			{ key: "posts", label: "Posts" },
			{ key: "users", label: "Users" },
			{ key: "comments", label: "Comments" },
		];

		return (
			<View style={styles.tabsContainer}>
				{tabs.map(tab => (
					<TouchableOpacity
						key={tab.key}
						style={[styles.tabItem, activeTab === tab.key && styles.activeTabItem]}
						onPress={() => handleTabChange(tab.key)}>
						<Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
					</TouchableOpacity>
				))}
			</View>
		);
	};

	// Render user item
	const renderUserItem = ({ item }: { item: SearchUser }) => (
		<TouchableOpacity
			style={styles.userItem}
			onPress={() => navigation.navigate("Profile", { userId: item.uid })}>
			<Image
				source={{ uri: item.photoURL || "https://via.placeholder.com/50" }}
				style={styles.userAvatar}
			/>
			<View style={styles.userInfo}>
				<View style={styles.userNameContainer}>
					<Text style={styles.userName}>{item.name}</Text>
					{item.hasBlueCheck && (
						<Icon
							name="verified"
							size={16}
							color="#007AFF"
							style={styles.verifiedIcon}
						/>
					)}
				</View>
				<Text style={styles.userUsername}>@{item.username}</Text>
				{item.bio && (
					<Text
						style={styles.userBio}
						numberOfLines={2}>
						{item.bio}
					</Text>
				)}
				{item.stats && (
					<Text style={styles.userStats}>
						{item.stats.followers.toLocaleString()} followers • {item.stats.posts} posts
					</Text>
				)}
			</View>
		</TouchableOpacity>
	);

	// Render comment item
	const renderCommentItem = ({ item }: { item: SearchComment }) => (
		<TouchableOpacity
			style={styles.commentItem}
			onPress={() => navigation.navigate("PostDetail", { postId: item.postId })}>
			<Image
				source={{ uri: item.authorPhotoURL || "https://via.placeholder.com/40" }}
				style={styles.commentAvatar}
			/>
			<View style={styles.commentContent}>
				<View style={styles.commentHeader}>
					<Text style={styles.commentAuthor}>{item.authorName}</Text>
					<Text style={styles.commentUsername}>@{item.authorUsername}</Text>
					<Text style={styles.commentTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
				</View>
				<Text
					style={styles.commentText}
					numberOfLines={3}>
					{item.content}
				</Text>
				<Text style={styles.commentStats}>{item.likesCount} likes</Text>
			</View>
		</TouchableOpacity>
	);

	// Render post item (simplified version)
	const renderPostItem = ({ item }: { item: Post }) => (
		<TouchableOpacity
			style={styles.postItem}
			onPress={() => navigation.navigate("PostDetail", { postId: item.id })}>
			<Image
				source={{ uri: item.author.photoURL || "https://via.placeholder.com/40" }}
				style={styles.postAvatar}
			/>
			<View style={styles.postContent}>
				<View style={styles.postHeader}>
					<Text style={styles.postAuthor}>{item.author.name}</Text>
					<Text style={styles.postUsername}>@{item.author.username}</Text>
					<Text style={styles.postTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
				</View>
				<Text
					style={styles.postText}
					numberOfLines={4}>
					{item.content}
				</Text>
				<View style={styles.postStats}>
					<Text style={styles.postStat}>{item.likesCount} likes</Text>
					<Text style={styles.postStat}>{item.commentsCount} comments</Text>
					<Text style={styles.postStat}>{item.sharesCount} shares</Text>
				</View>
			</View>
		</TouchableOpacity>
	);

	// Render search results based on active tab
	const renderSearchResults = () => {
		if (isLoading && !searchResults.totalResults) {
			return (
				<View style={styles.loadingContainer}>
					<ActivityIndicator
						size="large"
						color="#007AFF"
					/>
					<Text style={styles.loadingText}>Searching...</Text>
				</View>
			);
		}

		if (error) {
			return (
				<View style={styles.errorContainer}>
					<Icon
						name="error-outline"
						size={48}
						color="#FF6B6B"
					/>
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={() => handleSearch()}>
						<Text style={styles.retryButtonText}>Try Again</Text>
					</TouchableOpacity>
				</View>
			);
		}

		if (hasSearched && searchResults.totalResults === 0) {
			return (
				<View style={styles.emptyContainer}>
					<Icon
						name="search-off"
						size={48}
						color="#999"
					/>
					<Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
					<Text style={styles.emptySubtext}>Try different keywords or check your spelling</Text>
				</View>
			);
		}

		// Render results based on active tab
		switch (activeTab) {
			case "users":
				return (
					<FlatList
						data={searchResults.users}
						renderItem={renderUserItem}
						keyExtractor={item => item.uid}
						style={styles.resultsList}
						showsVerticalScrollIndicator={false}
						onEndReached={handleLoadMore}
						onEndReachedThreshold={0.1}
						ListFooterComponent={() =>
							hasMore ? (
								<View style={styles.loadMoreContainer}>
									<ActivityIndicator
										size="small"
										color="#007AFF"
									/>
								</View>
							) : null
						}
					/>
				);

			case "comments":
				return (
					<FlatList
						data={searchResults.comments}
						renderItem={renderCommentItem}
						keyExtractor={item => item.id}
						style={styles.resultsList}
						showsVerticalScrollIndicator={false}
						onEndReached={handleLoadMore}
						onEndReachedThreshold={0.1}
						ListFooterComponent={() =>
							hasMore ? (
								<View style={styles.loadMoreContainer}>
									<ActivityIndicator
										size="small"
										color="#007AFF"
									/>
								</View>
							) : null
						}
					/>
				);

			case "posts":
				return (
					<FlatList
						data={searchResults.posts}
						renderItem={renderPostItem}
						keyExtractor={item => item.id}
						style={styles.resultsList}
						showsVerticalScrollIndicator={false}
						onEndReached={handleLoadMore}
						onEndReachedThreshold={0.1}
						ListFooterComponent={() =>
							hasMore ? (
								<View style={styles.loadMoreContainer}>
									<ActivityIndicator
										size="small"
										color="#007AFF"
									/>
								</View>
							) : null
						}
					/>
				);

			default: // "all"
				return (
					<ScrollView
						style={styles.allResultsContainer}
						showsVerticalScrollIndicator={false}
						refreshControl={
							<RefreshControl
								refreshing={isRefreshing}
								onRefresh={handleRefresh}
								tintColor="#007AFF"
							/>
						}>
						{searchResults.users.length > 0 && (
							<View style={styles.sectionContainer}>
								<Text style={styles.sectionTitle}>Users</Text>
								{searchResults.users.slice(0, 3).map(user => (
									<View key={user.uid}>{renderUserItem({ item: user })}</View>
								))}
								{searchResults.users.length > 3 && (
									<TouchableOpacity
										style={styles.seeAllButton}
										onPress={() => handleTabChange("users")}>
										<Text style={styles.seeAllText}>See all {searchResults.users.length} users</Text>
										<Icon
											name="chevron-right"
											size={20}
											color="#007AFF"
										/>
									</TouchableOpacity>
								)}
							</View>
						)}

						{searchResults.posts.length > 0 && (
							<View style={styles.sectionContainer}>
								<Text style={styles.sectionTitle}>Posts</Text>
								{searchResults.posts.slice(0, 3).map(post => (
									<View key={post.id}>{renderPostItem({ item: post })}</View>
								))}
								{searchResults.posts.length > 3 && (
									<TouchableOpacity
										style={styles.seeAllButton}
										onPress={() => handleTabChange("posts")}>
										<Text style={styles.seeAllText}>See all {searchResults.posts.length} posts</Text>
										<Icon
											name="chevron-right"
											size={20}
											color="#007AFF"
										/>
									</TouchableOpacity>
								)}
							</View>
						)}

						{searchResults.comments.length > 0 && (
							<View style={styles.sectionContainer}>
								<Text style={styles.sectionTitle}>Comments</Text>
								{searchResults.comments.slice(0, 3).map(comment => (
									<View key={comment.id}>{renderCommentItem({ item: comment })}</View>
								))}
								{searchResults.comments.length > 3 && (
									<TouchableOpacity
										style={styles.seeAllButton}
										onPress={() => handleTabChange("comments")}>
										<Text style={styles.seeAllText}>See all {searchResults.comments.length} comments</Text>
										<Icon
											name="chevron-right"
											size={20}
											color="#007AFF"
										/>
									</TouchableOpacity>
								)}
							</View>
						)}
					</ScrollView>
				);
		}
	};

	// Render trending searches when no search performed
	const renderTrendingSearches = () => {
		if (hasSearched || trendingSearches.length === 0) return null;

		return (
			<View style={styles.trendingContainer}>
				<Text style={styles.trendingTitle}>Trending Searches</Text>
				{trendingSearches.map((trend, index) => (
					<TouchableOpacity
						key={index}
						style={styles.trendingItem}
						onPress={() => handleSuggestionTap(trend)}>
						<Icon
							name="trending-up"
							size={20}
							color="#007AFF"
						/>
						<Text style={styles.trendingText}>{trend}</Text>
					</TouchableOpacity>
				))}
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			{renderSearchHeader()}

			{renderSuggestions()}

			{renderSearchTabs()}

			<View style={styles.contentContainer}>
				{renderSearchResults()}
				{renderTrendingSearches()}
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	searchHeader: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E1E8ED",
	},
	backButton: {
		padding: 8,
		marginRight: 8,
	},
	searchInputContainer: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F7F9FA",
		borderRadius: 20,
		paddingHorizontal: 16,
		height: 40,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		color: "#333",
		paddingVertical: 0,
	},
	clearButton: {
		padding: 4,
		marginLeft: 8,
	},
	searchButton: {
		padding: 8,
		marginLeft: 8,
	},
	suggestionsContainer: {
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E1E8ED",
		paddingVertical: 8,
	},
	suggestionItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	suggestionText: {
		fontSize: 16,
		color: "#333",
		marginLeft: 12,
	},
	tabsContainer: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#E1E8ED",
	},
	tabItem: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		marginRight: 8,
		borderBottomWidth: 2,
		borderBottomColor: "transparent",
	},
	activeTabItem: {
		borderBottomColor: "#007AFF",
	},
	tabText: {
		fontSize: 16,
		color: "#657786",
		fontWeight: "500",
	},
	activeTabText: {
		color: "#007AFF",
		fontWeight: "600",
	},
	contentContainer: {
		flex: 1,
	},
	resultsList: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 60,
	},
	loadingText: {
		fontSize: 16,
		color: "#657786",
		marginTop: 12,
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 40,
		paddingVertical: 60,
	},
	errorText: {
		fontSize: 16,
		color: "#FF6B6B",
		textAlign: "center",
		marginTop: 12,
		marginBottom: 20,
	},
	retryButton: {
		backgroundColor: "#007AFF",
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 6,
	},
	retryButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 40,
		paddingVertical: 60,
	},
	emptyText: {
		fontSize: 18,
		color: "#333",
		textAlign: "center",
		marginTop: 12,
		fontWeight: "500",
	},
	emptySubtext: {
		fontSize: 14,
		color: "#657786",
		textAlign: "center",
		marginTop: 8,
	},
	userItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F0F3F4",
	},
	userAvatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 12,
	},
	userInfo: {
		flex: 1,
	},
	userNameContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	userName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
	},
	verifiedIcon: {
		marginLeft: 4,
	},
	userUsername: {
		fontSize: 14,
		color: "#657786",
		marginTop: 2,
	},
	userBio: {
		fontSize: 14,
		color: "#333",
		marginTop: 4,
		lineHeight: 18,
	},
	userStats: {
		fontSize: 12,
		color: "#657786",
		marginTop: 4,
	},
	commentItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F0F3F4",
	},
	commentAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 12,
	},
	commentContent: {
		flex: 1,
	},
	commentHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 4,
	},
	commentAuthor: {
		fontSize: 14,
		fontWeight: "600",
		color: "#333",
		marginRight: 4,
	},
	commentUsername: {
		fontSize: 12,
		color: "#657786",
		marginRight: 8,
	},
	commentTime: {
		fontSize: 12,
		color: "#657786",
	},
	commentText: {
		fontSize: 14,
		color: "#333",
		lineHeight: 18,
	},
	commentStats: {
		fontSize: 12,
		color: "#657786",
		marginTop: 4,
	},
	postItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F0F3F4",
	},
	postAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 12,
	},
	postContent: {
		flex: 1,
	},
	postHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 4,
	},
	postAuthor: {
		fontSize: 14,
		fontWeight: "600",
		color: "#333",
		marginRight: 4,
	},
	postUsername: {
		fontSize: 12,
		color: "#657786",
		marginRight: 8,
	},
	postTime: {
		fontSize: 12,
		color: "#657786",
	},
	postText: {
		fontSize: 14,
		color: "#333",
		lineHeight: 18,
	},
	postStats: {
		flexDirection: "row",
		marginTop: 8,
	},
	postStat: {
		fontSize: 12,
		color: "#657786",
		marginRight: 16,
	},
	allResultsContainer: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	sectionContainer: {
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#F7F9FA",
	},
	seeAllButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: "#E1E8ED",
	},
	seeAllText: {
		fontSize: 14,
		color: "#007AFF",
		fontWeight: "500",
	},
	loadMoreContainer: {
		paddingVertical: 20,
		alignItems: "center",
	},
	trendingContainer: {
		padding: 16,
	},
	trendingTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		marginBottom: 16,
	},
	trendingItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F0F3F4",
	},
	trendingText: {
		fontSize: 16,
		color: "#333",
		marginLeft: 12,
	},
});

export default SearchPage;


/** @format */

import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, Alert } from "react-native";
import { FAB, Searchbar, Chip } from "react-native-paper";
import styles from "../css/styles";
import PostView from "../components/PostView";
import PostService, { PostFilters } from "../services/PostService";
import AuthService from "../services/AuthService";

interface Post {
  id: string;
  content?: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  isRepost: boolean;
  originalPost?: any;
  postType: "text" | "live_video" | "poll" | "repost";
  liveVideoUrl?: string;
  privacy: string;
  hashtags: string[];
  mentions: string[];
  moderationStatus: string;
  poll?: any;
  stats: {
    comments: number;
    likes: number;
    views: number;
    shares: number;
    reposts: number;
  };
  author: {
    uid: string;
    name: string;
    username: string;
    photoURL: string;
    hasBlueCheck: boolean;
    isFollowedByCurrentUser: boolean;
  };
  comments: any[];
  likes: any[];
}

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"home" | "following">("home");
  const [postType, setPostType] = useState<"all" | "text" | "live_video" | "poll">("all");

  const fetchPosts = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filters: PostFilters = {
        limit: 20,
        random: true,
      };

      // Add search filter
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      // Add post type filter
      if (postType !== "all") {
        filters.postType = postType as any;
      }

      let result;
      if (activeFilter === "following" && AuthService.isAuthenticated) {
        result = await PostService.getFollowingFeed(filters);
      } else {
        result = await PostService.getPosts(filters);
      }

      if (result.success && result.posts) {
        setPosts(result.posts);
        console.log("Posts loaded:", result.posts.length);
      } else {
        Alert.alert("Error", result.error || "Failed to load posts");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, activeFilter, postType]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    fetchPosts(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: "home" | "following") => {
    setActiveFilter(filter);
    setPosts([]); // Clear posts to show loading
  };

  const handlePostTypeFilter = (type: "all" | "text" | "live_video" | "poll") => {
    setPostType(type);
    setPosts([]); // Clear posts to show loading
  };

  const handleCreatePost = () => {
    if (!AuthService.isAuthenticated) {
      Alert.alert("Authentication Required", "Please log in to create a post");
      return;
    }
    // TODO: Navigate to create post screen
    console.log("Create post");
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostView post={item} />
  );

  const renderHeader = () => (
    <View style={styles.homeHeader}>

      {/* Feed Filter */}
      <View style={styles.filterContainer}>
        {AuthService.isAuthenticated && (
          <Chip
            selected={activeFilter === "following"}
            onPress={() => handleFilterChange("following")}
            style={[styles.filterChip, activeFilter === "following" && styles.filterChipActive]}
          >
            Following
          </Chip>
        )}
      </View>

      {/* Post Type Filter */}
      <View style={styles.filterContainer}>
        <Chip
          selected={postType === "all"}
          onPress={() => handlePostTypeFilter("all")}
          style={[styles.filterChip, postType === "all" && styles.filterChipActive]}
        >
          All
        </Chip>
        <Chip
          selected={postType === "text"}
          onPress={() => handlePostTypeFilter("text")}
          style={[styles.filterChip, postType === "text" && styles.filterChipActive]}
        >
          Text
        </Chip>
        <Chip
          selected={postType === "poll"}
          onPress={() => handlePostTypeFilter("poll")}
          style={[styles.filterChip, postType === "poll" && styles.filterChipActive]}
        >
          Polls
        </Chip>
        <Chip
          selected={postType === "live_video"}
          onPress={() => handlePostTypeFilter("live_video")}
          style={[styles.filterChip, postType === "live_video" && styles.filterChipActive]}
        >
          Live
        </Chip>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>
        {activeFilter === "following" ? "No posts from people you follow" : "No posts found"}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? "Try different search terms or filters" 
          : activeFilter === "following" 
            ? "Follow some users to see their posts here" 
            : "Check back later for new content"
        }
      </Text>
    </View>
  );

  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.home}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
      />
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreatePost}
      />
    </View>
  );
};

export default HomePage;

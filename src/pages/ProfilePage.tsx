
/** @format */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, FlatList, Alert } from "react-native";
import { Avatar, Button, Card, Chip, IconButton } from "react-native-paper";
import styles from "../css/styles";
import PostView from "../components/PostView";
import AuthService from "../services/AuthService";
import UserService from "../services/UserService";

const ProfilePage = ({ navigation, route }: any) => {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const userId = route?.params?.userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      if (userId && userId !== AuthService.user?.uid) {
        // Load other user's profile
        setIsOwnProfile(false);
        const result = await UserService.getUserProfile(userId);
        if (result.success) {
          setUser(result.user);
          setIsFollowing(result.user?.isFollowedByCurrentUser || false);
        }
      } else {
        // Load current user's profile
        setIsOwnProfile(true);
        const result = await AuthService.getCurrentUser();
        if (result.success) {
          setUser(result.user);
        }
      }

      // Load user's posts
      const postsResult = await UserService.getUserPosts(userId || AuthService.user?.uid);
      if (postsResult.success) {
        setPosts(postsResult.posts || []);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;

    try {
      const result = isFollowing
        ? await UserService.unfollowUser(user.uid)
        : await UserService.followUser(user.uid);

      if (result.success) {
        setIsFollowing(!isFollowing);
        setUser({
          ...user,
          stats: {
            ...user.stats,
            followers: isFollowing
              ? user.stats.followers - 1
              : user.stats.followers + 1,
          },
        });
      } else {
        Alert.alert("Error", result.error || "Action failed");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const renderPost = ({ item }: { item: any }) => <PostView post={item} />;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>Profile not found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={() => (
        <Card style={{ margin: 16, padding: 16 }}>
          {/* Cover Photo */}
          {user.coverPhotoURL && (
            <View style={{
              height: 150,
              backgroundColor: "#f0f0f0",
              borderRadius: 8,
              marginBottom: 16
            }} />
          )}

          {/* Profile Header */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 16 }}>
            <Avatar.Image
              size={80}
              source={{ uri: user.photoURL || "https://via.placeholder.com/80" }}
            />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Text style={styles.h2}>{user.name}</Text>
                {user.hasBlueCheck && (
                  <IconButton icon="check-decagram" size={20} iconColor="#1DA1F2" />
                )}
              </View>
              <Text style={styles.authorUsername}>@{user.username}</Text>
              {user.bio && <Text style={{ marginTop: 8 }}>{user.bio}</Text>}
            </View>

            {!isOwnProfile ? (
              <Button
                mode={isFollowing ? "outlined" : "contained"}
                onPress={handleFollow}
                compact
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={() => navigation.navigate("EditProfile")}
                compact
              >
                Edit Profile
              </Button>
            )}
          </View>

          {/* Stats */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.bold}>{user.stats?.posts || 0}</Text>
              <Text style={styles.statText}>Posts</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.bold}>{user.stats?.followers || 0}</Text>
              <Text style={styles.statText}>Followers</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.bold}>{user.stats?.followings || 0}</Text>
              <Text style={styles.statText}>Following</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.bold}>{user.stats?.likes || 0}</Text>
              <Text style={styles.statText}>Likes</Text>
            </View>
          </View>

          {/* Subscription Badge */}
          {user.membership?.subscription !== "free" && (
            <Chip
              icon="crown"
              style={{ alignSelf: "flex-start", marginBottom: 16 }}
            >
              {user.membership.subscription.toUpperCase()} Member
            </Chip>
          )}

          {/* Posts Header */}
          <Text style={[styles.h3, { marginTop: 16 }]}>
            {isOwnProfile ? "Your Posts" : `${user.name}'s Posts`}
          </Text>
        </Card>
      )}
      ListEmptyComponent={() => (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No posts yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            {isOwnProfile ? "Create your first post!" : "This user hasn't posted anything yet."}
          </Text>
        </View>
      )}
    />
  );
};

export default ProfilePage;

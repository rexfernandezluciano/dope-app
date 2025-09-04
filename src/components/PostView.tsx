import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { Avatar, IconButton, Chip, Card, Icon } from "react-native-paper";
import styles from "../css/styles";
import PostService from "../services/PostService";
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
  poll?: {
    id: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
      votes: number;
      percentage: number;
      isUserChoice: boolean;
    }>;
    totalVotes: number;
    hasUserVoted: boolean;
    isExpired: boolean;
  };
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
  likes: Array<{
    user: {
      uid: string;
      username: string;
    };
  }>;
}

interface PostViewProps {
  post: Post;
}

const PostView: React.FC<PostViewProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(
    post.likes.some((like) => like.user.uid === AuthService.user?.uid),
  );
  const [likeCount, setLikeCount] = useState(post.stats.likes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Track post view when component mounts
    PostService.trackPostView(post.id);
  }, [post.id]);

  const handleLike = async () => {
    if (!AuthService.isAuthenticated) {
      Alert.alert("Authentication Required", "Please log in to like posts");
      return;
    }

    if (loading) return;
    
    setLoading(true);
    const wasLiked = isLiked;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      const result = await PostService.likePost(post.id);
      if (!result.success) {
        // Revert on failure
        setIsLiked(wasLiked);
        setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
        Alert.alert("Error", result.error || "Failed to like post");
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked);
      setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleComment = () => {
    // Navigate to comment screen - you'll need to implement this based on your navigation
    console.log("Comment on post:", post.id);
    // Example: navigation.navigate("Comments", { postId: post.id });
  };

  const handleShare = async () => {
    try {
      const result = await PostService.sharePost(post.id);
      if (result.success) {
        Alert.alert("Success", "Post shared successfully!");
      } else {
        Alert.alert("Error", result.error || "Failed to share post");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const handleRepost = async () => {
    if (!AuthService.isAuthenticated) {
      Alert.alert("Authentication Required", "Please log in to repost");
      return;
    }

    Alert.alert(
      "Repost",
      "Do you want to add a comment to this repost?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Repost", 
          onPress: async () => {
            try {
              const result = await PostService.repostPost(post.id);
              if (result.success) {
                Alert.alert("Success", "Post reposted successfully!");
              } else {
                Alert.alert("Error", result.error || "Failed to repost");
              }
            } catch (error) {
              Alert.alert("Error", "An unexpected error occurred");
            }
          }
        },
        { 
          text: "Add Comment", 
          onPress: () => {
            // Navigate to repost with comment screen
            console.log("Repost with comment:", post.id);
          }
        },
      ]
    );
  };

  const handleVote = async (optionId: string) => {
    if (!AuthService.isAuthenticated) {
      Alert.alert("Authentication Required", "Please log in to vote");
      return;
    }

    if (post.poll?.hasUserVoted || post.poll?.isExpired) return;

    try {
      const result = await PostService.voteOnPoll(post.poll!.id, [optionId]);
      if (result.success) {
        Alert.alert("Success", "Vote submitted successfully!");
        // You might want to refresh the post data here
      } else {
        Alert.alert("Error", result.error || "Failed to vote");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const renderPoll = () => {
    if (!post.poll) return null;

    return (
      <View style={styles.pollContainer}>
        <Text style={styles.pollQuestion}>{post.poll.question}</Text>
        {post.poll.options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.pollOption,
              option.isUserChoice && styles.pollOptionSelected,
            ]}
            onPress={() => handleVote(option.id)}
            disabled={post.poll?.hasUserVoted || post.poll?.isExpired}
          >
            <View style={styles.pollOptionContent}>
              <Text style={styles.pollOptionText}>{option.text}</Text>
              <View style={styles.pollStats}>
                <Text style={styles.pollPercentage}>{option.percentage}%</Text>
                <Text style={styles.pollVotes}>{option.votes} votes</Text>
              </View>
            </View>
            <View
              style={[styles.pollBar, { width: `${option.percentage}%` }]}
            />
          </TouchableOpacity>
        ))}
        <Text style={styles.pollTotal}>
          Total votes: {post.poll.totalVotes}
          {post.poll.isExpired && " • Poll ended"}
        </Text>
      </View>
    );
  };

  const renderImages = () => {
    if (post.imageUrls.length === 0) return null;

    return (
      <ScrollView 
        horizontal 
        style={styles.imageContainer}
        contentContainerStyle={{ alignItems: 'center' }}
        showsHorizontalScrollIndicator={false}
      >
        {post.imageUrls.map((url, index) => (
          <Image
            key={index}
            source={{ uri: url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
    );
  };

  const renderOriginalPost = () => {
    if (!post.isRepost || !post.originalPost) return null;

    return (
      <Card style={styles.originalPostCard}>
        <Card.Content>
          <View style={styles.originalPostHeader}>
            <Avatar.Image
              size={24}
              source={{ uri: post.originalPost.author.photoURL }}
            />
            <View style={styles.originalPostAuthorContainer}>
              <Text style={styles.originalPostAuthor}>
                {post.originalPost.author.name}
              </Text>
              {post.originalPost.author.hasBlueCheck && (
                <Icon source="check-decagram" size={12} color="#1DA1F2" />
              )}
            </View>
            <Text style={styles.originalPostUsername}>
              @{post.originalPost.author.username}
            </Text>
          </View>
          {post.originalPost.content && (
            <Text style={styles.originalPostContent}>
              {post.originalPost.content}
            </Text>
          )}
          {post.originalPost.imageUrls.length > 0 && (
            <ScrollView 
              horizontal 
              style={styles.imageContainer}
              contentContainerStyle={{ alignItems: 'center' }}
              showsHorizontalScrollIndicator={false}
            >
              {post.originalPost.imageUrls.map((url: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={styles.originalPostImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderHashtags = () => {
    if (post.hashtags?.length === 0) return null;

    if (!Array.isArray(post.hashtags)) {
      return null;
    }

    return (
      <ScrollView 
        horizontal 
        style={styles.hashtagContainer}
        contentContainerStyle={{ alignItems: 'center' }}
        showsHorizontalScrollIndicator={false}
      >
        {post.hashtags.map((tag, index) => (
          <Chip
            key={index}
            style={styles.hashtag}
            textStyle={styles.hashtagText}
          >
            #{tag}
          </Chip>
        ))}
      </ScrollView>
    );
  };

  return (
    <Card style={styles.postCard}>
      <Card.Content>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Avatar.Image size={40} source={{ uri: post.author.photoURL }} />
          <View style={styles.postAuthorInfo}>
            <View style={styles.postAuthorName}>
              <View style={styles.authorNameContainer}>
                <Text style={styles.authorName}>{post.author.name}</Text>
                {post.author.hasBlueCheck && (
                  <Icon source="check-decagram" size={16} color="#1DA1F2" />
                )}
              </View>
              <Text style={styles.authorUsername}>@{post.author.username}</Text>
            </View>
            <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
          </View>
          <IconButton icon="dots-vertical" size={20} onPress={() => {}} />
        </View>

        {/* Repost indicator */}
        {post.isRepost && (
          <View style={styles.repostIndicator}>
            <IconButton icon="repeat" size={16} />
            <Text style={styles.repostText}>Reposted</Text>
          </View>
        )}

        {/* Post Content */}
        {post.content && <Text style={styles.postContent}>{post.content}</Text>}

        {/* Hashtags */}
        {renderHashtags()}

        {/* Images */}
        {renderImages()}

        {/* Live Video */}
        {post.postType === "live_video" && post.liveVideoUrl && (
          <View style={styles.liveVideoContainer}>
            <View style={styles.liveIndicatorContainer}>
              <Icon source="record-circle" size={16} color="#ff1744" />
              <Text style={styles.liveIndicator}>LIVE</Text>
            </View>
            <Text style={styles.liveVideoUrl}>{post.liveVideoUrl}</Text>
          </View>
        )}

        {/* Poll */}
        {post.postType === "poll" && renderPoll()}

        {/* Original Post (for reposts) */}
        {renderOriginalPost()}

        {/* Post Stats */}
        <View style={styles.postStats}>
          <Text style={styles.statText}>{post.stats.views} views</Text>
          <Text style={styles.statText}>{post.stats.comments} comments</Text>
          <Text style={styles.statText}>{likeCount} likes</Text>
          <Text style={styles.statText}>{post.stats.reposts} reposts</Text>
        </View>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
            <IconButton icon="comment-outline" size={20} />
            <Text style={styles.actionText}>{post.stats.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleRepost}>
            <IconButton icon="repeat" size={20} />
            <Text style={styles.actionText}>{post.stats.reposts}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isLiked && styles.actionButtonActive]}
            onPress={handleLike}
          >
            <IconButton
              icon={isLiked ? "heart" : "heart-outline"}
              size={20}
              iconColor={isLiked ? "#e91e63" : undefined}
            />
            <Text
              style={[styles.actionText, isLiked && styles.actionTextActive]}
            >
              {likeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <IconButton icon="share-outline" size={20} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
};

export default PostView;


import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { List, Avatar, IconButton, Chip, Card, Button } from "react-native-paper";
import styles from "../css/styles";

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
    post.likes.some(like => like.user.uid === "current_user_id") // Replace with actual current user ID
  );
  const [likeCount, setLikeCount] = useState(post.stats.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    // TODO: Call API endpoint POST /v1/posts/:postId/like
  };

  const handleComment = () => {
    // TODO: Navigate to comment screen or open comment modal
    console.log("Comment on post:", post.id);
  };

  const handleShare = () => {
    // TODO: Call API endpoint POST /v1/posts/share/:id
    console.log("Share post:", post.id);
  };

  const handleRepost = () => {
    // TODO: Call API endpoint POST /v1/posts/:id/repost
    console.log("Repost:", post.id);
  };

  const handleVote = (optionId: string) => {
    if (post.poll?.hasUserVoted) return;
    // TODO: Call API endpoint POST /v1/polls/:pollId/vote
    console.log("Vote on option:", optionId);
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
              option.isUserChoice && styles.pollOptionSelected
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
              style={[
                styles.pollBar,
                { width: `${option.percentage}%` }
              ]}
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
      <ScrollView horizontal style={styles.imageContainer}>
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
            <Text style={styles.originalPostAuthor}>
              {post.originalPost.author.name}
              {post.originalPost.author.hasBlueCheck && " ✓"}
            </Text>
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
            <ScrollView horizontal style={styles.imageContainer}>
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
    if (post.hashtags.length === 0) return null;

    return (
      <ScrollView horizontal style={styles.hashtagContainer}>
        {post.hashtags.map((tag, index) => (
          <Chip key={index} style={styles.hashtag} textStyle={styles.hashtagText}>
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
              <Text style={styles.authorName}>
                {post.author.name}
                {post.author.hasBlueCheck && (
                  <Text style={styles.blueCheck}> ✓</Text>
                )}
              </Text>
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
        {post.content && (
          <Text style={styles.postContent}>{post.content}</Text>
        )}

        {/* Hashtags */}
        {renderHashtags()}

        {/* Images */}
        {renderImages()}

        {/* Live Video */}
        {post.postType === "live_video" && post.liveVideoUrl && (
          <View style={styles.liveVideoContainer}>
            <Text style={styles.liveIndicator}>🔴 LIVE</Text>
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
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
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

/** @format */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  Card,
  Button,
  IconButton,
  Avatar,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import styles from '../css/styles';
import PostView from '../components/PostView';
import PostService from '../services/PostService';
import CommentService from '../services/CommentService';
import AuthService from '../services/AuthService';

// Types
interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    uid: string;
    name: string;
    username: string;
    photoURL?: string;
    hasBlueCheck?: boolean;
  };
  stats: {
    likes: number;
    replies: number;
  };
  likes?: Array<{
    user: {
      uid: string;
      username: string;
    };
  }>;
  replies?: Comment[];
  parentId?: string;
  depth: number;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    uid: string;
    name: string;
    username: string;
    photoURL?: string;
    hasBlueCheck?: boolean;
  };
  stats: {
    comments: number;
    likes: number;
    reposts: number;
    views?: number;
  };
  imageUrls?: string[];
  isRepost?: boolean;
  originalPost?: any;
  poll?: any;
  postType: string;
  privacy: string;
  likes?: Array<{
    user: {
      uid: string;
      username: string;
    };
  }>;
}

type PostDetailRouteProp = RouteProp<{ postDetails: { postId: string } }, 'postDetails'>;
type PostDetailNavigationProp = StackNavigationProp<any>;

const PostDetailPage: React.FC = () => {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<PostDetailNavigationProp>();
  const { postId } = route.params;

  // State
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Services
  const commentService = useMemo(() => new CommentService(), []);

  // Load post and comments
  const loadPostAndComments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Load post details
      const postResult = await PostService.getPostById(postId);
      if (postResult.success && postResult.data) {
        setPost(postResult.data);
      } else {
        Alert.alert('Error', postResult.error || 'Failed to load post');
        return;
      }

      // Load comments
      const commentsResult = await commentService.getComments(postId);
      if (commentsResult.success && commentsResult.data) {
        // Process comments into threaded structure
        const processedComments = processCommentsIntoThreads(commentsResult.data);
        setComments(processedComments);
      } else {
        console.warn('Failed to load comments:', commentsResult.error);
        setComments([]);
      }
    } catch (error) {
      console.error('Error loading post and comments:', error);
      Alert.alert('Error', 'Failed to load post details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, commentService]);

  // Process flat comments into threaded structure
  const processCommentsIntoThreads = useCallback((flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map of all comments
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [], depth: 0 });
    });

    // Second pass: organize into threads
    flatComments.forEach(comment => {
      const processedComment = commentMap.get(comment.id)!;

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          processedComment.depth = parent.depth + 1;
          parent.replies!.push(processedComment);
        }
      } else {
        rootComments.push(processedComment);
      }
    });

    // Sort by creation date (newest first for root, oldest first for replies)
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const sortReplies = (comments: Comment[]) => {
      comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      comments.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          sortReplies(comment.replies);
        }
      });
    };

    rootComments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        sortReplies(comment.replies);
      }
    });

    return rootComments;
  }, []);

  // Submit comment or reply
  const submitComment = useCallback(async () => {
    if (!commentText.trim()) return;
    if (!AuthService.isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to comment');
      return;
    }

    setSubmittingComment(true);
    try {
      const result = await commentService.createComment(postId, commentText.trim(), replyingTo);
      if (result.success) {
        setCommentText('');
        setReplyingTo(null);
        // Reload comments to show the new comment
        await loadPostAndComments(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  }, [commentText, postId, replyingTo, commentService, loadPostAndComments]);

  // Handle comment like
  const handleCommentLike = useCallback(async (commentId: string) => {
    if (!AuthService.isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to like comments');
      return;
    }

    try {
      const result = await commentService.toggleCommentLike(commentId);
      if (result.success) {
        // Update comment likes in state
        setComments(prevComments => {
          const updateCommentLikes = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                const currentUserId = AuthService.user?.uid;
                const isLiked = comment.likes?.some(like => like.user.uid === currentUserId);
                return {
                  ...comment,
                  stats: {
                    ...comment.stats,
                    likes: isLiked ? comment.stats.likes - 1 : comment.stats.likes + 1,
                  },
                  likes: isLiked
                    ? comment.likes?.filter(like => like.user.uid !== currentUserId)
                    : [...(comment.likes || []), { user: { uid: currentUserId!, username: AuthService.user?.username || '' } }]
                };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateCommentLikes(comment.replies),
                };
              }
              return comment;
            });
          };
          return updateCommentLikes(prevComments);
        });
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  }, [commentService]);

  // Handle reply button
  const handleReply = useCallback((commentId: string, authorUsername: string) => {
    setReplyingTo(commentId);
    setCommentText(`@${authorUsername} `);
  }, []);

  // Cancel reply
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
    setCommentText('');
  }, []);

  useEffect(() => {
    loadPostAndComments();
  }, [loadPostAndComments]);

  // Render individual comment
  const renderComment = useCallback((comment: Comment) => {
    const isLiked = comment.likes?.some(like => like.user.uid === AuthService.user?.uid);
    const maxDepth = 3; // Limit nesting depth for readability

    return (
      <View key={comment.id} style={[
        styles.commentContainer,
        { marginLeft: Math.min(comment.depth, maxDepth) * 20 }
      ]}>
        <View style={styles.commentHeader}>
          <Avatar.Image
            size={comment.depth === 0 ? 40 : 32}
            source={{ uri: comment.author.photoURL || 'https://via.placeholder.com/40' }}
          />
          <View style={styles.commentContent}>
            <View style={styles.commentAuthor}>
              <Text style={styles.commentAuthorName}>{comment.author.name}</Text>
              {comment.author.hasBlueCheck && (
                <Text style={styles.blueCheck}>✓</Text>
              )}
              <Text style={styles.commentUsername}>@{comment.author.username}</Text>
              <Text style={styles.commentDate}>
                {new Date(comment.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.commentText}>{comment.content}</Text>

            {/* Comment Actions */}
            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => handleReply(comment.id, comment.author.username)}
              >
                <Text style={styles.commentActionText}>Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.commentAction, isLiked && styles.commentActionLiked]}
                onPress={() => handleCommentLike(comment.id)}
              >
                <Text style={[styles.commentActionText, isLiked && styles.commentActionLikedText]}>
                  ♥ {comment.stats.likes}
                </Text>
              </TouchableOpacity>

              {AuthService.user?.uid === comment.author.uid && (
                <TouchableOpacity style={styles.commentAction}>
                  <Text style={[styles.commentActionText, styles.commentActionDanger]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => renderComment(reply))}
          </View>
        )}
      </View>
    );
  }, [handleReply, handleCommentLike]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DA1F2" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>Post not found</Text>
        <Text style={styles.emptyStateSubtitle}>This post may have been deleted or is not available</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.home}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPostAndComments(true)} />}
      >
        {/* Post Detail */}
        <PostView
          post={post}
          onComment={postId => navigation.navigate("postDetails" as never, { postId } as never)}
          onRepostWithComment={postId => navigation.navigate("createPost" as never, { repostId: postId } as never)}
          onNavigateToProfile={userId => navigation.navigate("profile" as never, { userId } as never)}
          onOpenBottomSheet={() => {}}
        />

        <Divider style={{ marginVertical: 16 }} />

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsSectionTitle}>
            Comments ({post.stats.comments})
          </Text>

          {/* Comment Input */}
          {AuthService.isAuthenticated && (
            <View style={styles.commentInputContainer}>
              {replyingTo && (
                <View style={styles.replyingToContainer}>
                  <Text style={styles.replyingToText}>Replying to comment</Text>
                  <Button mode="text" onPress={cancelReply}>Cancel</Button>
                </View>
              )}

              <View style={styles.commentInputRow}>
                <Avatar.Image
                  size={32}
                  source={{ uri: AuthService.user?.photoURL || 'https://via.placeholder.com/32' }}
                />
                <TextInput
                  style={styles.commentInput}
                  placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                />
                <Button
                  mode="contained"
                  onPress={submitComment}
                  disabled={!commentText.trim() || submittingComment}
                  loading={submittingComment}
                  compact
                >
                  {replyingTo ? 'Reply' : 'Comment'}
                </Button>
              </View>
            </View>
          )}

          {/* Comments List */}
          <View style={styles.commentsList}>
            {comments.length > 0 ? (
              comments.map(comment => renderComment(comment))
            ) : (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
                <Text style={styles.emptyCommentsSubtext}>Be the first to comment on this post</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PostDetailPage;
/** @format */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, StyleSheet, Dimensions } from "react-native";
import { Avatar, IconButton, Card, Icon } from "react-native-paper";
import BottomSheet from "@gorhom/bottom-sheet";

import PostService from "../services/PostService";
import AuthService from "../services/AuthService";
import { Post } from "../api/interface/post.interface";
import { formatDate, formatCount } from "../utils/format-utils";
import LinkPreview from "../components/LinkPreview";
import { ParsedText } from "./TextParser";

interface PostViewProps {
        post: Post;
        onComment?: (postId: string) => void;
        onRepostWithComment?: (postId: string) => void;
        onNavigateToProfile?: (userId: string) => void;
}

const PostView: React.FC<PostViewProps> = React.memo(
        ({ post, onComment, onRepostWithComment, onNavigateToProfile }) => {
                // Refs to prevent multiple API calls
                const viewTrackedRef = useRef(false);
                const abortControllerRef = useRef<AbortController | null>(null);
                const lastPostIdRef = useRef(post.id);

                // Refs for Bottom Sheet
                const bottomSheetRef = useRef<BottomSheet>(null);

                // Memoized values
                const currentUserId = useMemo(() => AuthService.user?.uid, []);
                const initialIsLiked = useMemo(() => post.likes?.some(like => like.user?.uid === currentUserId) || false, [post.likes, currentUserId]);

                // State
                const [isLiked, setIsLiked] = useState(initialIsLiked);
                const [likeCount, setLikeCount] = useState(post.stats?.likes || 0);
                const [loading, setLoading] = useState(false);
                const [repostLoading, setRepostLoading] = useState(false);
                const [shareLoading, setShareLoading] = useState(false);
                const [isMenuVisible, setIsMenuVisible] = useState(false);

                // Track view only once per post and only when post changes
                useEffect(() => {
                        if (lastPostIdRef.current !== post.id) {
                                viewTrackedRef.current = false;
                                lastPostIdRef.current = post.id;
                        }

                        if (!viewTrackedRef.current) {
                                viewTrackedRef.current = true;

                                const trackView = async () => {
                                        try {
                                                // Use AbortController to prevent multiple simultaneous calls
                                                if (abortControllerRef.current) {
                                                        abortControllerRef.current.abort();
                                                }
                                                abortControllerRef.current = new AbortController();

                                                await PostService.trackPostView(post.id, {
                                                        signal: abortControllerRef.current.signal,
                                                });
                                        } catch (error: any) {
                                                if (error.name !== "AbortError") {
                                                        console.warn("Failed to track post view:", error);
                                                }
                                        }
                                };

                                trackView();
                        }

                        return () => {
                                // Cleanup abort controller on unmount
                                if (abortControllerRef.current) {
                                        abortControllerRef.current.abort();
                                }
                        };
                }, [post.id]);

                // Update state only when post data actually changes
                useEffect(() => {
                        const newIsLiked = post.likes?.some(like => like.user?.uid === currentUserId) || false;
                        if (newIsLiked !== isLiked) {
                                setIsLiked(newIsLiked);
                        }
                        if ((post.stats?.likes || 0) !== likeCount) {
                                setLikeCount(post.stats?.likes || 0);
                        }
                }, [post.likes, post.stats?.likes, currentUserId, isLiked, likeCount]);

                // Memoized callbacks to prevent re-renders
                const showAuthAlert = useCallback(() => {
                        Alert.alert("Authentication Required", "Please log in to continue");
                }, []);

                const showErrorAlert = useCallback((message: string = "An unexpected error occurred") => {
                        Alert.alert("Error", message);
                }, []);

                const showSuccessAlert = useCallback((message: string) => {
                        Alert.alert("Success", message);
                }, []);

                const handleLike = useCallback(async () => {
                        if (!AuthService.isAuthenticated) {
                                showAuthAlert();
                                return;
                        }

                        if (loading) return;

                        setLoading(true);
                        const wasLiked = isLiked;
                        const previousCount = likeCount;

                        // Optimistic update
                        setIsLiked(!wasLiked);
                        setLikeCount(prev => (wasLiked ? prev - 1 : prev + 1));

                        try {
                                const result = await PostService.likePost(post.id);
                                if (!result.success) {
                                        // Revert on failure
                                        setIsLiked(wasLiked);
                                        setLikeCount(previousCount);
                                        showErrorAlert(result.error || "Failed to like post");
                                }
                        } catch (error) {
                                // Revert on error
                                setIsLiked(wasLiked);
                                setLikeCount(previousCount);
                                showErrorAlert();
                        } finally {
                                setLoading(false);
                        }
                }, [loading, isLiked, likeCount, post.id, showAuthAlert, showErrorAlert]);

                const handleComment = useCallback(() => {
                        if (onComment) {
                                onComment(post.id);
                        } else {
                                console.log("Comment on post:", post.id);
                        }
                }, [onComment, post.id]);

                const handleShare = useCallback(async () => {
                        if (shareLoading) return;

                        setShareLoading(true);
                        try {
                                const result = await PostService.sharePost(post.id);
                                if (result.success) {
                                        showSuccessAlert("Post shared successfully!");
                                } else {
                                        showErrorAlert(result.error || "Failed to share post");
                                }
                        } catch (error) {
                                showErrorAlert();
                        } finally {
                                setShareLoading(false);
                        }
                }, [shareLoading, post.id, showSuccessAlert, showErrorAlert]);

                const handleRepost = useCallback(async () => {
                        if (!AuthService.isAuthenticated) {
                                showAuthAlert();
                                return;
                        }

                        Alert.alert("Repost", "Do you want to add a comment to this repost?", [
                                { text: "Cancel", style: "cancel" },
                                {
                                        text: "Repost",
                                        onPress: async () => {
                                                if (repostLoading) return;

                                                setRepostLoading(true);
                                                try {
                                                        const result = await PostService.repostPost(post.id);
                                                        if (result.success) {
                                                                showSuccessAlert("Post reposted successfully!");
                                                        } else {
                                                                showErrorAlert(result.error || "Failed to repost");
                                                        }
                                                } catch (error) {
                                                        showErrorAlert();
                                                } finally {
                                                        setRepostLoading(false);
                                                }
                                        },
                                },
                                {
                                        text: "Add Comment",
                                        onPress: () => {
                                                if (onRepostWithComment) {
                                                        onRepostWithComment(post.id);
                                                } else {
                                                        console.log("Repost with comment:", post.id);
                                                }
                                        },
                                },
                        ]);
                }, [repostLoading, post.id, onRepostWithComment, showAuthAlert, showSuccessAlert, showErrorAlert]);

                const handleVote = useCallback(
                        async (optionId: string) => {
                                if (!AuthService.isAuthenticated) {
                                        showAuthAlert();
                                        return;
                                }

                                if (post.poll?.hasUserVoted || post.poll?.isExpired) return;

                                try {
                                        const result = await PostService.voteOnPoll(post.poll!.id, [optionId]);
                                        if (result.success) {
                                                showSuccessAlert("Vote submitted successfully!");
                                        } else {
                                                showErrorAlert(result.error || "Failed to vote");
                                        }
                                } catch (error) {
                                        showErrorAlert();
                                }
                        },
                        [post.poll, showAuthAlert, showSuccessAlert, showErrorAlert],
                );

                const handleAuthorPress = useCallback(() => {
                        if (onNavigateToProfile) {
                                onNavigateToProfile(post.author?.uid);
                        }
                }, [onNavigateToProfile, post.author?.uid]);

                const openMenu = useCallback(() => setIsMenuVisible(true), []);
                const closeMenu = useCallback(() => setIsMenuVisible(false), []);

                const handleCopyLink = useCallback(async () => {
                        try {
                                // Use share functionality for mobile, construct URL for web
                                const postUrl = `https://dopp.eu.org/post/${post.id}`;
                                
                                // Use the PostService share endpoint
                                const result = await PostService.sharePost(post.id);
                                if (result.success) {
                                        showSuccessAlert("Post shared successfully!");
                                } else {
                                        showErrorAlert(result.error || "Failed to share post");
                                }
                        } catch (error) {
                                console.error("Failed to share post:", error);
                                showErrorAlert("Failed to share post");
                        } finally {
                                bottomSheetRef.current?.close();
                        }
                }, [post.id, post.author?.name, post.content, showSuccessAlert, showErrorAlert]);

                const handleDeletePost = useCallback(() => {
                        Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
                                { text: "Cancel", style: "cancel", onPress: closeMenu },
                                {
                                        text: "Delete",
                                        style: "destructive",
                                        onPress: async () => {
                                                try {
                                                        await PostService.deletePost(post.id);
                                                        showSuccessAlert("Post deleted successfully!");
                                                        closeMenu();
                                                } catch (error) {
                                                        showErrorAlert("Failed to delete post");
                                                        closeMenu();
                                                }
                                        },
                                },
                        ]);
                }, [post.id, closeMenu, showSuccessAlert, showErrorAlert]);

                const handleReportPost = useCallback(() => {
                        Alert.alert(
                                "Report Post",
                                "Why are you reporting this post?",
                                [
                                        { text: "Cancel", style: "cancel", onPress: () => bottomSheetRef.current?.close() },
                                        {
                                                text: "Spam",
                                                onPress: () => submitReport("spam", "This post contains spam content"),
                                        },
                                        {
                                                text: "Harassment",
                                                onPress: () => submitReport("harassment", "This post contains harassment"),
                                        },
                                        {
                                                text: "Inappropriate Content",
                                                onPress: () => submitReport("inappropriate", "This post contains inappropriate content"),
                                        },
                                        {
                                                text: "Misinformation",
                                                onPress: () => submitReport("misinformation", "This post contains false information"),
                                        },
                                ]
                        );
                }, []);

                const submitReport = useCallback(async (reason: string, description: string) => {
                        try {
                                const result = await PostService.reportPost(post.id, reason, description);
                                if (result.success) {
                                        showSuccessAlert("Report submitted successfully. Thank you for helping keep our community safe.");
                                } else {
                                        showErrorAlert(result.error || "Failed to submit report");
                                }
                        } catch (error) {
                                console.error("Failed to report post:", error);
                                showErrorAlert("Failed to submit report");
                        } finally {
                                bottomSheetRef.current?.close();
                        }
                }, [post.id, showSuccessAlert, showErrorAlert]);

                // Function to open the bottom sheet menu
                const handleOpenBottomSheet = () => {
                        bottomSheetRef.current?.snapToIndex(0);
                };

                // Memoized render functions to prevent unnecessary re-renders
                const renderLinkPreview = useMemo(() => {
                        return <LinkPreview text={post.isRepost ? post.originalPost?.content || "" : post.content || ""} />;
                }, [post.isRepost, post.originalPost?.content, post?.content]);

                const renderPoll = useMemo(() => {
                        if (!post.poll) return null;

                        return (
                                <View style={styles.pollContainer}>
                                        {post.poll.options?.map(option => (
                                                <TouchableOpacity
                                                        key={option.id}
                                                        style={[styles.pollOption, option.isUserChoice && styles.pollOptionSelected]}
                                                        onPress={() => handleVote(option.id)}
                                                        disabled={post.poll?.hasUserVoted}
                                                        accessibilityLabel={`Poll option: ${option.text}, ${option.percentage}% with ${option.votes} votes`}>
                                                        <View style={styles.pollOptionContent}>
                                                                <Text style={styles.pollOptionText}>{option.text}</Text>
                                                                <View style={styles.pollStats}>
                                                                        <Text style={styles.pollPercentage}>{option.percentage}%</Text>
                                                                        <Text style={styles.pollVotes}>{option.votes} votes</Text>
                                                                </View>
                                                        </View>
                                                        <View style={[styles.pollBar, { width: `${option.percentage}%` }]} />
                                                </TouchableOpacity>
                                        )) || []}
                                        <View style={styles.pollFooter}>
                                                <Text style={styles.pollFooterText}>Total votes: {post.poll.totalVotes}</Text>
                                        </View>
                                </View>
                        );
                }, [post.poll, handleVote]);

                const renderImages = useMemo(() => {
                        if (!post.imageUrls?.length) return null;

                        return (
                                <ScrollView
                                        horizontal
                                        style={styles.imageContainer}
                                        contentContainerStyle={styles.imageContentContainer}
                                        showsHorizontalScrollIndicator={false}>
                                        {post.imageUrls.map((url, index) => (
                                                <Image
                                                        key={`${post.id}-image-${index}`}
                                                        source={{ uri: url }}
                                                        style={styles.postImage}
                                                        resizeMode="cover"
                                                        accessibilityLabel={`Post image ${index + 1} of ${post.imageUrls.length}`}
                                                />
                                        ))}
                                </ScrollView>
                        );
                }, [post.imageUrls, post.id]);

                const renderOriginalPost = useMemo(() => {
                        if (!post.isRepost || !post.originalPost) return null;

                        return (
                                <Card
                                        style={styles.originalPostCard}
                                        mode="outlined">
                                        <Card.Content>
                                                <View style={styles.originalPostHeader}>
                                                        <Avatar.Image
                                                                size={24}
                                                                source={{ uri: post.originalPost.author?.photoURL }}
                                                        />
                                                        <View style={styles.originalPostAuthorContainer}>
                                                                <Text style={styles.originalPostAuthor}>{post.originalPost.author?.name}</Text>
                                                                {post.originalPost.author?.hasBlueCheck && (
                                                                        <Icon
                                                                                source="check-decagram"
                                                                                size={12}
                                                                                color="#0069b5"
                                                                        />
                                                                )}
                                                        </View>
                                                        <Text style={styles.originalPostUsername}>• {formatDate(post.originalPost.createdAt)}</Text>
                                                </View>

                                                {post.originalPost.content && <ParsedText style={styles.originalPostContent}>{post.originalPost.content}</ParsedText>}

                                                {post.originalPost.imageUrls?.length && post.originalPost.imageUrls.length > 0 && (
                                                        <ScrollView
                                                                horizontal
                                                                style={styles.imageContainer}
                                                                contentContainerStyle={styles.imageContentContainer}
                                                                showsHorizontalScrollIndicator={false}>
                                                                {post.originalPost.imageUrls.map((url: string, index: number) => (
                                                                        <Image
                                                                                key={`${post.originalPost!.id}-image-${index}`}
                                                                                source={{ uri: url }}
                                                                                style={styles.originalPostImage}
                                                                                resizeMode="cover"
                                                                                accessibilityLabel={`Original post image ${index + 1}`}
                                                                        />
                                                                ))}
                                                        </ScrollView>
                                                )}
                                                {renderLinkPreview}
                                        </Card.Content>
                                </Card>
                        );
                }, [post.isRepost, post.originalPost, renderLinkPreview]);

                const renderLiveVideo = useMemo(() => {
                        if (post.postType !== "live_video" || !post.liveVideoUrl) return null;

                        return (
                                <View style={styles.liveVideoContainer}>
                                        <View style={styles.liveIndicatorContainer}>
                                                <Icon
                                                        source="record-circle"
                                                        size={16}
                                                        color="#ff1744"
                                                />
                                                <Text style={styles.liveIndicator}>LIVE</Text>
                                        </View>
                                        <Text style={styles.liveVideoUrl}>{post.liveVideoUrl}</Text>
                                </View>
                        );
                }, [post.postType, post.liveVideoUrl]);

                // Memoized stats rendering to prevent recalculation
                const hasStats = useMemo(
                        () => (post.stats?.views || 0) > 0 || (post.stats?.reposts || 0) > 0 || (post.likes?.length || 0) > 0,
                        [post.stats?.views, post.stats?.reposts, post.likes?.length],
                );

                const renderPostStats = useMemo(() => {
                        if (!hasStats) return null;

                        return (
                                <View style={styles.postStats}>
                                        <View style={styles.reactions}>
                                                {(post.likes || []).slice(0, 3).map(l => {
                                                        return l.user?.photoURL ? (
                                                                <Avatar.Image
                                                                        key={l.user.uid}
                                                                        source={{ uri: l.user.photoURL }}
                                                                        size={16}
                                                                        style={styles.reactionAvatar}
                                                                />
                                                        ) : (
                                                                <Avatar.Text
                                                                        key={l.user?.uid || Math.random()}
                                                                        label={l.user?.username?.[0] || "?"}
                                                                        size={16}
                                                                        color="#eeeeee"
                                                                        style={styles.reactionAvatar}
                                                                />
                                                        );
                                                })}
                                                {(post.likes?.length || 0) > 3 && <Text style={styles.reactionCount}>+{formatCount((post.likes?.length || 0) - 3)}</Text>}
                                        </View>
                                        <View style={styles.stats}>
                                                {(post.stats?.views || 0) > 0 && <Text style={styles.statText}>{formatCount(post.stats.views)} views</Text>}
                                                {(post.stats?.reposts || 0) > 0 && <Text style={styles.statText}>{formatCount(post.stats.reposts)} reposts</Text>}
                                        </View>
                                </View>
                        );
                }, [hasStats, post.likes, post.stats?.views, post.stats?.reposts]);

                return (
                        <Card
                                elevation={0}
                                style={styles.postCard}>
                                <Card.Content style={styles.postContainer}>
                                        {/* Left column: Avatar */}
                                        <TouchableOpacity onPress={handleAuthorPress}>
                                                <Avatar.Image
                                                        size={48}
                                                        source={{ uri: post.author?.photoURL }}
                                                />
                                        </TouchableOpacity>

                                        {/* Right column: Post body */}
                                        <View style={styles.postBody}>
                                                {/* Header row */}
                                                <View style={styles.headerRow}>
                                                        <Text style={styles.authorName}>{post.author?.name}</Text>
                                                        {post.author?.hasBlueCheck && (
                                                                <Icon
                                                                        source="check-decagram"
                                                                        size={16}
                                                                        color="#1DA1F2"
                                                                        style={{ marginRight: 4 }}
                                                                />
                                                        )}
                                                        <Text style={styles.dot}>·</Text>
                                                        <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>

                                                        {/* Horizontal dots menu */}
                                                        <View style={styles.postHeaderMenu}>
                                                                <IconButton
                                                                        icon="dots-horizontal"
                                                                        iconColor="#657786"
                                                                        size={20}
                                                                        onPress={handleOpenBottomSheet}
                                                                        style={styles.menuButton}
                                                                />
                                                        </View>
                                                </View>

                                                {/* Post text */}
                                                {post.content && <ParsedText style={styles.postContent}>{post.content}</ParsedText>}

                                                {/* Media / Link Preview */}
                                                {renderImages}
                                                {renderLiveVideo}
                                                {post.postType === "poll" && renderPoll}
                                                {renderOriginalPost}
                                                {!post.isRepost && renderLinkPreview}

                                                {/* Stats */}
                                                {renderPostStats}

                                                {/* Post Actions */}
                                                <View style={styles.postActions}>
                                                        <TouchableOpacity
                                                                style={styles.actionButton}
                                                                onPress={handleComment}
                                                                accessibilityLabel={`Comment on post. ${post.stats?.comments || 0} comments`}>
                                                                <Icon
                                                                        source="chat-outline"
                                                                        size={18}
                                                                        color="#657786"
                                                                />
                                                                {(post.stats?.comments || 0) > 0 && <Text style={styles.actionText}>{formatCount(post.stats.comments)}</Text>}
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                                style={[styles.actionButton, repostLoading && styles.actionButtonDisabled]}
                                                                onPress={handleRepost}
                                                                disabled={repostLoading}
                                                                accessibilityLabel={`Repost. ${post.stats?.reposts || 0} reposts`}>
                                                                <Icon
                                                                        source="repeat"
                                                                        size={18}
                                                                        color="#657786"
                                                                />
                                                                {(post.stats?.reposts || 0) > 0 && <Text style={styles.actionText}>{formatCount(post.stats.reposts)}</Text>}
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                                style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                                                                onPress={handleLike}
                                                                disabled={loading}
                                                                accessibilityLabel={`${isLiked ? "Unlike" : "Like"} post. ${likeCount} likes`}>
                                                                <Icon
                                                                        source={isLiked ? "heart" : "heart-outline"}
                                                                        size={18}
                                                                        color={isLiked ? "#e91e63" : "#657786"}
                                                                />
                                                                {likeCount > 0 && <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>{formatCount(likeCount)}</Text>}
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                                style={[styles.actionButton, shareLoading && styles.actionButtonDisabled]}
                                                                onPress={handleShare}
                                                                disabled={shareLoading}
                                                                accessibilityLabel="Share post">
                                                                <Icon
                                                                        source="share-outline"
                                                                        size={18}
                                                                        color="#657786"
                                                                />
                                                        </TouchableOpacity>
                                                </View>
                                        </View>

                                        {/* Bottom Sheet Menu */}
                                        <BottomSheet
                                                ref={bottomSheetRef}
                                                index={-1}
                                                snapPoints={["35%"]}
                                                enablePanDownToClose={true}
                                                backgroundStyle={styles.bottomSheet}
                                                handleIndicatorStyle={styles.bottomSheetHandle}
                                                backdropComponent={({ style }) => <View style={[styles.bottomSheetOverlay, style]} />}
                                        >
                                                <View style={styles.bottomSheetContainer}>
                                                        <TouchableOpacity style={styles.bottomSheetOption} onPress={handleCopyLink}>
                                                                <Icon source="link" size={20} color="#657786" />
                                                                <Text style={styles.bottomSheetOptionText}>Copy Link</Text>
                                                        </TouchableOpacity>
                                                        {AuthService.user?.uid === post.author?.uid && (
                                                                <TouchableOpacity style={styles.bottomSheetOption} onPress={handleDeletePost}>
                                                                        <Icon source="delete-outline" size={20} color={styles.destructiveText.color} />
                                                                        <Text style={[styles.bottomSheetOptionText, styles.destructiveText]}>Delete Post</Text>
                                                                </TouchableOpacity>
                                                        )}
                                                        <TouchableOpacity style={styles.bottomSheetOption} onPress={handleReportPost}>
                                                                <Icon source="flag-outline" size={20} color="#657786" />
                                                                <Text style={styles.bottomSheetOptionText}>Report Post</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity style={styles.bottomSheetCancelOption} onPress={() => bottomSheetRef.current?.close()}>
                                                                <Text style={styles.bottomSheetCancelText}>Cancel</Text>
                                                        </TouchableOpacity>
                                                </View>
                                        </BottomSheet>
                                </Card.Content>
                        </Card>
                );
        },
        (prevProps, nextProps) => {
                // Custom comparison function for React.memo
                return (
                        prevProps.post.id === nextProps.post.id &&
                        (prevProps.post.stats?.likes || 0) === (nextProps.post.stats?.likes || 0) &&
                        (prevProps.post.stats?.comments || 0) === (nextProps.post.stats?.comments || 0) &&
                        (prevProps.post.stats?.reposts || 0) === (nextProps.post.stats?.reposts || 0) &&
                        (prevProps.post.stats?.views || 0) === (nextProps.post.stats?.views || 0) &&
                        (prevProps.post.likes?.length || 0) === (nextProps.post.likes?.length || 0) &&
                        prevProps.onComment === nextProps.onComment &&
                        prevProps.onRepostWithComment === nextProps.onRepostWithComment &&
                        prevProps.onNavigateToProfile === nextProps.onNavigateToProfile
                );
        },
);

const styles = StyleSheet.create({
        postCard: {
                borderRadius: 0,
                elevation: 0,
                borderBottomWidth: 1,
                borderBottomColor: "#eeeeee",
                backgroundColor: "#ffffff",
                shadowRadius: 0,
                shadowColor: "transparent",
        },
        postHeader: {
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 12,
        },
        authorSection: {
                flexDirection: "row",
                alignItems: "flex-start",
                flex: 1,
        },
        postAuthorInfo: {
                flex: 1,
        },
        authorInfoRow: {
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginBottom: 2,
        },
        menuButton: {
                padding: 4,
                borderRadius: 20,
                marginLeft: 8,
        },
        postHeaderMenu: {
                flex: 1,
                alignItems: "flex-end",
        },
        hashtagContainer: {
                marginBottom: 12,
        },
        hashtagContentContainer: {
                alignItems: "center",
        },
        hashtag: {
                marginRight: 8,
                backgroundColor: "#e1f5fe",
                height: 28,
        },
        hashtagText: {
                fontSize: 12,
                color: "#0277bd",
        },
        imageContainer: {
                marginBottom: 12,
        },
        imageContentContainer: {
                alignItems: "center",
        },
        postImage: {
                width: 280,
                height: 200,
                borderRadius: 12,
                marginRight: 8,
        },
        originalPostImage: {
                width: 150,
                height: 100,
                borderRadius: 8,
                marginRight: 4,
        },
        liveVideoContainer: {
                backgroundColor: "#ff1744",
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
        },
        liveIndicatorContainer: {
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
        },
        liveIndicator: {
                color: "white",
                fontWeight: "bold",
                fontSize: 12,
                marginLeft: 4,
        },
        liveVideoUrl: {
                color: "white",
                fontSize: 12,
                fontFamily: "monospace",
        },
        pollContainer: {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "#0069b5",
                padding: 16,
                borderRadius: 8,
                marginBottom: 12,
        },
        pollOption: {
                backgroundColor: "transparent",
                borderRadius: 8,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#e1e8ed",
                overflow: "hidden",
                position: "relative",
        },
        pollOptionSelected: {
                borderColor: "#0069b5",
                borderWidth: 2,
        },
        pollOptionContent: {
                padding: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 1,
        },
        pollOptionText: {
                fontSize: 14,
                color: "#1a1a1a",
                flex: 1,
        },
        pollStats: {
                alignItems: "flex-end",
        },
        pollPercentage: {
                fontSize: 14,
                fontWeight: "600",
                color: "#1a1a1a",
        },
        pollVotes: {
                fontSize: 12,
                color: "#657786",
        },
        pollBar: {
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                backgroundColor: "#e8f4f8",
                opacity: 0.5,
        },
        pollFooter: {
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 8,
        },
        pollFooterText: {
                fontSize: 12,
                color: "#657786",
        },
        originalPostCard: {
                marginBottom: 12,
                backgroundColor: "#ffffff",
                borderColor: "#eeeeee",
                borderRadius: 3,
                elevation: 0,
        },
        originalPostHeader: {
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
        },
        originalPostAuthorContainer: {
                flexDirection: "row",
                alignItems: "center",
                marginLeft: 8,
        },
        originalPostAuthor: {
                fontSize: 14,
                fontWeight: "600",
                color: "#1a1a1a",
                marginRight: 4,
        },
        originalPostUsername: {
                fontSize: 12,
                color: "#657786",
                marginLeft: 4,
        },
        originalPostContent: {
                fontSize: 14,
                lineHeight: 20,
                color: "#1a1a1a",
                marginBottom: 8,
        },
        postStats: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: "#e1e8ed",
                marginTop: 8,
                marginBottom: 4,
        },
        reactions: {
                flexDirection: "row",
                alignItems: "center",
        },
        reactionAvatar: {
                marginRight: -4,
                borderWidth: 1,
                borderColor: "white",
        },
        reactionCount: {
                fontSize: 12,
                color: "#657786",
                marginLeft: 8,
        },
        stats: {
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
        },
        statText: {
                fontSize: 12,
                color: "#657786",
        },
        postActions: {
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 4,
                paddingHorizontal: 8,
        },
        actionButton: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 20,
                minWidth: 64,
                gap: 6,
        },
        actionButtonDisabled: {
                opacity: 0.6,
        },
        actionText: {
                fontSize: 13,
                color: "#657786",
                fontWeight: "500",
        },
        actionTextActive: {
                color: "#e91e63",
        },
        linkPreview: {
                borderWidth: 1,
                borderColor: "#eeeeee",
                borderRadius: 3,
                backgroundColor: "transparent",
        },
        postContainer: {
                flexDirection: "row",
                alignItems: "flex-start",
                paddingVertical: 12,
                paddingHorizontal: 16,
        },
        postBody: {
                flex: 1,
                marginLeft: 12,
        },
        headerRow: {
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
        },
        authorName: {
                fontSize: 15,
                fontWeight: "700",
                color: "#0F1419",
                marginRight: 4,
        },
        dot: {
                color: "#536471",
                marginHorizontal: 2,
        },
        postDate: {
                fontSize: 12,
                color: "#536471",
        },
        postContent: {
                fontSize: 15,
                lineHeight: 20,
                color: "#0F1419",
                marginTop: 2,
                marginBottom: 8,
        },
        // Bottom Sheet Styles
        bottomSheetOverlay: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "transparent",
                pointerEvents: "none",
        },
        bottomSheetContainer: {
                justifyContent: "flex-end",
        },
        bottomSheet: {
                backgroundColor: "#ffffff",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 20,
                maxHeight: Dimensions.get("window").height * 0.6,
        },
        bottomSheetHandle: {
                width: 40,
                height: 4,
                backgroundColor: "#e1e8ed",
                borderRadius: 2,
                alignSelf: "center",
                marginTop: 12,
                marginBottom: 20,
        },
        bottomSheetOption: {
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderBottomWidth: 1,
                borderBottomColor: "#f7f9fa",
        },
        bottomSheetOptionText: {
                fontSize: 16,
                color: "#0f1419",
                fontWeight: "500",
                marginLeft: 16,
        },
        destructiveText: {
                color: "#e91e63",
        },
        bottomSheetCancelOption: {
                paddingVertical: 16,
                paddingHorizontal: 24,
                alignItems: "center",
                marginTop: 8,
        },
        bottomSheetCancelText: {
                fontSize: 16,
                color: "#657786",
                fontWeight: "600",
        },
});

PostView.displayName = "PostView";

export default PostView;
/** @format */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, StyleSheet } from "react-native";
import { Avatar, IconButton, Chip, Card, Icon, Menu } from "react-native-paper";

import PostService from "../services/PostService";
import AuthService from "../services/AuthService";
import { Post } from "../api/interface/post.interface";
import { formatDate, formatCount } from "../utils/format.utils";
import { LinkPreview } from "../components/LinkPreview";
import { ParsedText } from "./TextParser";

interface PostViewProps {
	post: Post;
	onComment?: (postId: string) => void;
	onRepostWithComment?: (postId: string) => void;
	onNavigateToProfile?: (userId: string) => void;
}

const PostView: React.FC<PostViewProps> = ({ post, onComment, onRepostWithComment, onNavigateToProfile }) => {
	// Memoize initial values to prevent unnecessary re-renders
	const initialIsLiked = useMemo(() => post.likes.some(like => like.user.uid === AuthService.user?.uid), [post.likes]);

	const [isLiked, setIsLiked] = useState(initialIsLiked);
	const [likeCount, setLikeCount] = useState(post.stats.likes);
	const [loading, setLoading] = useState(false);
	const [repostLoading, setRepostLoading] = useState(false);
	const [shareLoading, setShareLoading] = useState(false);

	useEffect(() => {
		// Track post view when component mounts
		const trackView = async () => {
			try {
				await PostService.trackPostView(post.id);
			} catch (error) {
				// Silent fail for analytics
				console.warn("Failed to track post view:", error);
			}
		};

		trackView();
	}, [post.id]);

	// Update like state if post prop changes
	useEffect(() => {
		setIsLiked(initialIsLiked);
		setLikeCount(post.stats.likes);
	}, [initialIsLiked, post.stats.likes]);

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
		setIsLiked(!isLiked);
		setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));

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
	}, [isLiked, likeCount, loading, showAuthAlert, showErrorAlert, post.id]);

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
	}, [shareLoading, showErrorAlert, showSuccessAlert, post.id]);

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
	}, [showAuthAlert, showErrorAlert, showSuccessAlert, onRepostWithComment, repostLoading, post.id]);

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
		[showAuthAlert, showErrorAlert, showSuccessAlert, post.poll],
	);

	const handleAuthorPress = useCallback(() => {
		if (onNavigateToProfile) {
			onNavigateToProfile(post.author.uid);
		}
	}, [onNavigateToProfile, post.author.uid]);

	const handleMenuPress = useCallback(() => {
		Alert.alert("Post Options", "What would you like to do?", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Copy Link", onPress: () => console.log("Copy link") },
			{ text: "Report Post", style: "destructive", onPress: () => console.log("Report post") },
		]);
	}, []);

	const renderLinkPreview = useCallback(() => {
		return <LinkPreview text={post.isRepost ? post.originalPost.content : post.content} />;
	}, []);

	const renderPoll = useCallback(() => {
		if (!post.poll) return null;

		return (
			<View style={styles.pollContainer}>
				{post.poll.options.map(option => (
					<TouchableOpacity
						key={option.id}
						style={[styles.pollOption, option.isUserChoice && styles.pollOptionSelected]}
						onPress={() => handleVote(option.id)}
						disabled={post.poll?.hasUserVoted || post.poll?.isExpired}
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
				))}
				<View style={styles.pollFooter}>
					<Text style={styles.pollFooterText}>Total votes: {post.poll.totalVotes}</Text>
					{post.poll?.isExpired && <Text style={styles.pollFooterText}>Poll ended</Text>}
				</View>
			</View>
		);
	}, [post.poll, handleVote]);

	const renderImages = useCallback(() => {
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

	const renderOriginalPost = useCallback(() => {
		if (!post.isRepost || !post.originalPost) return null;

		return (
			<Card
				style={styles.originalPostCard}
				mode="outlined">
				<Card.Content>
					<View style={styles.originalPostHeader}>
						<Avatar.Image
							size={24}
							source={{ uri: post.originalPost.author.photoURL }}
						/>
						<View style={styles.originalPostAuthorContainer}>
							<Text style={styles.originalPostAuthor}>{post.originalPost.author.name}</Text>
							{post.originalPost.author.hasBlueCheck && (
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

					{post.originalPost.imageUrls?.length > 0 && (
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
					{renderLinkPreview()}
				</Card.Content>
			</Card>
		);
	}, [post.isRepost, post.originalPost]);

	const renderLiveVideo = useCallback(() => {
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

	return (
		<Card
			elevation={0}
			style={styles.postCard}>
			<Card.Content>
				{/* Post Header */}
				<View style={styles.postHeader}>
					<TouchableOpacity
						onPress={handleAuthorPress}
						style={styles.authorSection}>
						<Avatar.Image
							size={40}
							source={{ uri: post.author.photoURL }}
						/>
						<View style={styles.postAuthorInfo}>
							<View style={styles.authorInfoRow}>
								<Text style={styles.authorName}>{post.author.name}</Text>
								{post.author.hasBlueCheck && (
									<Icon
										source="check-decagram"
										size={16}
										color="#0069b5"
									/>
								)}
							</View>
							<Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.menuButton}
						onPress={handleMenuPress}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
						<Icon
							source="dots-horizontal"
							size={20}
							color="#657786"
						/>
					</TouchableOpacity>
				</View>

				{/* Post Content */}
				{post.content && (
					<ParsedText
						style={styles.postContent}
						onHashtagClick={() => console.log("Hashtag Cliked")}
						onMentionClick={() => console.log("Mention Clicked")}
						onLinkClick={() => console.log("Link Cliked")}
						textStyle={{ fontSize: 16 }}>
						{post.content}
					</ParsedText>
				)}

				{/* Images */}
				{renderImages()}

				{/* Live Video */}
				{renderLiveVideo()}

				{/* Poll */}
				{post.postType === "poll" && renderPoll()}

				{/* Original Post (for reposts) */}
				{renderOriginalPost()}

				{/* Link Preview */}
				{!post.isRepost && renderLinkPreview()}

				{/* Post Stats */}
				{(post.stats.views > 0 || post.stats.reposts > 0 || post.likes.length > 0) && (
					<View style={styles.postStats}>
						<View style={styles.reactions}>
							{post.likes.slice(0, 3).map(l => {
								return l.user.photoURL ? (
									<Avatar.Image
										key={l.user.uid}
										source={{ uri: l.user.photoURL }}
										size={16}
										style={styles.reactionAvatar}
									/>
								) : (
									<Avatar.Text
										key={l.user.uid}
										label={l.user.username[0]}
										size={16}
										color="#eeeeee"
										style={styles.reactionAvatar}
									/>
								);
							})}
							{post.likes.length > 3 && <Text style={styles.reactionCount}>+{post.likes.length - 3}</Text>}
						</View>
						<View style={styles.stats}>
							{post.stats.views > 0 && <Text style={styles.statText}>{formatCount(post.stats.views)} views</Text>}
							{post.stats.reposts > 0 && <Text style={styles.statText}>{formatCount(post.stats.reposts)} reposts</Text>}
						</View>
					</View>
				)}

				{/* Post Actions */}
				<View style={styles.postActions}>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={handleComment}
						accessibilityLabel={`Comment on post. ${post.stats.comments} comments`}>
						<Icon
							source="chat-outline"
							size={18}
							color="#657786"
						/>
						{post.stats.comments > 0 && <Text style={styles.actionText}>{formatCount(post.stats.comments)}</Text>}
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.actionButton, repostLoading && styles.actionButtonDisabled]}
						onPress={handleRepost}
						disabled={repostLoading}
						accessibilityLabel={`Repost. ${post.stats.reposts} reposts`}>
						<Icon
							source="repeat"
							size={18}
							color="#657786"
						/>
						{post.stats.reposts > 0 && <Text style={styles.actionText}>{formatCount(post.stats.reposts)}</Text>}
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
			</Card.Content>
		</Card>
	);
};

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
		marginLeft: 12,
		flex: 1,
	},
	authorInfoRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginBottom: 2,
	},
	authorName: {
		fontSize: 15,
		fontWeight: "600",
		color: "#1a1a1a",
	},
	postDate: {
		fontSize: 14,
		color: "#657786",
		fontWeight: "400",
	},
	menuButton: {
		padding: 4,
		borderRadius: 20,
		marginLeft: 8,
	},
	postContent: {
		fontSize: 16,
		lineHeight: 22,
		color: "#1a1a1a",
		marginBottom: 12,
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
		width: 300,
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
		backgroundColor: "#ffffff",
		borderWidth: 1,
		borderColor: "#eeeeee",
		padding: 16,
		borderRadius: 3,
		marginBottom: 12,
	},
	pollOption: {
		backgroundColor: "white",
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
});

export default React.memo(PostView);

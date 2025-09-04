/** @format */

import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
	home: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "flex-start",
		backgroundColor: "#f5f5f5",
		padding: 16,
	},
	bold: {
	  fontWeight: "bold"
	},
	h1: {
		fontSize: 32,
		fontWeight: "bold"
	},
	h2: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 16,
		color: "#333",
	},
	h3: {
		fontSize: 18,
		fontWeight: "bold"
	},
	h4: {
		fontSize: 16,
		fontWeight: "bold"
	},
	h5: {
		fontSize: 14,
		fontWeight: "bold"
	},

	// Post Card Styles
	postCard: {
		marginBottom: 12,
		borderRadius: 12,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},

	postHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},

	postAuthorInfo: {
		flex: 1,
		marginLeft: 12,
	},

	postAuthorNameContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},

	authorName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1a1a1a",
	},

	authorUsername: {
		fontSize: 14,
		color: "#657786",
		marginLeft: 4,
	},

	postDate: {
		fontSize: 12,
		color: "#657786",
		marginTop: 2,
	},

	repostIndicator: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},

	repostText: {
		fontSize: 12,
		color: "#657786",
		fontStyle: "italic",
	},

	postContent: {
		fontSize: 16,
		lineHeight: 22,
		color: "#1a1a1a",
		marginBottom: 12,
	},

	// Hashtag Styles
	hashtagContainer: {
		marginBottom: 12,
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

	// Image Styles
	imageContainer: {
		marginBottom: 12,
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

	// Live Video Styles
	liveVideoContainer: {
		backgroundColor: "#ff1744",
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
	},

	liveIndicator: {
		color: "white",
		fontWeight: "bold",
		fontSize: 12,
		marginBottom: 4,
	},

	liveVideoUrl: {
		color: "white",
		fontSize: 12,
		fontFamily: "monospace",
	},

	// Poll Styles
	pollContainer: {
		backgroundColor: "#f8f9fa",
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
	},

	pollQuestion: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1a1a1a",
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
		borderColor: "#1DA1F2",
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

	pollTotal: {
		fontSize: 12,
		color: "#657786",
		textAlign: "center",
		marginTop: 8,
	},

	// Original Post (Repost) Styles
	originalPostCard: {
		marginBottom: 12,
		backgroundColor: "#f8f9fa",
	},

	originalPostHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},

	originalPostAuthor: {
		fontSize: 14,
		fontWeight: "600",
		color: "#1a1a1a",
		marginLeft: 8,
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

	// Post Stats and Actions
	postStats: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 8,
		borderTopWidth: 1,
		borderTopColor: "#e1e8ed",
		marginTop: 8,
	},

	statText: {
		fontSize: 12,
		color: "#657786",
	},

	postActions: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingTop: 8,
	},

	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		padding: 8,
		borderRadius: 20,
	},

	actionButtonActive: {
		backgroundColor: "#fee",
	},

	actionText: {
		fontSize: 12,
		color: "#657786",
		marginLeft: 4,
	},

	actionTextActive: {
		color: "#e91e63",
	},

	// HomePage Enhanced Styles
	homeHeader: {
		padding: 16,
		backgroundColor: "white",
		borderBottomWidth: 1,
		borderBottomColor: "#e1e8ed",
	},

	searchBar: {
		marginBottom: 12,
		elevation: 0,
		backgroundColor: "#f8f9fa",
	},

	filterContainer: {
		flexDirection: "row",
		marginBottom: 8,
		flexWrap: "wrap",
	},

	filterChip: {
		marginRight: 8,
		marginBottom: 4,
		backgroundColor: "#f8f9fa",
	},

	filterChipActive: {
		backgroundColor: "#1DA1F2",
	},

	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f5f5f5",
	},

	loadingText: {
		fontSize: 16,
		color: "#657786",
	},

	emptyContainer: {
		flexGrow: 1,
	},

	emptyState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 32,
	},

	emptyStateTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#1a1a1a",
		textAlign: "center",
		marginBottom: 8,
	},

	emptyStateSubtitle: {
		fontSize: 14,
		color: "#657786",
		textAlign: "center",
		lineHeight: 20,
	},

	fab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 0,
		backgroundColor: "#1DA1F2",
	},
});

export default styles;
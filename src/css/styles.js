/** @format */

import { StyleSheet, Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
	home: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	bold: {
		fontWeight: "bold",
	},
	h1: {
		fontSize: 32,
		fontWeight: "bold",
	},
	h2: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 16,
		color: "#333",
	},
	h3: {
		fontSize: 18,
		fontWeight: "bold",
	},
	h4: {
		fontSize: 16,
		fontWeight: "bold",
	},
	h5: {
		fontSize: 14,
		fontWeight: "bold",
	},
	// Post Card Styles
	postCard: {
		borderRadius: 0,
		elevation: 0,
		borderBottomWidth: 1,
		borderBottomColor: "#eeeeee",
		backgroundColor: "#ffffff",
		shadowRadius: 0
	},
	posHeader: {
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
	},
	repostText: {
		fontSize: 10,
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
	// Poll Styles
	pollContainer: {
		backgroundColor: "#ffffff",
		border: 1,
		borderColor: "#eeeeee",
		padding: 16,
		borderRadius: 3,
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
	pollTotal: {
		fontSize: 12,
		color: "#657786",
		textAlign: "center",
		marginTop: 8,
	},
	// Original Post (Repost) Styles
	originalPostCard: {
		marginBottom: 12,
		backgroundColor: "#ffffff",
		border: 1,
		borderColor: "#eeeeee",
		borderRadius: 3,
		elevation: 0,
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
		paddingLeft: 0
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
		width: "100%",
	},
	searchBar: {
		marginBottom: 12,
		elevation: 0,
		backgroundColor: "#f8f9fa",
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingTop: 32,
		paddingBottom: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E1E8ED",
		width: "100%",
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#14171A",
		letterSpacing: 0.5,
	},
	headerActions: {
	  flexDirection: "row",
	  alignItems: "center",
	  gap: 2
	},
	filterButton: {
		backgroundColor: "#F7F9FA",
		borderRadius: 20,
	},
	// Tab navigation styles
	tabBar: {
		backgroundColor: "#FFFFFF",
		elevation: 0,
		shadowOpacity: 0,
		borderBottomWidth: 1,
		borderBottomColor: "#E1E8ED",
	},

	tabIndicator: {
		backgroundColor: "#0069b5",
		height: 3,
		borderRadius: 1.5,
	},

	tabLabel: {
		fontSize: 16,
		fontWeight: "600",
		textTransform: "none",
		letterSpacing: 0.25,
	},

	sceneContainer: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},

	// Post list styles
	postList: {
		paddingBottom: 100, // Space for FAB
	},

	// Loading state styles
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
	},

	loadingText: {
		fontSize: 16,
		color: "#657786",
		fontWeight: "500",
	},

	// Empty state styles
	emptyState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 32,
		paddingVertical: 64,
	},

	emptyStateTitle: {
		fontSize: 22,
		fontWeight: "700",
		color: "#14171A",
		textAlign: "center",
		marginBottom: 12,
		lineHeight: 28,
	},

	emptyStateSubtitle: {
		fontSize: 16,
		color: "#657786",
		textAlign: "center",
		lineHeight: 22,
		maxWidth: 280,
	},

	emptyContainer: {
		flexGrow: 1,
		justifyContent: "center",
	},

	// Modal styles
	modalContainer: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},

	modalSurface: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		maxHeight: height * 0.85,
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: -2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 8,
	},

	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},

	modalTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#14171A",
		letterSpacing: 0.5,
	},

	// Filter section styles
	filterSection: {
		paddingHorizontal: 20,
		paddingVertical: 16,
	},

	filterSectionTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#14171A",
		marginBottom: 12,
		letterSpacing: 0.25,
	},

	filterChipContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},

	filterChip: {
		marginRight: 8,
		marginBottom: 8,
		backgroundColor: "#F7F9FA",
		borderWidth: 1,
		borderColor: "#E1E8ED",
	},

	// Modal action styles
	modalActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 20,
		backgroundColor: "#F7F9FA",
		borderTopWidth: 1,
		borderTopColor: "#E1E8ED",
	},

	modalButton: {
		flex: 1,
		marginHorizontal: 8,
	},

	// FAB styles
	fab: {
		position: "absolute",
		right: 16,
		bottom: 20,
		backgroundColor: "#0069b5",
		elevation: 8,
		shadowColor: "#1DA1F2",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		color: "#ffffff"
	},

	// Additional utility styles
	divider: {
		backgroundColor: "#E1E8ED",
		height: 1,
	},

	// Responsive styles for different screen sizes
	"@media (max-width: 768)": {
		headerContainer: {
			paddingHorizontal: 12,
		},

		modalSurface: {
			maxHeight: height * 0.9,
		},

		filterSection: {
			paddingHorizontal: 16,
		},

		modalActions: {
			paddingHorizontal: 16,
		},
	},

	// Dark mode support (optional)
	"@media (prefers-color-scheme: dark)": {
		home: {
			backgroundColor: "#15202B",
		},

		headerContainer: {
			backgroundColor: "#15202B",
			borderBottomColor: "#38444D",
		},

		headerTitle: {
			color: "#FFFFFF",
		},

		tabBar: {
			backgroundColor: "#15202B",
			borderBottomColor: "#38444D",
		},

		sceneContainer: {
			backgroundColor: "#15202B",
		},

		loadingContainer: {
			backgroundColor: "#15202B",
		},

		loadingText: {
			color: "#8B98A5",
		},

		emptyStateTitle: {
			color: "#FFFFFF",
		},

		emptyStateSubtitle: {
			color: "#8B98A5",
		},

		modalSurface: {
			backgroundColor: "#1C2938",
		},

		modalHeader: {
			backgroundColor: "#1C2938",
		},

		modalTitle: {
			color: "#FFFFFF",
		},

		filterSectionTitle: {
			color: "#FFFFFF",
		},

		filterChip: {
			backgroundColor: "#253341",
			borderColor: "#38444D",
		},

		modalActions: {
			backgroundColor: "#192734",
			borderTopColor: "#38444D",
		},
	},
	container: {
		flexGrow: 1,
		justifyContent: "center",
		padding: 20,
		backgroundColor: "#f5f5f5",
	},
	formContainer: {
		backgroundColor: "#fff",
	},
	input: {
		marginBottom: 15,
		backgroundColor: "transparent",
	},
	button: {
		marginTop: 15,
		marginBottom: 10,
	},
	backButton: {
		marginTop: 5,
		marginBottom: 10,
	},
	skipButton: {
		marginTop: 5,
		marginBottom: 10,
	},
	errorText: {
		color: "red",
		marginBottom: 10,
	},
	loginText: {
		textAlign: "center",
		marginTop: 20,
		color: "#0069b5",
	},
	label: {
		fontSize: 16,
		marginBottom: 5,
		color: "#333",
	},
	datePickerButton: {
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 4,
		alignItems: "flex-start",
	},
	selectContainer: {
		position: "relative",
		marginBottom: 15,
	},
	genderOptions: {
		position: "absolute",
		top: "100%",
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		borderRadius: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		zIndex: 1,
		padding: 10,
	},
	genderOptionButton: {
		marginVertical: 5,
	},
});

export default styles;

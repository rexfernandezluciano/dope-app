/** @format */

// Enhanced type definitions with better structure
export interface Post {
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
	poll?: PollData;
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

export interface PollData {
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
	expiresIn: number | string;
}

export interface CreatePostData {
	content?: string;
	imageUrls?: string[];
	postType: "text" | "live_video" | "poll" | "repost";
	privacy?: "public" | "private" | "followers";
	liveVideoUrl?: string;
	originalPostId?: string;
	poll?: {
		question: string;
		options: Array<{ text: string }>;
		expiresIn?: number;
		allowMultiple?: boolean;
	};
}

export interface PostFilters {
	limit?: number;
	cursor?: string;
	author?: string;
	postType?: Post["postType"];
	hasImages?: boolean;
	hasLiveVideo?: boolean;
	search?: string;
	random?: boolean;
	quality?: boolean;
	sortBy?: "asc" | "desc";
	timeRange?: "hour" | "day" | "week" | "month" | "all";
}

export interface PostResponse<T = Post | Post[]> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
	pagination?: {
		hasMore: boolean;
		nextCursor?: string;
		limit?: number;
	};
}

export interface VoteRequest {
	optionIds: string[];
}

export interface ShareRequest {
	platform?: "twitter" | "facebook" | "linkedin" | "copy";
	message?: string;
}

export interface FilterState {
	postType: "all" | "text" | "live_video" | "poll" | "repost";
	sortBy: "asc" | "desc";
	timeRange: "hour" | "day" | "week" | "month" | "all";
	hasImages: boolean;
	quality: boolean;
	random: boolean;
}

/** @format */

import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Linking } from "react-native";
import DOPEClient, { DOPEClientError } from "../api/config/DOPEClient";
import AuthService from "../services/AuthService";

// User service interface for fetching user data
interface UserData {
	uid: string;
	name: string;
	username: string;
	displayName?: string;
}

// Component to resolve mention UIDs to display names
interface MentionComponentProps {
	uid: string;
	onMentionClick: (uid: string) => void;
	style?: any;
}

const MentionComponent: React.FC<MentionComponentProps> = ({ uid, onMentionClick, style = {} }) => {
	const [displayName, setDisplayName] = useState(`@${uid}`);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const client = DOPEClient.getInstance();
				const headers = await getAuthHeaders();

				const response = await client.get<{
					user: UserData;
					status: string;
					message?: string;
				}>(`/v1/users/find/${uid}`, undefined, { headers });

				if (response.success && response.data.user) {
					const userData = response.data.user;
					setDisplayName(`@${userData.name || userData.username || uid}`);
				} else {
					// Keep the uid as fallback
					setDisplayName(`@${uid}`);
				}
			} catch (error) {
				console.error("Failed to resolve mention:", error);
				// Keep the uid as fallback
				setDisplayName(`@${uid}`);
			} finally {
				setLoading(false);
			}
		};

		if (uid) {
			fetchUserData();
		}
	}, [uid]);

	// Helper function to get auth headers
	const getAuthHeaders = async (): Promise<Record<string, string>> => {
		await AuthService.waitForInitialization();
		const token = AuthService.token;
		return token ? { Authorization: `Bearer ${token}` } : {};
	};

	return (
		<Text
			style={[
				{
					color: "#0069b5",
					fontWeight: "600",
				},
				style,
			]}
			onPress={() => {
				onMentionClick(uid);
			}}>
			{loading ? `@${uid}` : displayName}
		</Text>
	);
};

// Text parsing options interface
interface TextParsingOptions {
	onHashtagClick?: (hashtag: string) => void;
	onMentionClick?: (mention: string) => void;
	onLinkClick?: (url: string) => void;
	style?: any;
	hashtagStyle?: any;
	mentionStyle?: any;
	linkStyle?: any;
	textStyle?: any;
}

/**
 * Parse text content to handle line breaks, hashtags, mentions, and links
 * @param text - The text content to parse
 * @param options - Parsing options
 * @returns JSX.Element - Parsed text with interactive elements
 */
export const parseTextContent = (text: string, options: TextParsingOptions = {}): JSX.Element | null => {
	if (!text) return null;

	const {
		onHashtagClick = (hashtag: string) => console.log("Hashtag clicked:", hashtag),
		onMentionClick = (mention: string) => console.log("Mention clicked:", mention),
		onLinkClick = (url: string) => Linking.openURL(url).catch(err => console.error("Failed to open URL:", err)),
		style = {},
		textStyle = {},
	} = options;

	// Split by line breaks first
	const lines = text.split("\n");

	return (
		<View style={style}>
			{lines.map((line, lineIndex) => (
				<View key={lineIndex}>
					<Text style={textStyle}>{parseLineContent(line, { onHashtagClick, onMentionClick, onLinkClick, ...options })}</Text>
					{lineIndex < lines.length - 1 && <Text>{"\n"}</Text>}
				</View>
			))}
		</View>
	);
};

/**
 * Parse a single line of text for hashtags, mentions, and links
 * @param line - The line of text to parse
 * @param handlers - Event handlers and styles for different elements
 * @returns React.ReactNode[] - Array of parsed elements
 */
const parseLineContent = (line: string, handlers: TextParsingOptions): React.ReactNode[] => {
	if (!line.trim()) return [<Text key="empty"> </Text>];

	const {
		onHashtagClick,
		onMentionClick,
		onLinkClick,
		hashtagStyle = { color: "#0069b5", fontWeight: "600" },
		mentionStyle = { color: "#0069b5", fontWeight: "600" },
		linkStyle = { color: "#0069b5", textDecorationLine: "underline" },
		textStyle = {},
	} = handlers;

	// Regular expressions for different content types
	const patterns = {
		hashtag: /#[\w\u00c0-\u024f\u1e00-\u1eff]+/g,
		structuredMention: /@\[([^\]]+)\]\(([^)]+)\)/g, // @[username](uid) format
		simpleMention: /@[\w\u00c0-\u024f\u1e00-\u1eff]+/g, // @username format
		url: /(https?:\/\/[^\s]+)/g,
		email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
	};

	// Create a combined pattern to find all matches (structured mentions first to avoid conflicts)
	const combinedPattern = new RegExp(
		`(${patterns.hashtag.source})|(${patterns.structuredMention.source})|(${patterns.simpleMention.source})|(${patterns.url.source})|(${patterns.email.source})`,
		"g",
	);

	const elements: React.ReactNode[] = [];
	let lastIndex = 0;
	let match;

	while ((match = combinedPattern.exec(line)) !== null) {
		// Add text before the match
		if (match.index > lastIndex) {
			elements.push(
				<Text
					key={`text-${lastIndex}`}
					style={textStyle}>
					{line.substring(lastIndex, match.index)}
				</Text>,
			);
		}

		const matchedText = match[0];

		// Determine the type of match and create appropriate element
		if (matchedText.startsWith("#")) {
			// Hashtag
			elements.push(
				<Text
					key={`hashtag-${match.index}`}
					style={hashtagStyle}
					onPress={() => {
						onHashtagClick?.(matchedText.substring(1));
					}}>
					{matchedText}
				</Text>,
			);
		} else if (matchedText.match(/@\[([^\]]+)\]\(([^)]+)\)/)) {
			// Structured mention - @[username](uid)
			const structuredMatch = matchedText.match(/@\[([^\]]+)\]\(([^)]+)\)/);
			if (structuredMatch) {
				const [, username, uid] = structuredMatch;
				elements.push(
					<Text
						key={`structured-mention-${match.index}`}
						style={mentionStyle}
						onPress={() => {
							onMentionClick?.(uid);
						}}>
						@{username}
					</Text>,
				);
			}
		} else if (matchedText.startsWith("@")) {
			// Simple mention - @username (resolve uid to display name via API)
			const uid = matchedText.substring(1);
			elements.push(
				<MentionComponent
					key={`mention-${match.index}`}
					uid={uid}
					onMentionClick={onMentionClick || (() => {})}
					style={mentionStyle}
				/>,
			);
		} else if (matchedText.startsWith("http")) {
			// URL
			elements.push(
				<Text
					key={`url-${match.index}`}
					style={linkStyle}
					onPress={() => {
						onLinkClick?.(matchedText);
					}}>
					{matchedText}
				</Text>,
			);
		} else if (matchedText.includes("@") && matchedText.includes(".")) {
			// Email
			elements.push(
				<Text
					key={`email-${match.index}`}
					style={linkStyle}
					onPress={() => {
						Linking.openURL(`mailto:${matchedText}`).catch(err => console.error("Failed to open email client:", err));
					}}>
					{matchedText}
				</Text>,
			);
		}

		lastIndex = match.index + matchedText.length;
	}

	// Add remaining text
	if (lastIndex < line.length) {
		elements.push(
			<Text
				key={`text-${lastIndex}`}
				style={textStyle}>
				{line.substring(lastIndex)}
			</Text>,
		);
	}

	return elements.length > 0
		? elements
		: [
				<Text
					key="empty"
					style={textStyle}>
					{line}
				</Text>,
		  ];
};

/**
 * Extract hashtags from text
 * @param text - The text to extract hashtags from
 * @returns Array of hashtags (without #)
 */
export const extractHashtags = (text: string): string[] => {
	if (!text) return [];
	const matches = text.match(/#[\w\u00c0-\u024f\u1e00-\u1eff]+/g);
	return matches ? matches.map(tag => tag.substring(1)) : [];
};

/**
 * Extract mentions from text (supports both @username and @[username](uid) formats)
 * @param text - The text to extract mentions from
 * @returns Array of mention objects with username and uid
 */
export const extractMentions = (text: string): Array<{ username: string; uid: string }> => {
	if (!text) return [];

	const mentions: Array<{ username: string; uid: string }> = [];

	// Extract structured mentions @[username](uid)
	const structuredMatches = text.match(/@\[([^\]]+)\]\(([^)]+)\)/g);
	if (structuredMatches) {
		structuredMatches.forEach(match => {
			const parsed = match.match(/@\[([^\]]+)\]\(([^)]+)\)/);
			if (parsed) {
				const [, username, uid] = parsed;
				mentions.push({ username, uid });
			}
		});
	}

	// Extract simple mentions @username (uid same as username)
	const simpleMatches = text.match(/@[\w\u00c0-\u024f\u1e00-\u1eff]+/g);
	if (simpleMatches) {
		simpleMatches.forEach(match => {
			const username = match.substring(1);
			// Only add if not already found in structured mentions
			if (!mentions.some(m => m.username === username)) {
				mentions.push({ username, uid: username });
			}
		});
	}

	return mentions;
};

/**
 * Extract simple mention usernames/UIDs from text (backward compatibility)
 * @param text - The text to extract mentions from
 * @returns Array of usernames/UIDs (strings)
 */
export const extractSimpleMentions = (text: string): string[] => {
	const mentions = extractMentions(text);
	return mentions.map(m => m.uid);
};

/**
 * Extract URLs from text
 * @param text - The text to extract URLs from
 * @returns Array of URLs
 */
export const extractUrls = (text: string): string[] => {
	if (!text) return [];
	const matches = text.match(/(https?:\/\/[^\s]+)/g);
	return matches || [];
};

/**
 * Validate and clean text content
 * @param text - The text to clean
 * @returns Cleaned text
 */
export const cleanTextContent = (text: string): string => {
	if (!text) return "";
	return text.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
};

// Enhanced component for easier usage
interface ParsedTextProps {
	children: string;
	onHashtagPress?: (hashtag: string) => void;
	onMentionPress?: (mention: string) => void;
	onUrlPress?: (url: string) => void;
	style?: any;
	textStyle?: any;
	hashtagStyle?: any;
	mentionStyle?: any;
	linkStyle?: any;
}

export const ParsedText: React.FC<ParsedTextProps> = ({
	children,
	onHashtagPress,
	onMentionPress,
	onUrlPress,
	style,
	textStyle,
	hashtagStyle,
	mentionStyle,
	linkStyle,
}) => {
	return parseTextContent(children, {
		onHashtagClick: onHashtagPress,
		onMentionClick: onMentionPress,
		onLinkClick: onUrlPress,
		style,
		textStyle,
		hashtagStyle,
		mentionStyle,
		linkStyle,
	});
};

// Hook for text parsing utilities
export const useTextParser = () => {
	return {
		parseTextContent,
		extractHashtags,
		extractMentions,
		extractUrls,
		cleanTextContent,
	};
};

export default ParsedText;

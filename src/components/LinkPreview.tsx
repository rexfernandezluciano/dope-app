/** @format */

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, Image, ActivityIndicator, Linking, Pressable, StyleSheet, Alert } from "react-native";
import { getLinkPreview, getPreviewFromContent } from "link-preview-js";

interface LinkPreviewData {
	url: string;
	title?: string;
	siteName?: string;
	description?: string;
	images?: string[];
	mediaType?: string;
	contentType?: string;
	favicons?: string[];
}

interface LinkPreviewProps {
	text: string;
	maxPreviews?: number;
	showFavicon?: boolean;
	customStyle?: any;
}

export default function LinkPreview({ text, maxPreviews = 1, showFavicon = true, customStyle }: LinkPreviewProps) {
	const [previews, setPreviews] = useState<{ [url: string]: LinkPreviewData }>({});
	const [loading, setLoading] = useState<{ [url: string]: boolean }>({});
	const [errors, setErrors] = useState<{ [url: string]: string }>({});

	// Extract and clean URLs from text
	const extractedUrls = useMemo(() => {
		if (!text) return [];

		// More comprehensive URL regex that handles various formats
		const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
		const urls = text.match(urlRegex) || [];

		// Clean URLs and remove duplicates
		const cleanUrls = urls
			.map(url => {
				// Remove trailing punctuation that's likely not part of the URL
				return url.replace(/[.,;!?'")\]}]+$/, "");
			})
			.filter((url, index, array) => array.indexOf(url) === index) // Remove duplicates
			.slice(0, maxPreviews); // Limit number of previews

		return cleanUrls;
	}, [text, maxPreviews]);

	// Fetch link preview data
	const fetchLinkPreview = useCallback(
		async (url: string) => {
			if (previews[url] || loading[url]) return;

			setLoading(prev => ({ ...prev, [url]: true }));
			setErrors(prev => ({ ...prev, [url]: "" }));

			try {
				// Use link-preview-js to get preview data
				const previewData = await getLinkPreview(url, {
					timeout: 10000,
					followRedirects: "follow",
					handleRedirects: (baseURL: string, forwardedURL: string) => {
						return forwardedURL;
					},
					headers: {
						"User-Agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)",
					},
				});

				// Transform the data to our interface
				const transformedData: LinkPreviewData = {
					url,
					title: previewData.title || "",
					siteName: previewData.siteName || "",
					description: previewData.description || "",
					images: previewData.images || [],
					mediaType: previewData.mediaType || "",
					contentType: previewData.contentType || "",
					favicons: previewData.favicons || [],
				};

				setPreviews(prev => ({ ...prev, [url]: transformedData }));
			} catch (error) {
				console.warn("Failed to fetch link preview for:", url, error);
				setErrors(prev => ({
					...prev,
					[url]: "Failed to load preview",
				}));
			} finally {
				setLoading(prev => ({ ...prev, [url]: false }));
			}
		},
		[previews, loading],
	);

	// Fetch previews for all extracted URLs
	useEffect(() => {
		extractedUrls.forEach(url => {
			fetchLinkPreview(url);
		});
	}, [extractedUrls, fetchLinkPreview]);

	// Handle link press
	const handleLinkPress = useCallback(async (url: string) => {
		try {
			const supported = await Linking.canOpenURL(url);
			if (supported) {
				await Linking.openURL(url);
			} else {
				Alert.alert("Error", "Cannot open this URL");
			}
		} catch (error) {
			Alert.alert("Error", "Failed to open link");
		}
	}, []);

	// Get the best image from preview data
	const getBestImage = useCallback((previewData: LinkPreviewData) => {
		if (!previewData.images || previewData.images.length === 0) return null;

		// Prefer larger images and common formats
		const sortedImages = previewData.images.sort((a, b) => {
			// Simple heuristic: longer URLs often mean higher resolution
			return b.length - a.length;
		});

		return sortedImages[0];
	}, []);

	// Get favicon URL
	const getFavicon = useCallback(
		(previewData: LinkPreviewData) => {
			if (!showFavicon || !previewData.favicons || previewData.favicons.length === 0) {
				return null;
			}
			return previewData.favicons[0];
		},
		[showFavicon],
	);

	// Format domain name from URL
	const getDomainName = useCallback((url: string) => {
		try {
			const domain = new URL(url).hostname;
			return domain.replace(/^www\./, "");
		} catch {
			return url;
		}
	}, []);

	// Render individual link preview
	const renderPreview = useCallback(
		(url: string) => {
			const isLoading = loading[url];
			const error = errors[url];
			const previewData = previews[url];

			if (isLoading) {
				return (
					<View
						style={[styles.previewContainer, styles.loadingContainer, customStyle]}
						key={url}>
						<ActivityIndicator
							size="small"
							color="#1DA1F2"
						/>
						<Text style={styles.loadingText}>Loading preview...</Text>
					</View>
				);
			}

			if (error || !previewData) {
				return null; // Don't show anything if there's an error or no data
			}

			const bestImage = getBestImage(previewData);
			const favicon = getFavicon(previewData);
			const domain = getDomainName(url);

			return (
				<Pressable
					key={url}
					style={[styles.previewContainer, customStyle]}
					onPress={() => handleLinkPress(url)}
					android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
					{/* Preview Image */}
					{bestImage && (
						<Image
							source={{ uri: bestImage }}
							style={styles.previewImage}
							resizeMode="cover"
							onError={() => {
								// Remove failed image from preview data
								setPreviews(prev => ({
									...prev,
									[url]: { ...prev[url], images: [] },
								}));
							}}
						/>
					)}

					<View style={styles.previewContent}>
						{/* Site info with favicon */}
						<View style={styles.siteInfo}>
							{favicon && (
								<Image
									source={{ uri: favicon }}
									style={styles.favicon}
									onError={() => {
										// Silently handle favicon errors
									}}
								/>
							)}
							<Text
								style={styles.siteName}
								numberOfLines={1}>
								{previewData.siteName || domain}
							</Text>
						</View>

						{/* Title */}
						{previewData.title && (
							<Text
								style={styles.previewTitle}
								numberOfLines={2}>
								{previewData.title}
							</Text>
						)}

						{/* Description */}
						{previewData.description && (
							<Text
								style={styles.previewDescription}
								numberOfLines={3}>
								{previewData.description}
							</Text>
						)}

						{/* URL */}
						<Text
							style={styles.previewUrl}
							numberOfLines={1}>
							{url}
						</Text>
					</View>
				</Pressable>
			);
		},
		[loading, errors, previews, customStyle, getBestImage, getFavicon, getDomainName, handleLinkPress],
	);

	// Don't render anything if no URLs found
	if (extractedUrls.length === 0) {
		return null;
	}

	return <View style={styles.container}>{extractedUrls.map(renderPreview)}</View>;
}

const styles = StyleSheet.create({
	container: {
		marginTop: 12,
		gap: 8,
	},
	previewContainer: {
		borderWidth: 1,
		borderColor: "#E1E8ED",
		borderRadius: 12,
		overflow: "hidden",
		backgroundColor: "#FFFFFF",
	},
	loadingContainer: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		gap: 8,
	},
	loadingText: {
		fontSize: 14,
		color: "#657786",
	},
	previewImage: {
		width: "100%",
		height: 200,
		backgroundColor: "#F7F9FA",
	},
	previewContent: {
		padding: 12,
	},
	siteInfo: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 4,
		gap: 6,
	},
	favicon: {
		width: 16,
		height: 16,
		borderRadius: 2,
	},
	siteName: {
		fontSize: 13,
		color: "#657786",
		fontWeight: "400",
		textTransform: "uppercase",
	},
	previewTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "#14171A",
		lineHeight: 20,
		marginBottom: 4,
	},
	previewDescription: {
		fontSize: 14,
		color: "#657786",
		lineHeight: 18,
		marginBottom: 8,
	},
	previewUrl: {
		fontSize: 13,
		color: "#1DA1F2",
		fontWeight: "400",
	},
});

// Alternative simplified version for basic use cases
export const SimpleLinkPreview = ({ text }: { text: string }) => {
	return (
		<LinkPreview
			text={text}
			maxPreviews={1}
			showFavicon={true}
		/>
	);
};

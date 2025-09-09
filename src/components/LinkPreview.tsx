/** @format */

import React, { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, Linking, Pressable } from "react-native";
// import { getLinkPreview } from "link-preview-js";
 
export default function LinkPreview({ text }) {
	const [previews, setPreviews] = useState({});

	// Extract links only
	const urls = text.match(/https?:\/\/[^\s]+/g) || [];

	useEffect(() => {
		urls.forEach(url => {
			if (!previews[url]) {
				// getLinkPreview(url)
// 					.then(data => setPreviews(prev => ({ ...prev, [url]: data })))
// 					.catch(() => {}); // ignore errors
			}
		});
	}, [text]);

	return (
		<View style={{ marginTop: 10, padding: 10 }}>
			{urls.map((url, index) => {
				const preview = previews[url];

				if (!preview) {
					return (
						<View
							key={index}
							style={{ marginVertical: 10 }}>
							<ActivityIndicator
								size="small"
								color="gray"
							/>
						</View>
					);
				}

				return (
					<Pressable
						key={index}
						onPress={() => Linking.openURL(url)}
						style={{
							marginVertical: 10,
							borderWidth: 1,
							borderColor: "#ddd",
							borderRadius: 10,
							overflow: "hidden",
						}}>
						{preview.images?.length > 0 && (
							<Image
								source={{ uri: preview.images[0] }}
								style={{ width: "100%", height: 150 }}
								resizeMode="cover"
							/>
						)}
						<View style={{ padding: 8 }}>
							<Text style={{ fontWeight: "bold", fontSize: 16 }}>{preview.title}</Text>
							{preview.description ? <Text style={{ fontSize: 14, color: "gray" }}>{preview.description}</Text> : null}
							<Text style={{ fontSize: 12, color: "blue" }}>{url}</Text>
						</View>
					</Pressable>
				);
			})}
		</View>
	);
}

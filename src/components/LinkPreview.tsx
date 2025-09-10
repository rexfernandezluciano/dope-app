/** @format */

import React, { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, Linking, Pressable } from "react-native";

export default function LinkPreview({ text }) {
	const [previews, setPreviews] = useState({});
	const [link, setLink] = useState("");

	// Extract links only
	const urls = text.match(/https?:\/\/[^\s]+/g) || [];

	useEffect(() => {
		setLink(urls[0]);
	}, [text]);

	return <View></View>
}

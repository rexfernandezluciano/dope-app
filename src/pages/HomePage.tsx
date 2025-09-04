/** @format */

import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import styles from "../css/styles";
import DOPEClient from "../api/config/DOPEClient";

const HomePage = () => {
	const [posts, setPosts] = useState(null);
	const client = DOPEClient.getInstance();

	useEffect(() => {
		const fetchHomeFeed = async () => {
			try {
				const feed = await client.getHomeFeed();
				if (feed) {
					setPosts(feed);
					console.log("Home Feed:", JSON.stringify(feed, null, 2));
				}
			} catch (error) {
				console.error(error.message);
			}
		};
		fetchHomeFeed();
	}, [posts]);
	return (
		<View style={styles.home}>
			<Text style={styles.bold}>Feed</Text>
		</View>
	);
};

export default HomePage;
